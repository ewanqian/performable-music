"""Nine authored compositional mechanisms; eight-bar test scores, not nine finished tracks."""
from pathlib import Path
import json,mido
R=Path(__file__).resolve().parent;O=R/'outputs';O.mkdir(exist_ok=True)
# Name, dramatic proposition, form, bass call, upper response, development rule.
CONCEPTS=[
('01','缺席的末音','建立四音回答，撤走最后一音，结尾才兑现。','2+2+2+2：完整/确认/缺席/完成',[(0,31),(1.5,38),(2.75,34)],[(.75,70),(2,74),(3.25,69)],'withhold'),
('02','两个人抢一句话','低频与金属交错接话；共享旋律的音区在中点互换。','2+2+2+2：接话/抢答/交换/和解',[(0,31),(2,34)],[(1,74),(3,70)],'hocket'),
('03','三步撞上四步','低频保留四拍句，金属每三拍出现；最后主动合拍。','3+3+2：分离/失配/对齐',[(0,31),(1.75,38),(3.25,29)],[(0,74)],'phase'),
('04','越来越晚的回答','提问稳定，回答逐次推迟，制造等待；最后回答反而提前。','2+2+2+2：准时/迟到/失约/抢先',[(0,31),(2.5,38)],[(.75,70),(2.25,74)],'late'),
('05','空白里的重拍','抽掉鼓，靠低频与无声位置让身体继续数拍。','2+2+2+2：锚定/少鼓/无鼓/轻回归',[(.25,31),(1.5,34),(3,38)],[(2.25,77)],'negative'),
('06','熟悉声音变了角色','同一节奏先是低频主角，后变成高处残像；旋律不增加。','2+2+2+2：实体/上移/残像/落地',[(0,31),(1.25,38),(2.75,34)],[(3.5,70)],'register'),
('07','七拍问九拍答','句长错开小节线，呼吸仍清楚；第三次才恢复均衡。','7+9+7+9 拍：两次不等长问答',[(0,31),(1.5,34),(3.25,38)],[(.5,74),(2.75,70)],'asymmetric'),
('08','重音换了，音符没换','同一组音高与落点，力度重心在中段转移，低频让出头拍。','2+2+2+2：原重音/反重音/悬置/新重心',[(0,31),(1,38),(2.5,34),(3.25,29)],[(1.75,70),(3.5,74)],'accent'),
('09','冲击之后还会说话','第一落点只说半句，空一拍；第二落点回答，结尾减去一半。','2+2+1+1+2：暗示/抽空/冲击/停顿/后果',[(0,31),(1.75,38),(3,34)],[(.75,77),(2.5,70)],'aftermath')]
all_scores=[]
for number,name,idea,form,bass,upper,rule in CONCEPTS:
 notes={'bass':[],'metal':[],'kick':[]}
 def add(role,t,p,v=90,d=.24):
  if 0<=t<32:notes[role].append({'beat':round(t,5),'note':p,'velocity':v,'duration':min(d,32-t)})
 for bar in range(8):
  for j,(beat,pitch) in enumerate(bass):
   t=bar*4+beat;v=[105,72,91,55][j%4]
   if rule=='withhold' and bar in [4,5] and j==len(bass)-1:continue
   if rule=='hocket' and bar in [4,5]:add('metal',t,pitch+36,v,.18);continue
   if rule=='late' and bar in [4,5] and j==1:continue
   if rule=='negative' and bar in [3,5] and j==0:continue
   if rule=='register' and bar in [4,5,6]:add('metal',t,pitch+36,v-15,.16);continue
   if rule=='accent':v=[57,105,64,97][j%4] if bar in [2,3,6,7] else v
   if rule=='aftermath' and (bar in [3,5] or (bar==4 and beat>0)):continue
   if rule=='asymmetric':continue
   add('bass',t,pitch,v)
  if rule=='phase':continue
  for j,(beat,pitch) in enumerate(upper):
   t=bar*4+beat
   if rule=='withhold' and bar in [4,5,6] and j==len(upper)-1:continue
   if rule=='hocket' and bar in [4,5]:add('bass',t,pitch-36,85);continue
   if rule=='late':t+=([0,.25,.75,1.5][bar//2] if bar<6 else -.5)
   if rule=='aftermath' and bar in [3,5,7]:continue
   if rule=='asymmetric':continue
   add('metal',t,pitch,76 if j else 88,.15)
  if bar in [0,2,6] and not(rule=='negative' and bar>=2):add('kick',bar*4,43,104,.12)
 if rule=='phase':
  for t in range(1,24,3):add('metal',t,74 if t%2 else 70,83,.16)
  for t in [24,27.5,30]:add('metal',t,74,92,.18)
 if rule=='asymmetric':
  for origin,length,pitch in [(0,7,31),(7,9,34),(16,7,29),(23,9,31)]:
   for offset,v in [(0,104),(1.5,67),(4.25,90)]:add('bass',origin+offset,pitch,v,.3)
   add('metal',origin+length-1.5,pitch+36,83,.18)
 # Each test ends as a sentence, not an infinite loop.
 for role in notes:notes[role]=[n for n in notes[role] if n['beat']<(31.75 if rule=='withhold' else 31)]
 score={'id':number,'name':name,'idea':idea,'form':form,'development':rule,'bpm':128,'bars':8,'notes':notes,'status':'MIDI WRITTEN; human audition pending'};all_scores.append(score)
 mid=mido.MidiFile(ticks_per_beat=960)
 for role,events in notes.items():
  tr=mido.MidiTrack();mid.tracks.append(tr);tr.append(mido.MetaMessage('track_name',name=role));tr.append(mido.MetaMessage('set_tempo',tempo=mido.bpm2tempo(128)));seq=[]
  for n in events:
   seq.extend([(round(n['beat']*960),mido.Message('note_on',note=n['note'],velocity=n['velocity'])),(round((n['beat']+n['duration'])*960),mido.Message('note_off',note=n['note'],velocity=0))])
  prev=0
  for tick,msg in sorted(seq,key=lambda x:(x[0],x[1].type=='note_on')):tr.append(msg.copy(time=tick-prev));prev=tick
  tr.append(mido.MetaMessage('end_of_track',time=32*960-prev))
 mid.save(O/f'{number}-{rule}.mid')
(R/'nine-scores.json').write_text(json.dumps(all_scores,ensure_ascii=False,indent=2)+'\n')
lines=['# 九个作曲概念与试写','', '每个先写八小节验证机制；不是九首成品，也不自动扩展全曲。128 BPM，每稿15秒。','', '|编号|概念|作曲问题|句法|','|---|---|---|---|']
for s in all_scores:lines.append(f"|{s['id']}|{s['name']}|{s['idea']}|{s['form']}|")
lines+=['','所有稿件使用原创音符；不读取参考音频。03、07包含跨小节句法，其余改变接话、缺席、角色或重心，避免只换音高的九份循环。','', '试听时分别问：能否记住一句？转折是否必要？空白是否有期待？回归有没有后果？']
(R/'CONCEPTS.md').write_text('\n'.join(lines)+'\n');print('Nine original eight-bar MIDI sketches written.')
