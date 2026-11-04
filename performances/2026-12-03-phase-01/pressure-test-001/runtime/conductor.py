"""Loopback-only Show Score conductor: validated JSON -> SC OSC + WebGL WS.
Button input is DESKTOP/AUTOMATION, never labeled a physical pedal or real hand.
"""
from pathlib import Path
import asyncio,json,time,hashlib,struct,socket,math,uuid,argparse
from aiohttp import web,WSMsgType
from jsonschema import Draft202012Validator
ROOT=Path(__file__).resolve().parent;REPO=ROOT.parents[3]
SC=('127.0.0.1',57131);ACK=('127.0.0.1',19731);BAR=60/128*4
E=ROOT/'evidence';E.mkdir(exist_ok=True)
validator=Draft202012Validator(json.loads((REPO/'protocols/show-score-v1.schema.json').read_text()))
log=(E/'conductor.ndjson').open('a',buffering=1)
def write(kind,**kw):log.write(json.dumps({'at_monotonic':time.monotonic(),'kind':kind,**kw})+'\n')
def oscstr(s):
 b=str(s).encode()+b'\0';return b+b'\0'*((-len(b))%4)
def osc(address,*args):
 tags=','+''.join('i' if isinstance(a,int) else 'f' if isinstance(a,float) else 's' for a in args)
 return oscstr(address)+oscstr(tags)+b''.join(struct.pack('>i',a) if isinstance(a,int) else struct.pack('>f',a) if isinstance(a,float) else oscstr(a) for a in args)
def decode(data):
 def string(off):
  end=data.index(0,off);return data[off:end].decode(),(end+4)&~3
 addr,off=string(0);tags,off=string(off);args=[]
 for tag in tags[1:]:
  if tag=='s':v,off=string(off)
  else:v=struct.unpack_from('>i' if tag=='i' else '>f',data,off)[0];off+=4
  args.append(v)
 return addr,args
udp=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
clients=set();state={'active':False,'ready':False,'seq':0,'time':0,'killed':False,'last':None,'session':'idle','pending':None,'overridden':False,'recording':False,'repeat':0,'last_event':None}
class Receipts(asyncio.DatagramProtocol):
 def datagram_received(self,data,addr):
  try:
   address,args=decode(data);write('sc_receipt',address=address,args=args)
   if address=='/critical/ready':state['ready']=True
   if address=='/critical/recording':state['recording']=True
   if address=='/critical/manual_kill':state['killed']=True
  except Exception as ex:write('bad_sc_reply',error=str(ex))
def send_sc(command,*args):udp.sendto(osc(command,*args),SC)
def controls(t):
 if t<9.375:return 'INITIAL_CONDITION','SEED',[.15,.10,.35,.22,.25,.05]
 if t<31.875:
  f=(t-9.375)/22.5;return 'FIELD','BUILD',[.35+.25*f,.35+.3*f,.5+.2*f,.3+.35*f,.5,.2]
 if not state['overridden']:return 'OVERRIDE','HOLD',[.06,.04,.92,.12,.91,.32]
 if t<67.5:return 'OVERRIDE','PEAK',[.91,.72,.93,.88,.96,.54]
 f=min(1,(t-67.5)/11.25);return 'AFTERIMAGE','RELEASE',[.5*(1-f),.2*(1-f),.5*(1-f),.8*(1-f)+.12,.3*(1-f),.08]
async def emit(event=None,force_safe=False):
 t=state['time'];scene,phase,vals=controls(t)
 safe=force_safe or state['killed']
 f={'schema_version':'1.0','session_id':state['session'],'seq':state['seq'],'t_ms':round(t*1000,3),'scene':scene,'state':'SAFE' if safe else phase,
 'controls':dict(zip(['energy','density','tension','space','pressure','fracture'],[0,0,0,.12,0,0] if safe else vals)),
 'event':event,'tracking':{'source':'DESKTOP','valid':not safe,'stale_ms':0},'safe':{'manual_kill':state['killed'],'neutral':safe,'reason':'manual kill' if state['killed'] else ('stopped' if safe else None)}}
 await publish(f)
async def publish(f):
 validator.validate(f);canonical=json.dumps(f,sort_keys=True,separators=(',',':'));digest=hashlib.sha256(canonical.encode()).hexdigest()
 state['last']=f;state['seq']+=1;c=f['controls'];ev=f['event'] or {}
 args=[f['session_id'],f['seq'],float(f['t_ms']),f['scene'],f['state'],*[float(c[k]) for k in ['energy','density','tension','space','pressure','fracture']],ev.get('id',''),ev.get('type',''),ev.get('source',''),int(f['tracking']['valid']),0.,int(f['safe']['manual_kill']),int(f['safe']['neutral']),digest]
 udp.sendto(osc('/critical/score',*args),SC)
 packet={'type':'score','frame':f,'hash':digest};write('frame_sent',frame=f,hash=digest)
 for ws in list(clients):
  try:await ws.send_json(packet)
  except Exception:clients.discard(ws)
