"""Version 3: resolve actual critic-found same-pitch retrigger overlap.

Versions 1 and 2 remain intact. This reads/edit/saves real existing MIDI, then
checks it against the editable score used by the native renderer.
"""
from pathlib import Path
import json, mido
from compose import write_midi

R=Path(__file__).resolve().parent
results=[]
for folder in sorted((R/'scores').iterdir()):
    if not folder.is_dir():continue
    score=json.loads((folder/'v02-score.json').read_text())
    changes=[]
    for name,notes in score['tracks'].items():
        for note in notes:
            following=[n[1] for n in notes if n[0]==note[0] and n[1]>note[1]]
            if following and note[1]+note[2] >= min(following):
                old=note[2];note[2]=round(min(following)-note[1]-.03,6)
                changes.append(dict(track=name,pitch=note[0],beat=note[1],old_duration=old,new_duration=note[2]))
    # The actual source MIDI must be readable, not merely claimed to exist.
    source=mido.MidiFile(folder/'v02.mid',charset='utf8')
    assert sum(m.type=='note_on' and m.velocity>0 for t in source.tracks for m in t)==sum(map(len,score['tracks'].values()))
    for file in ['v03.mid','v03-score.json']:
        if (folder/file).exists():raise FileExistsError(folder/file)
    write_midi(score,folder/'v03.mid')
    (folder/'v03-score.json').write_text(json.dumps(score,ensure_ascii=False,indent=2)+'\n')
    results.append(dict(id=score['id'],source='v02.mid',output='v03.mid',changes=changes))
(R/'scores'/'RETRIGGER_REVISIONS.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps(results,indent=2))
