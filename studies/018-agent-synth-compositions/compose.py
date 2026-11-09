"""Three original, independently phrased MIDI compositions; explicit v1 -> v2 edits.

The supplied MIDI tool is run separately as a baseline. Its example is not a score
for these works. No PCM is read here. All times below are musical beats.
"""
from pathlib import Path
import copy, json, hashlib, argparse
import mido

R=Path(__file__).resolve().parent
TPB=960

def add(track,p,t,d=.35,v=78):
    assert 0<=p<=127 and t>=0 and d>0 and 1<=v<=127
    track.append([p,round(t,6),round(d,6),v])

def phrase(track,start,pitches,positions,durations,velocities):
    for i,(p,t) in enumerate(zip(pitches,positions)):
        add(track,p,start+t,durations[i%len(durations)],velocities[i%len(velocities)])

def prism(version):
    lead=[]; answer=[]; low=[]; sparks=[]
    # E Lydian: rising fifth, register expansion, then a semitone resolution.
    motif=[64,71,66,75,73,68,66]
    pos=[0,1.5,2.75,4.25,6,8.5,11.25]
    for index,start in enumerate([1,17,33,50,66,81,96,112]):
        p=motif.copy(); t=pos.copy(); d=[.65,.42,.55,1.15,.62,.45,1.6]
        if index==1: p=[68,73,71,78,75,71,68];t=[0,1.75,3.5,5,7.25,9.25,12]
        if index==2: p=[64,66,71,73,75,78,75]; t=[0,1,2.75,4,6.5,8,11]
        if index==3: p=[73,71,68,66,63,66,71];t=[0,.75,2.25,4.5,6.25,9,12]
        if index==4: p=[68,71,75,78,80,78,75];t=[0,1.25,3.25,5,7.5,10,12.5]
        if index==5: p=[66,68,71,75,78,75,71];t=[0,1,2.5,4.5,6.5,8.5,11]
        if version==2 and index==6:
            # Decisive arrival: displaced question becomes metrically aligned,
            # internal contour changes, answer reaches D# then settles on G#.
            p=[76,78,83,87,85,83,80];t=[0,1,2,4,5.5,8,10.5];d=[.7,.6,.6,1.5,.7,.6,2.4]
        if index==7:p=[75,73,71,68,66,63,64];t=[0,1.75,3.5,5,7.5,9.5,12];d=[.8,.8,.7,.7,1,.5,2]
        phrase(lead,start,p,t,d,[88,74,83,93,80,73,82])
    # Countervoice answers across phrase boundaries, not a transposed MIDI copy.
    for start,p in [(12,[78,75,71]),(27,[80,78,75,73]),(43,[75,78,83]),
                    (60,[71,73,78,75]),(75,[83,80,78]),(90,[78,75,73,71]),
                    (106,[87,83,80]),(126,[75,71,68])]:
        phrase(answer,start,p,[0,.75,2.25,4],[.32,.38,.7],[62,70,64,57])
    # Tuned low movement: short articulated weight, not kick or static sine.
    roots=[40,40,37,42,45,47,40,37,45]
    for k in range(34):
        base=k*4; root=roots[min(k//4,len(roots)-1)]
        locations=[0,1.75,3] if k%3!=2 else [0,1.5,2.75,3.5]
        for j,t in enumerate(locations):
            p=root+(7 if j==2 and k%2 else 0)
            add(low,p,base+t,.52 if j==0 else .28,[91,64,76,59][j])
    for start,root in [(32,76),(48,75),(64,80),(80,78),(96,83),(112,80)]:
        for j,t in enumerate([0,.75,1.5,2.5,3.25,5,6.5,7.25]):
            add(sparks,root+[0,7,2,5,9,7,2,0][j],start+t,.11,[47,38,56,42][j%4])
    # Complete ending: phrase answered in a changed register, bass joins last E.
    phrase(lead,129,[71,68,66,64],[0,2,4.5,7],[.7,1,1.4,2.8],[76,72,67,78])
    add(low,40,136,2.4,77)
    return dict(id='01_PRISM_RUN',title='棱线 / Prism Run',bpm=120,seconds=72,meter=[4,4],
        tracks={'glass':lead,'reply':answer,'ground':low,'refraction':sparks},
        patches={'glass':'prism_glass','reply':'hinge_pluck','ground':'low_fm','refraction':'pulse_fm'},
        gains={'glass':1,'reply':.75,'ground':.87,'refraction':.6},
        cues=[[0,'低频轮廓与七音问句'],[8.5,'回答改换轮廓'],[16.5,'主题逐步延展'],
              [25,'问答错位'],[40.5,'句长收紧'],[48,'错位主题合拢，内部音程与回答改变'],[64.5,'缩句回归，低音共同收束']])

def hinge(version):
    lead=[]; counter=[]; low=[]
    # C major 6/9, five-beat syntax with its own 3+2 accents.
    cells=[([72,76,67,74,69,72],[0,.75,1.5,2.75,3.5,4.5]),
           ([74,72,69,67,76],[0,1.25,2.5,3.25,4.25]),
           ([72,79,76,74,69],[0,.5,1.75,3,4]),
           ([76,74,72,67,69,74],[0,.75,1.5,2.25,3.5,4.25])]
    for k in range(24):
        start=k*5; p,t=cells[(k//2)%4]
        p=p.copy();t=t.copy()
        if k in [5,9,13]:p[-1]+=5;t[-1]-=.25
        if 8<=k<12:p=[x+(12 if i%3==1 else 0) for i,x in enumerate(p)]
        if version==2 and 12<=k<18:
            # At 36s the line stops repeating a five-beat cell: four long,
            # cross-bar questions span 7.5 beats, with a new falling answer.
            continue
        if k>=20:p=[x-12 for x in p];t=[x*.9 for x in t]
        phrase(lead,start+.15,p,t,[.26,.33,.2,.48,.3,.62],[92,63,77,89,68,81])
    if version==2:
        for start,p in [(60,[79,76,72]),(67.5,[81,77,74]),(75,[83,79,76]),(82.5,[79,74,72])]:
            phrase(lead,start,p,[0,2.5,5],[1.25,1,1.65],[84,77,91])
    # Independent three-beat lower sequence slips against the five-beat line.
    for k in range(39):
        r=[36,43,45,40,41,43,38][(k//3)%7]
        add(low,r,k*3,.62,88 if k%5 in [0,2] else 67)
        if k>=5:add(low,r+12,k*3+1.75,.19,54 if k%2 else 65)
    # Replies initially sparse; their entrances become the metric reference.
    for i,start in enumerate([8.5,18,27.5,36,44.5,53,62.5,72,81.5,91,101,110]):
        p=[[79,76,74],[81,79,76,72],[76,74,69]][i%3]
        phrase(counter,start,p,[0,.5,1.5,3.25],[.32,.45,.75],[60,69,63,55])
    if version==2:
        phrase(lead,120,[72,76,67,74,69],[0,.75,1.5,3,4.25],[.3,.25,.55,.5,1.5],[79,63,72,69,62])
        phrase(counter,123,[79,76],[0,2.25],[.45,1.5],[53,57]);add(low,36,123,.9,68)
    return dict(id='02_HINGE',title='铰链 / Hinge',bpm=100,seconds=78,meter=[5,4],
        tracks={'tension_string':lead,'tine_reply':counter,'three_step':low},
        patches={'tension_string':'hinge_pluck','tine_reply':'prism_glass','three_step':'low_fm'},
        gains={'tension_string':1,'tine_reply':.76,'three_step':.9},
        cues=[[0,'五拍拨弦与三拍低音相互偏移'],[10.8,'回答开始改变重音'],[24,'音域打开'],
              [36,'短五拍句转成长七拍半问句'],[54,'原句低八度折返'],[72,'开头短句归来，留一条不同的尾答']])

def air(version):
    lead=[]; orbit=[]; low=[]; light=[]
    # G major/add9: unequal breath lengths; no common four-section scaffold.
    statements=[(0,[67,69,74,76,71],[0,2.5,5.75,8.25,12],[1.7,2.2,1.6,2.6,3]),
                (19,[74,71,69,78,76,74],[0,2,4.5,7,10.5,13],[1.4,1.7,1.5,2.3,1.7,2.6]),
                (39,[67,74,78,81,79],[0,3.25,6,10,14.25],[2,1.8,2.7,2.5,3]),
                (62,[71,74,76,78,74,69],[0,2.25,4.75,7.25,11,15],[1.7,1.3,1.7,2.6,2.4,3]),
                (85,[79,81,86,88,83],[0,2,4,7,10.5],[1.4,1.4,2,2.4,3.8]),
                (105,[86,83,81,79,76],[0,3,5.25,8.5,13],[1.7,1.4,2.1,2.6,3.5]),
                (128,[74,76,71,69,67],[0,2.5,5.25,8.5,13],[1.5,2,2.4,2.6,4])]
    for j,(start,p,t,d) in enumerate(statements):
        if version==1 and j==4:p=[x-12 for x in p];t=[0,3,6,9,12]
        phrase(lead,start+.2,p,t,d,[83,71,86,78,76,69])
    # A sustained anchor anticipates the opening of the high register.
    for p,t,d,v in [(43,0,5,70),(50,12,4,60),(47,22,5,72),(45,35,4,68),
                    (40,48,6,74),(43,61,6,72),(43,76,12,74),
                    (52,91,5,77),(50,102,5,72),(47,116,5,67),(43,137,8,64)]:add(low,p,t,d,v)
    # Interlacing eighths have a composed contour, then broaden into responses.
    for i,(start,p) in enumerate([(9,[83,81,78,76]),(28,[81,78,74,71]),
                    (46,[86,83,81,78]),(69,[83,86,88,86]),(87,[86,88,90,88]),
                    (98,[86,83,81,79]),(114,[83,81,78,76]),(136,[79,78,74])]):
        phrase(orbit,start,p,[0,.75,1.75,3.25],[.28,.38,.32,.7],[60,52,67,57])
        if i in [2,3,4]:phrase(orbit,start+4.75,list(reversed(p)),[0,.5,1.5,3],[.3,.25,.4,.8],[54,61,49,56])
    for start,p in [(32,[74,78,81]),(55,[76,79,83]),(81,[79,83,86]),
                    (94,[86,90,88]),(121,[78,81,86])]:
        phrase(light,start,p,[0,1.25,3],[.32,.5,.9],[52,60,47])
    # Final two tones answer the first ascent. Tail has time to disappear.
    add(orbit,74,146,.8,44);add(lead,67,147,2.1,60)
    return dict(id='03_AIR_CURRENT',title='悬流 / Air Current',bpm=110,seconds=84,meter=[4,4],
        tracks={'air_thread':lead,'orbit':orbit,'anchor':low,'light':light},
        patches={'air_thread':'air_current','orbit':'hinge_pluck','anchor':'low_fm','light':'prism_glass'},
        gains={'air_thread':1.08,'orbit':.78,'anchor':.76,'light':.67},
        cues=[[0,'不等长上行问句'],[10.36,'下行回答'],[21.27,'新高音程打开'],
              [41.45,'持续锚音先出现'],[46.36,'主题跨八度释放，其他声部绕行'],
              [57.27,'高处的下行回答'],[69.82,'原音域回归'],[79.64,'双音式收束与余响']])

def write_midi(score,path):
    mf=mido.MidiFile(type=1,ticks_per_beat=TPB,charset='utf8')
    master=mido.MidiTrack();mf.tracks.append(master)
    master.extend([mido.MetaMessage('track_name',name=score['id']),
        mido.MetaMessage('set_tempo',tempo=mido.bpm2tempo(score['bpm'])),
        mido.MetaMessage('time_signature',numerator=score['meter'][0],denominator=score['meter'][1])])
    last=0
    for sec,text in score['cues']:
        tick=round(sec*score['bpm']/60*TPB)
        master.append(mido.MetaMessage('marker',text=text,time=tick-last));last=tick
    for channel,(name,notes) in enumerate(score['tracks'].items()):
        track=mido.MidiTrack();mf.tracks.append(track);track.append(mido.MetaMessage('track_name',name=name))
        events=[]
        for pitch,t,d,v in notes:
            events += [(round(t*TPB),1,mido.Message('note_on',note=pitch,velocity=v,channel=channel)),
                       (round((t+d)*TPB),0,mido.Message('note_off',note=pitch,velocity=0,channel=channel))]
        last=0
        for tick,order,msg in sorted(events,key=lambda x:(x[0],x[1])):
            msg.time=tick-last;track.append(msg);last=tick
    mf.save(path)

def main():
    out=R/'scores';out.mkdir(exist_ok=False)
    history=[]
    for fn in [prism,hinge,air]:
        for version in [1,2]:
            s=fn(version);folder=out/s['id'];folder.mkdir(exist_ok=True)
            path=folder/f'v{version:02}.mid';write_midi(s,path)
            (folder/f'v{version:02}-score.json').write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n')
            if version==2:
                v1=fn(1)
                history.append({'id':s['id'],'v1_notes':sum(map(len,v1['tracks'].values())),
                    'v2_notes':sum(map(len,s['tracks'].values())),
                    'deleted_events':sum(len([n for n in v1['tracks'][k] if n not in s['tracks'][k]]) for k in s['tracks']),
                    'added_events':sum(len([n for n in s['tracks'][k] if n not in v1['tracks'][k]]) for k in s['tracks']),
                    'midi_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                    'human_listening':'PENDING'})
    (out/'MIDI_EDIT_HISTORY.json').write_text(json.dumps(history,indent=2)+'\n')
    print(json.dumps(history,indent=2))

if __name__=='__main__':main()
