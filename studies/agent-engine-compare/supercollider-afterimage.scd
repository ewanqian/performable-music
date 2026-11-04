/* Original Afterimage synthesis/render source. Core SuperCollider UGens only.
   No hardware audio, no live OSC listener, no sample packs, no reverb or drums.
   sclang -D supercollider-afterimage.scd
   Optional env AFTERIMAGE_VARIANT=A|B (default: render both).
*/
(
var root = thisProcess.nowExecutingPath.dirname;
var cfg = thisProcess.interpreter.executeFile(root +/+ "render-parameters.scd");
var data = thisProcess.interpreter.executeFile(root +/+ "score-data.scd");
var outputDir = "AFTERIMAGE_OUTPUT_DIR".getenv ? (root +/+ "renders");
var requested = "AFTERIMAGE_VARIANT".getenv;
var variants = if(requested.isNil, { [\A, \B] }, { [requested.asSymbol] });
var piano, master, options, clock, renderOne;
var program = "AFTERIMAGE_SCSYNTH".getenv;
if(program.notNil, { Server.program = program });
File.mkdir(outputDir);

piano = SynthDef(\afterimageKey, { |out=16, freq=440, dur=0.5, vel=0.5,
    amp=0.115, pan=0, memory=0, seed=4104|
    var mem=memory.clip(0,1), brightness, release, attack, keyEnv, decay, partials, hammer, signal;
    RandSeed.ir(1,seed);
    brightness = cfg[\brightness] + (cfg[\memoryBrightness]-cfg[\brightness])*mem;
    release = cfg[\release] + (cfg[\memoryRelease]-cfg[\release])*mem;
    attack = 0.002 + (cfg[\memoryAttack]-0.002)*mem;
    keyEnv = EnvGen.kr(Env.linen(attack, dur.max(0.02), release, 1, -4), doneAction:2);
    decay = (3.2 * (440/freq).sqrt).clip(0.4,5.0);
    partials = Mix.fill(10, { |i|
        var h=i+1;
        var ratio=h*(1+(0.00045*h*h)); // small string inharmonicity, not an acoustic sample
        var shape=(1-mem) + (mem * if(i.even, {0.65}, {0.18}));
        var envelope=EnvGen.kr(Env.perc(0.001, decay/(1+(i*0.32)),1,-5));
        var strings=(SinOsc.ar(freq*ratio,0) + (SinOsc.ar(freq*ratio*1.0009,0.17)*0.22));
        strings * envelope * shape / h.pow(1.6)
    });
    hammer = BPF.ar(WhiteNoise.ar, (freq*3.5).clip(250,9000),0.35)
        * EnvGen.kr(Env.perc(0.001,0.016)) * 0.025 * (1-mem);
    signal = LPF.ar(partials+hammer,(freq*(5+(vel*9))*brightness).clip(250,14000));
    signal = LeakDC.ar(signal) * keyEnv * vel.clip(0,1).pow(1.45) * amp.clip(0,0.15);
    Out.ar(out,Pan2.ar(signal,pan.clip(-0.35,0.35)));
});
master = SynthDef(\afterimageOutput, {
    var signal=LeakDC.ar(In.ar(16,2));
    Out.ar(0,Limiter.ar(signal,cfg[\ceiling],0.01));
});
options = ServerOptions.new.numOutputBusChannels_(2).numInputBusChannels_(0)
    .numAudioBusChannels_(64).memSize_(65536).maxNodes_(1024);
clock = TempoClock.new(1); // all Score timestamps below are explicitly seconds

renderOne = { |index|
    var variant, messages, score, endTime, output;
    if(index>=variants.size, {
        "AFTERIMAGE_ALL_RENDERS_DONE".postln;
        0.exit;
    }, {
        variant=variants[index];
        if(data[variant].isNil, { "Unknown variant".postln; 2.exit });
        messages=List.new;
        messages.add([0.0,[\d_recv,piano.asBytes]]);
        messages.add([0.0,[\d_recv,master.asBytes]]);
        messages.add([0.01,[\g_new,1,0,0]]);
        messages.add([0.02,[\s_new,\afterimageOutput,900,1,0]]);
        data[variant].do({ |event,i|
            messages.add([
                cfg[\preroll]+(event[0]*60/cfg[\bpm]),
                [\s_new,\afterimageKey,1000+i,0,1,
                    \out,16, \freq,event[1].midicps, \dur,event[2]*60/cfg[\bpm],
                    \vel,event[3]/127, \pan,event[4], \memory,event[5],
                    \amp,cfg[\amp], \seed,4104+i]
            ]);
        });
        endTime=cfg[\preroll]+(64*60/cfg[\bpm])+cfg[\tail];
        messages.add([endTime,[\c_set,0,0]]);
        score=Score(messages.asArray.sort({ |a,b| a[0]<b[0] }),clock);
        output=outputDir +/+ ("Afterimage_"++variant.asString++"_raw.wav");
        ("RENDER_START "++variant++" "++output).postln;
        score.recordNRT(outputFilePath:output, sampleRate:cfg[\sampleRate],
            headerFormat:"WAV",sampleFormat:"int24",options:options,duration:endTime,
            action:{ |exitCode|
                ("RENDER_SERVER_EXIT "++variant++" "++exitCode).postln;
                if(exitCode!=0, { 3.exit }, { renderOne.value(index+1) });
            });
    });
};
renderOne.value(0);
)
