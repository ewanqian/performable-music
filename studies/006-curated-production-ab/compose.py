"""Original 16-bar G-centred rhythm studies. No reference audio is read.
MIDI performance is authored, not a claim of a human-recorded performance.
"""
from pathlib import Path
import json,mido
R=Path(__file__).resolve().parent;OUT=R/'outputs';OUT.mkdir(exist_ok=True)
BPM=128;BEAT=60/BPM
# Two-bar proposition: long/short elastic low notes and an off-grid answer.
CALL=[(0,31,.31,109),(1.5,31,.19,78),(2.75,38,.23,92),(3.5,34,.14,59)]
ANSWER=[(.25,31,.26,98),(1.75,41,.19,84),(2.5,38,.15,62),(3.25,29,.34,94)]
VAR_CALL=[(.0,31,.4,112),(1.75,38,.16,72),(2.5,34,.24,92)]
VAR_ANSWER=[(.5,29,.3,91),(1.25,34,.17,64),(2.75,33,.19,83),(3.5,38,.14,58)]
PATCHES={'bass':'patches_factory/Basses/Rubber Bass.fxp','metal':'patches_factory/FX/Metal Pluck.fxp','kick':'patches_factory/Percussion/Kick Tech 1.fxp','snare':'patches_factory/Percussion/Snare Tight.fxp','pressure':'patches_factory/FX/Radio Noise.fxp'}
all_scores={}
for version in ['A','B']:
 notes={k:[] for k in PATCHES};controllers={k:[] for k in PATCHES}
 def put(role,bar,beat,note,dur,vel,ms=0):
  onset=bar*4+beat+ms/1000/BEAT
  if onset>=64 or onset<0:return
  notes[role].append({'beat':round(onset,6),'note':note,'duration':round(min(dur,64-onset),6),'velocity':vel})
 def phrase(bar,pattern,shift=0,level=0):
  for j,(beat,note,dur,vel) in enumerate(pattern):put('bass',bar,beat+shift,note,dur,max(1,min(127,vel+level)),[0,7,-4,10][j%4])
 if version=='A':
  for bar,pattern,level in [(0,CALL,0),(1,ANSWER,0),(2,CALL,-7),(3,ANSWER,-10),
   (4,VAR_CALL,0),(5,VAR_ANSWER,0),(6,CALL,3),(7,VAR_ANSWER,-4),
   (8,[(0,31,.5,100),(2.75,38,.2,74)],0),(9,[(1.75,41,.23,80)],0),
   (10,VAR_CALL,-10),(11,[(.25,31,.3,95),(1.75,34,.2,70)],0),
   (12,CALL,4),(13,VAR_ANSWER,1),(14,[(0,31,.38,110),(1.5,38,.25,85),(2.75,34,.2,73)],0),
   (15,[(.25,29,.3,89),(1.5,33,.16,67),(2.25,31,.55,101)],0)]:phrase(bar,pattern,level=level)
  # Deliberate, phrase-scale rests: not gates randomly scattering every note.
  rests=[(15.5,16),(31,32),(46.5,48),(63,64)]
  for bar,beat,note,vel in [(0,3.25,70,68),(1,1,74,88),(2,2.25,69,57),(3,.5,65,74),
   (4,3,70,73),(5,2,77,83),(6,3.5,74,61),(7,.5,69,79),
   (8,1.5,70,53),(9,3.25,74,72),(10,2.25,77,68),(12,.75,74,94),
   (13,1,70,73),(14,3.25,69,67),(15,1,67,74)]:put('metal',bar,beat,note,.16,vel,9)
  for bar,beat,vel in [(0,0,105),(2,0,95),(4,0,111),(5,2.5,79),(6,0,102),(8,0,86),(10,0,96),(12,0,117),(13,2.5,84),(14,0,107)]:put('kick',bar,beat,43,.13,vel)
  for bar,beat,vel in [(1,2,75),(3,2,66),(5,2,83),(7,2,74),(10,3.5,47),(13,2,88),(15,.75,62)]:put('snare',bar,beat,62,.12,vel,11)
  for bar,beat,length,vel in [(6,3,1.2,49),(10,3.25,.9,43),(11,1.5,.7,48)]:put('pressure',bar,beat,55,length,vel)
 else:
  for bar,pattern,shift,level in [(0,CALL,0,0),(1,ANSWER,0,0),(2,CALL,0,-8),(3,ANSWER,0,-9),
   (4,CALL,.25,-4),(5,VAR_ANSWER,0,-2),(6,VAR_CALL,.5,-6),(7,[(.25,31,.24,88),(1.75,38,.17,69)],.25,0),
   (8,[(.75,31,.34,88)],0,0),(9,[(2.25,34,.16,72)],0,0),
   (10,[(.5,31,.22,86),(2.75,38,.16,64)],0,0),(11,[(.25,34,.3,76)],0,0),
   (12,[(0,31,.65,118),(2.25,38,.2,86)],0,0),(13,ANSWER,.25,-3),
   (14,VAR_CALL,0,1),(15,[(.5,29,.23,84),(1.75,33,.2,71),(2.5,31,.55,102)],0,0)]:phrase(bar,pattern,shift,level)
  # Metal layer's three-beat spacing counters the bass's four-beat sentence.
  for i,(absolute,pitch,vel) in enumerate([(3.25,70,68),(5,74,88),(10.25,69,57),(12.5,65,74),
   (17,70,77),(20,74,64),(23,77,81),(26,74,60),(29,69,72),
   (35.5,70,56),(40.75,74,60),(43.5,77,45),(48,74,105),(51.25,70,64),
   (54.5,69,75),(57.75,77,67),(61,67,76)]):put('metal',int(absolute//4),absolute%4,pitch,.14,vel,9)
  rests=[(30,32),(36,38),(45,48),(63.25,64)]
  for bar,beat,vel in [(0,0,105),(2,0,95),(4,0,101),(6,1,85),(10,.5,87),(12,0,122),(14,0,109)]:put('kick',bar,beat,43,.13,vel)
  for bar,beat,vel in [(1,2,75),(3,2,66),(5,2.75,77),(7,.75,57),(13,2.5,86),(15,.75,59)]:put('snare',bar,beat,62,.11,vel,11)
  for bar,beat,length,vel in [(6,3,1.1,47),(8,2.25,1.1,52),(10,3.25,.8,57),(11,.75,.4,52)]:put('pressure',bar,beat,55,length,vel)
 # Clip notes to composed rests; downstream tail envelopes enforce these rests too.
 for role in notes:
  filtered=[]
  for note in notes[role]:
   t=note['beat']
   if any(a<=t<b for a,b in rests):continue
   for a,b in rests:
    if t<a<t+note['duration']:note['duration']=a-t
   filtered.append(note)
  notes[role]=sorted(filtered,key=lambda n:n['beat'])
  controllers[role]=[] # No unverified CC/macro mappings are presented as performed modulation.
  mid=mido.MidiFile(ticks_per_beat=960);track=mido.MidiTrack();mid.tracks.append(track)
  track.append(mido.MetaMessage('track_name',name=f'{version} / {role}'))
  track.append(mido.MetaMessage('set_tempo',tempo=mido.bpm2tempo(BPM)))
  events=[]
  for n in notes[role]:events.extend([(round(n['beat']*960),mido.Message('note_on',note=n['note'],velocity=n['velocity'])),(round((n['beat']+n['duration'])*960),mido.Message('note_off',note=n['note'],velocity=0))])
  for c in controllers[role]:events.append((round(c['beat']*960),mido.Message('control_change',control=c['cc'],value=c['value'])))
  previous=0
  for tick,msg in sorted(events,key=lambda x:(x[0],x[1].type=='note_on')):track.append(msg.copy(time=tick-previous));previous=tick
  track.append(mido.MetaMessage('end_of_track',time=64*960-previous));mid.save(OUT/f'{version}-{role}.mid')
 all_scores[version]={'bpm':BPM,'bars':16,'beats':64,'key':'G minor with A-natural colour','patches':PATCHES,'notes':notes,'controllers':controllers,'rests_beats':rests,'performance':'Authored accent/ghost velocities; selected answers 7-11ms late; no claim of human recording.'}
(R/'score.json').write_text(json.dumps(all_scores,indent=2)+'\n')
print('Wrote two original 16-bar scores and ten performance MIDI files; no reference waveform/note data read.')