async def ticker(app):
 try:
  while True:
   if state['active'] and not state.get('replay'):
    elapsed=time.monotonic()-state['start'];t=elapsed-state.get('hold_delay',0)
    if not state['overridden'] and t>=45:
     t=45
    state['time']=min(78.75,max(0,t));ev=None
    if state['seq']==0:ev={'id':state['session']+'-reset','type':'RESET','source':'AUTOMATION'}
    if state['pending'] is not None and elapsed>=state['pending']:
     state['overridden']=True;state['hold_delay']=elapsed-45;state['time']=45
     ev={'id':state['session']+'-override','type':'OVERRIDE','source':'AUTOMATION'}
     state['pending']=None;state['last_event']=ev;state['repeat']=2
    elif state['repeat']:
     ev=state['last_event'];state['repeat']-=1
    await emit(ev)
   await asyncio.sleep(.05)
 except asyncio.CancelledError:pass
async def start(request):
 if not state['ready']:return web.json_response({'error':'SC is not ready'},status=409)
 if state['active']:return web.json_response({'error':'stop the current run first'},status=409)
 sid='cf-'+uuid.uuid4().hex[:10];path=E/(sid+'-sc.wav')
 state.update(session=sid,recording=False,seq=0,time=0,killed=False,pending=None,overridden=False,repeat=0,hold_delay=0)
 send_sc('/critical/record',str(path));deadline=time.monotonic()+5
 while not state['recording'] and time.monotonic()<deadline:await asyncio.sleep(.025)
 if not state['recording']:return web.json_response({'error':'SC recorder did not acknowledge'},status=504)
 await asyncio.sleep(.25);state['start']=time.monotonic();state['active']=True
 write('run_start',session=sid,audio_path=str(path.name),record_begin_monotonic=state['start'])
 return web.json_response({'session':sid})
async def replay(request):
 if state['active']:return web.json_response({'error':'stop first'},status=409)
 body=await request.json();sid=body.get('session','')
 rows=[json.loads(line) for line in (E/'conductor.ndjson').read_text().splitlines()]
 rows=[r for r in rows if r['kind']=='frame_sent' and r['frame']['session_id']==sid]
 if not rows:return web.json_response({'error':'no saved frames'},status=404)
 state['replay']=True
 response=await start(request)
 if response.status!=200:state['replay']=False;return response
 async def run():
  origin=rows[0]['at_monotonic'];begin=time.monotonic()
  for r in rows:
   if not state['active']:break
   await asyncio.sleep(max(0,begin+r['at_monotonic']-origin-time.monotonic()))
   f=json.loads(json.dumps(r['frame']));f['session_id']=state['session']
   f['tracking']['source']='REPLAY'
   if f['event']:f['event']['source']='REPLAY'
   state['time']=f['t_ms']/1000
   await publish(f)
  state['active']=False;state['replay']=False;send_sc('/critical/stop_record')
  write('replay_complete',session=state['session'],source_session=sid,frames=len(rows))
 asyncio.create_task(run());write('replay_start',session=state['session'],source_session=sid)
 return response
async def command(request):
 cmd=request.match_info['cmd']
 if cmd=='override':
  if state['active'] and not state['overridden']:
   elapsed=time.monotonic()-state['start'];state['pending']=max(45.,math.ceil(elapsed/BAR)*BAR)
   write('button_override_queued',session=state['session'],at=elapsed,quantized_at=state['pending'])
 elif cmd=='kill':send_sc('/critical/kill','http-explicit-kill')
 elif cmd=='stop':
  state['active']=False;await emit({'id':state['session']+'-stop','type':'RELEASE','source':'AUTOMATION'},True)
  send_sc('/critical/stop_record');write('run_stop',session=state['session'])
 else:return web.json_response({'error':'unknown command'},status=400)
 return web.json_response({'ok':True,'state':{k:state[k] for k in ['session','time','active','pending','overridden','killed']}})
async def websocket(request):
 ws=web.WebSocketResponse(max_msg_size=65536);await ws.prepare(request);clients.add(ws)
 await ws.send_json({'type':'hello','ready':state['ready']})
 try:
  async for msg in ws:
   if msg.type==WSMsgType.TEXT:
    data=json.loads(msg.data)
    if data.get('type') in ['visual_event','visual_safe','capture_start','visual_ready']:
     write(data['type'],session=state['session'],data=data)
 finally:clients.discard(ws)
 return ws
async def capture(request):
 sid=request.query.get('session','')
 if sid!=state['session']:return web.json_response({'error':'wrong run'},status=409)
 data=await request.read();p=E/(sid+'-webgl.webm');p.write_bytes(data);write('capture_saved',session=sid,bytes=len(data))
 return web.json_response({'saved':p.name,'bytes':len(data)})
async def info(request):return web.json_response({k:state[k] for k in ['ready','session','active','time','overridden','killed','seq']})
async def lifecycle(app):
 loop=asyncio.get_running_loop();transport,_=await loop.create_datagram_endpoint(Receipts,local_addr=ACK)
 task=asyncio.create_task(ticker(app));yield;task.cancel();await task;transport.close();udp.close();log.close()
app=web.Application(client_max_size=100*1024**2)
app.router.add_get('/ws',websocket);app.router.add_get('/api/state',info);app.router.add_post('/api/replay',replay);app.router.add_post('/api/start',start)
app.router.add_post('/api/{cmd:override|kill|stop}',command);app.router.add_post('/capture',capture)
app.router.add_get('/',lambda request:web.FileResponse(ROOT/'index.html'))
app.router.add_static('/assets',ROOT,show_index=False);app.cleanup_ctx.append(lifecycle)
if __name__=='__main__':web.run_app(app,host='127.0.0.1',port=18080,access_log=None)
