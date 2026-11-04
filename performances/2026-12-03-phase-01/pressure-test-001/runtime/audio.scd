/* Real local SC engine. Play original B material under one typed score/event.
   OSC is accepted only on loopback. Independent local terminal ARM/KILL bypasses the conductor.
   No claim of physical safety hardware or external multichannel output.
*/
(
var root=thisProcess.nowExecutingPath.dirname;
var appPath=(root +/+ "../../../../local-only/toolchains/SuperCollider.app").standardizePath;
var address=NetAddr("127.0.0.1",19731);
var options=ServerOptions.new.numInputBusChannels_(0).numOutputBusChannels_(2)
    .sampleRate_(48000).hardwareBufferSize_(256).memSize_(65536).maxNodes_(1024);
Server.program=(appPath +/+ "Contents/Resources/scsynth").quote;
s=Server(\criticalLocal,NetAddr("127.0.0.1",57110),options);
Server.default=s; // Recorder numeric root target must share this server allocator.
~killed=true;~last=Main.elapsedTime;~seq=(-1);~session="";~seen=Set.new;~pre=nil;~post=nil;~hold=nil;~watchSafe=true;
~freePlayers={ [~pre,~post,~hold].do({|n|if(n.notNil,{n.free})});~pre=nil;~post=nil;~hold=nil };
thisProcess.openUDPPort(57131);
s.waitForBoot({
    SynthDef(\cfBuffer,{|out=16,buf=0,start=0,life=45,gate=1|
        var sig=PlayBuf.ar(2,buf,BufRateScale.kr(buf),1,start,0,doneAction:2);
        var env=EnvGen.kr(Env.linen(0.004,(life-0.014).max(0.01),0.01),doneAction:2);
        Out.ar(out,sig*env*Lag.kr(gate,0.025));
    }).add;
    SynthDef(\cfHeld,{|out=16,amp=0,pressure=0.8|
        var f=311.13;
        var sig=(SinOsc.ar(f+(SinOsc.kr(1.9)*1.8),SinOsc.ar(f*1.618)*pressure*2)
            +(SinOsc.ar(f*2.03)*0.17));
        Out.ar(out,Pan2.ar(sig*Lag.kr(amp.clip(0,0.008),0.12),0));
    }).add;
    SynthDef(\cfMain,{|gate=0,width=0.4|
        var x=LeakDC.ar(In.ar(16,2)),mid,side;
        mid=(x[0]+x[1])*0.5;side=(x[0]-x[1])*0.5*Lag.kr(width.clip(0.1,1.2),0.12);
        Out.ar(0,Limiter.ar([mid+side,mid-side]*0.55,0.7,0.01)*Lag.kr(gate,0.03));
    }).add;
    s.sync;
    ~buffer=Buffer.read(s,root +/+ "outputs/B.wav");s.sync;
    ~group=Group.head(s.defaultGroup);
    ~main=Synth.tail(s.defaultGroup,\cfMain,[\gate,0]);
    s.recorder.recHeaderFormat="wav";s.recorder.recSampleFormat="int24";
    OSCdef(\cfArm,{|m,time,addr|
        if(addr.ip=="127.0.0.1",{~killed=false;address.sendMsg('/critical/armed',1);"LOCAL_ARM".postln});
    },'/critical/arm',recvPort:57131);
    OSCdef(\cfKill,{|m,time,addr|
        if(addr.ip=="127.0.0.1",{
            ~killed=true;~main.set(\gate,0);~freePlayers.value;
            address.sendMsg('/critical/manual_kill',m[1].asString,Main.elapsedTime);"LOCAL_KILL_LATCHED".postln;
        });
    },'/critical/kill',recvPort:57131);
    OSCdef(\cfRecord,{|m,time,addr|
        if(addr.ip=="127.0.0.1",{
            Routine({
                if(s.recorder.isRecording,{s.stopRecording;0.1.wait});
                s.prepareForRecord(m[1].asString,numChannels:2);s.sync;
                s.record(node: RootNode(s));0.12.wait;
                address.sendMsg('/critical/recording',m[1].asString,Main.elapsedTime);
            }).play(SystemClock);
        });
    },'/critical/record',recvPort:57131);
    OSCdef(\cfStopRecord,{|m,time,addr|
        if(addr.ip=="127.0.0.1",{s.stopRecording;address.sendMsg('/critical/record_stopped',Main.elapsedTime)});
    },'/critical/stop_record',recvPort:57131);
    OSCdef(\cfScore,{|m,time,addr|
        var eventId,eventType,isReset;
        if((addr.ip=="127.0.0.1") and: {m.size==20},{
            eventId=m[12].asString;eventType=m[13].asString;isReset=(eventType=="RESET");
            if(isReset and: {m[1].asString!=~session},{~session=m[1].asString;~seq=(-1);~seen.clear});
            if((m[1].asString==~session) and: {m[2]>~seq},{
                ~seq=m[2];~last=Main.elapsedTime;~watchSafe=false;
                if(((m[17]==1) or: {m[18]==1}) or: {m[15]==0},{
                    if(m[17]==1,{~killed=true});~main.set(\gate,0);~freePlayers.value;
                },{
                    ~main.set(\gate,if(~killed,{0},{1}),\width,0.1+(m[9].clip(0,1)*1.1));
                    if(eventId.size>0,{
                        if(~seen.includes(eventId),{
                            address.sendMsg('/critical/event_duplicate',eventId,m[2],m[19]);
                        },{
                            ~seen.add(eventId);
                            if(~killed.not,{
                                if(isReset,{
                                    ~freePlayers.value;
                                    ~pre=Synth.head(~group,\cfBuffer,[\buf,~buffer,\start,0,\life,45]).register;
                                    ~pre.onFree({~pre=nil});
                                    ~hold=Synth.head(~group,\cfHeld,[\amp,0]);
                                });
                                if(eventType=="OVERRIDE",{
                                    if(~pre.notNil,{~pre.free;~pre=nil});
                                    if(~hold.notNil,{~hold.set(\amp,0)});
                                    ~post=Synth.head(~group,\cfBuffer,[\buf,~buffer,\start,45*~buffer.sampleRate,\life,33.75]).register;
                                    ~post.onFree({~post=nil});
                                });
                            });
                            address.sendMsg('/critical/event_applied',eventId,m[2],m[19],eventType,Main.elapsedTime,if(~killed,{0},{1}));
                        });
                    });
                    if(~hold.notNil,{~hold.set(\amp,if((m[5].asString=="HOLD") and: {m[3]>=45000},{0.004},{0}),\pressure,m[10].clip(0,1))});
                });
                address.sendMsg('/critical/frame_applied',m[1],m[2],m[19],Main.elapsedTime);
            },{address.sendMsg('/critical/seq_rejected',m[2])});
        });
    },'/critical/score',recvPort:57131);
    SystemClock.sched(0.05,{
        if((Main.elapsedTime-~last)>0.75,{
            if(~watchSafe.not,{
                ~watchSafe=true;~main.set(\gate,0);~freePlayers.value;
                address.sendMsg('/critical/watchdog_safe',~seq,Main.elapsedTime);"SC_WATCHDOG_SAFE".postln;
            });
        });0.05;
    });
    OSCdef(\cfQuit,{Routine({s.stopRecording;~main.set(\gate,0);0.2.wait;s.quit;0.3.wait;0.exit}).play(SystemClock)},'/critical/quit',recvPort:57131);
    address.sendMsg('/critical/ready',s.sampleRate,~buffer.sampleRate,~buffer.numFrames);
    "CRITICAL_AUDIO_READY".postln;
});
s.boot;
)
