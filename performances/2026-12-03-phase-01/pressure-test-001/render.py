#!/usr/bin/env python3
"""CRITICAL FIELD / PRESSURE TEST — original, procedurally composed stereo audio sketch.
Dependencies: Python 3, numpy, scipy, soundfile. Run `python render.py`.
All sound is original synthesis; no third-party samples, models or reference recordings.
This renders a listening teaser, NOT a production-ready mastered show track.
"""
from pathlib import Path
import numpy as np, scipy.signal as sg, soundfile as sf, json, csv

ROOT=Path(__file__).resolve().parent
SR=44100; BPM=128; BEAT=60/BPM; BAR=4*BEAT; BARS=42
DURATION=BARS*BAR; LENGTH=int(round(DURATION*SR))
rng=np.random.default_rng(1203)

(ROOT/'stems').mkdir(parents=True, exist_ok=True)
stems={k:np.zeros((LENGTH,2),dtype=np.float64) for k in ['sub-impact','mechanism','harmonic','field']}

def stamp(name, signal, at, level=1, pan=0):
    off=int(at*SR)
    if off<0:return
    if signal.ndim==1:
        pan=np.clip(pan,-1,1)
        signal=np.stack((signal*np.cos((pan+1)*np.pi/4),signal*np.sin((pan+1)*np.pi/4)),axis=1)
    n=min(len(signal),LENGTH-off)
    if n>0:stems[name][off:off+n]+=signal[:n]*level

def env(n,attack=.004,release=.1,decay=None):
    e=np.ones(n)
    ai=min(n,int(attack*SR)); ri=min(n,int(release*SR))
    if ai>1:e[:ai]*=np.linspace(0,1,ai)
    if ri>1:e[-ri:]*=np.linspace(1,0,ri)
    if decay is not None:e*=np.exp(-np.arange(n)/SR/decay)
    return e

def lowpass(x,hz):
    sos=sg.butter(2,hz/(SR*.5),output='sos')
    return sg.sosfilt(sos,x,axis=0)

def highpass(x,hz):
    sos=sg.butter(2,hz/(SR*.5),btype='highpass',output='sos')
    return sg.sosfilt(sos,x,axis=0)

def freq(midi):return 440*2**((midi-69)/12)

def kick(depth=1, length=.58):
    n=int(length*SR);tt=np.arange(n)/SR
    ff=47+125*np.exp(-tt*30)
    phase=2*np.pi*np.cumsum(ff)/SR
    body=np.sin(phase)*np.exp(-tt*8)
    sub=np.sin(2*np.pi*47*tt)*np.exp(-tt*7)
    crack=highpass(rng.standard_normal(n),1600)*np.exp(-tt*90)
    return depth*(.82*body+.22*sub+.055*crack)*env(n, .001, .1)

def metal(length=.22, pitch=700):
    n=int(length*SR);tt=np.arange(n)/SR
    x=(np.sin(2*np.pi*pitch*tt+5*np.sin(2*np.pi*(pitch*1.61)*tt)) +
       .35*np.sin(2*np.pi*(pitch*2.41)*tt))*np.exp(-tt*19)
    x+=highpass(rng.standard_normal(n),3800)*.14*np.exp(-tt*50)
    return x*env(n,.001,.03)*.35

def hat(length=.10):
    n=int(length*SR);tt=np.arange(n)/SR
    x=highpass(rng.standard_normal(n),5500)*np.exp(-tt*55)
    return .14*x*env(n,.001,.015)

def resonant(midi, length=2.5, bright=.7):
    n=int(length*SR);tt=np.arange(n)/SR
    f=freq(midi)
    partials=[(1,1.0),(2.008,.29*bright),(3.87,.15*bright),(5.4,.10*bright)]
    x=np.zeros(n)
    for ratio,gain in partials:
        x+=gain*np.sin(2*np.pi*f*ratio*tt)*np.exp(-tt*(1.2+.22*ratio))
    x=x*np.exp(-tt*.27)
    return x*env(n,.005,.2)*.28

def brass(midi,length=.50,drive=1):
    n=int(length*SR);tt=np.arange(n)/SR
    f=freq(midi)
    x=np.sin(2*np.pi*f*tt+4.8*np.sin(2*np.pi*(f*1.51)*tt)*np.exp(-tt*4.5))
    x+=.26*np.sin(2*np.pi*f*2*tt)
    x=np.tanh(1.8*x*drive)*np.exp(-tt*5.5)
    return lowpass(x,2400)*env(n,.007,.09)*.38

def dark_rise(length=4.0):
    n=int(length*SR);tt=np.arange(n)/SR
    noise=rng.standard_normal(n)
    filt=lowpass(noise,1800)
    h=highpass(filt,125)
    gain=(tt/length)**1.5 * .22
    return h*gain*env(n,.03,.25)

def rift(length=1.6):
    n=int(length*SR);tt=np.arange(n)/SR
    ff=48+130*np.exp(-tt*12)
    phase=np.cumsum(ff)*2*np.pi/SR
    boom=np.sin(phase)*np.exp(-tt*3.2)
    grains=highpass(rng.standard_normal(n),500)*np.exp(-tt*5)
    return (.65*boom+.28*grains)*env(n,.001,.35)

def place_echo(name, sig, at, amount=.2, delay=.23, pan=.5):
    stamp(name,sig,at,1,-pan)
    stamp(name,sig,at+delay,amount,pan)

# Core 3-note statement: D / Eb / A (semitone tension + open fifth)
motif=[50,51,45]
start={'vacuum':0,'motion':5,'suspension':17,'rupture':24,'afterimage':36}

for bar in range(5):
    t0=bar*BAR
    if bar in (0,2,4):
        stamp('sub-impact',rift(2.8),t0,level=.24 if bar!=4 else .40)
    if bar in (1,3,4):
        stamp('harmonic',resonant(motif[bar%3]+12,3.6,bright=.5),t0+.5*BEAT,level=.55,pan=-.4 if bar%2 else .45)
    for j in range(3):
        stamp('mechanism',metal(.12,420+j*240),t0+(j*4+1)*BAR/13,level=.12,pan=(-1+2*j/2)*.9)
stamp('field',dark_rise(5*BAR),0,1)

for bar in range(5,17):
    t0=bar*BAR; stage=(bar-5)/12
    for beat in range(4):
        if not (bar==16 and beat==3):
            stamp('sub-impact',kick(.72 if beat==0 else .53),t0+beat*BEAT,1)
        if bar>=9 and (beat in (1,3)):
            stamp('mechanism',metal(.17,820+bar*13),t0+(beat+.05)*BEAT,.38,pan=(-1 if beat==1 else 1)*.5)
    for h in range(8):
        if (bar<10 and h%2) or (bar>=10 and (h+bar)%5!=0):
            stamp('mechanism',hat(.06),t0+h*BEAT/2,.35+stage*.1,pan=(-.9 if h%2 else .8))
    for j in range(5):
        stamp('mechanism',metal(.10,590+38*j),t0+j*BAR/5+.12*BEAT,.10+stage*.15,pan=np.sin(j*2.4+bar)*.7)
    if bar%2==0:
        for k,note in enumerate(motif):
            place_echo('harmonic',brass(note-12,.37,drive=1+stage),t0+(k*1.25+0.18)*BEAT,amount=.18,delay=.17,pan=.65)
    if bar in (8,12,16):
        stamp('field',dark_rise(1.5),t0+.7*BEAT,level=.8)

for bar in range(17,24):
    t0=bar*BAR
    if bar in (17,19,21,23):
        stamp('sub-impact',kick(.65,.9),t0,.65)
    for i,note in enumerate([62,63,57]):
        if (bar+i)%3==0:
            place_echo('harmonic',resonant(note,4.2,bright=.25),t0+(.65+i*.35)*BEAT,amount=.35,delay=.37,pan=.8)
    if bar%2==1:
        stamp('field',dark_rise(BAR),t0,.38)

for bar in range(24,36):
    t0=bar*BAR; intensity=np.clip((bar-24)/6,0,1)
    for beat in range(4):
        if not ((bar in (27,31,34)) and beat in (2,3)):
            kicktime=t0+beat*BEAT
            stamp('sub-impact',kick(.77+.2*intensity),kicktime,1)
            if beat in (0,2):
                stamp('mechanism',metal(.25,310+.5*bar),kicktime+.015,.38+.15*intensity,pan=0)
    for h in range(8):
        if (bar+h)%7 !=0 and bar not in (31,34):
            stamp('mechanism',hat(.075),t0+(h+.03)*BEAT/2,.65,pan=np.sin(h*2.15+bar)*.85)
    for k,note in enumerate([38,39,33]):
        if bar not in (31,34) or k==0:
            stamp('harmonic',brass(note,.4,drive=1.4+intensity),t0+(k*1.2+.05)*BEAT,.80,pan=[-.4,.4,0][k])
    if bar in (24,28,32,35):
        stamp('sub-impact',rift(2.4),t0,.42+.1*intensity)
    if bar in (26,30,33):
        stamp('field',dark_rise(.95),t0+2.8*BEAT,.8)

for bar in range(36,42):
    t0=bar*BAR
    if bar in (36,38):
        stamp('sub-impact',kick(.54,.62),t0,.55)
    if bar<=39:
        for j,note in enumerate([62,63,57]):
            place_echo('harmonic',resonant(note,5.4,bright=.18+.08*(bar%2)),t0+j*BEAT*1.08+.2*BEAT,amount=.37,delay=.43,pan=.7)
    if bar in (36,39):
        stamp('mechanism',metal(.38,710),t0+2.5*BEAT,.18,pan=.7)
stamp('sub-impact',rift(1.9),41*BAR,.31)

duck=np.ones(LENGTH)
for bar in list(range(5,17))+list(range(24,36)):
    for beat in range(4):
        if ((bar==16 and beat==3) or (bar in (27,31,34) and beat in (2,3))):continue
        at=int((bar*BAR+beat*BEAT)*SR);n=min(int(.28*SR),LENGTH-at)
        if n>0:
            tt=np.arange(n)/SR
            duck[at:at+n]=np.minimum(duck[at:at+n],1-.43*np.exp(-tt*10))
for name in ['harmonic','field']:
    stems[name]*=duck[:,None]
for name in stems:
    audio=stems[name]
    audio[:800]*=np.linspace(0,1,800)[:,None]
    audio[-1000:]*=np.linspace(1,0,1000)[:,None]

weights={'sub-impact':.80,'mechanism':.77,'harmonic':.85,'field':.9}
master=sum(weights[k]*stems[k] for k in stems)
master=np.tanh(master*1.25)/1.25
peak=np.max(np.abs(master));scale=.87/peak if peak>.87 else 1.0
master*=scale
for name,audio in stems.items():
    path=ROOT/'stems'/f'{name}.wav'
    sf.write(path,(audio*weights[name]*scale).astype('float32'),SR,subtype='PCM_16')
sf.write(ROOT/'CRITICAL_FIELD_PRESSURE_TEST_preview.wav',master.astype('float32'),SR,subtype='PCM_16')

scenes=[
    dict(id='A',bar_start=0,bar_end=5,name='VACUUM / INITIAL FORCE',act='ORIENTATION',note='One hand draws an initial field from near-darkness'),
    dict(id='B',bar_start=5,bar_end=17,name='MOTION / TWO CLOCKS',act='EXPANSION',note='Kinetic lines rotate; two temporal systems become visible'),
    dict(id='C',bar_start=17,bar_end=24,name='SUSPENSION / FRACTURE',act='SUSPENSION',note='A held hand suspends the sound field, negative space'),
    dict(id='D',bar_start=24,bar_end=36,name='OVERRIDE / CRITICAL MASS',act='PEAK',note='Foot launch. Field buckles, punctuated blackouts'),
    dict(id='E',bar_start=36,bar_end=42,name='AFTERIMAGE / RETURN',act='RELEASE',note='All surviving particles trace the original motif')]
for s in scenes:s.update(start_seconds=round(s['bar_start']*BAR,3),end_seconds=round(s['bar_end']*BAR,3))
frames=[]
for i in range(int(DURATION*20)+1):
    tt=i/20
    if tt<5*BAR:
        f=tt/(5*BAR); score={'energy':.12+.16*f,'density':.08+.07*f,'tension':.24+.3*f,'space':.13+.1*f}
    elif tt<17*BAR:
        f=(tt-5*BAR)/(12*BAR);score={'energy':.35+.27*f,'density':.34+.4*f,'tension':.47+.18*f,'space':.32+.38*f}
    elif tt<24*BAR:
        score={'energy':.18,'density':.18,'tension':.78,'space':.78}
    elif tt<36*BAR:
        f=(tt-24*BAR)/(12*BAR);score={'energy':.78+.15*f,'density':.74+.17*f,'tension':.93,'space':.5+.35*f}
    else:
        f=(tt-36*BAR)/(6*BAR);score={'energy':.5*(1-f)+.08,'density':.28*(1-f),'tension':.5*(1-f),'space':.82*(1-f)+.18}
    frames.append({'t':round(tt,2),'score':{k:round(float(np.clip(v,0,1)),3) for k,v in score.items()}})
(ROOT/'show-score-reference.json').write_text(json.dumps({'title':'CRITICAL FIELD · PRESSURE TEST','bpm':BPM,'meter':'4/4','seconds':DURATION,'source':'programmed demonstration reference (not AVP capture)','frame_rate_hz':20,'scenes':scenes,'frames':frames},ensure_ascii=False,indent=1),encoding='utf-8')
with (ROOT/'show-cues.csv').open('w',newline='',encoding='utf-8') as f:
    w=csv.writer(f);w.writerow(['scene','start_bar','start_seconds','end_seconds','music_action','visual_action','performer_action'])
    for s in scenes:w.writerow([s['id'],s['bar_start'],s['start_seconds'],s['end_seconds'],s['name'],s['note'],'foot:advance/kill; hand:shape field (not implemented in audio sketch)'])
RMS=float(np.sqrt(np.mean(master**2))); p=float(np.max(np.abs(master)))
print(f'OK: {DURATION:.2f}s, {SR}Hz, stereo PCM16, peak={p:.3f} (dBFS={20*np.log10(p):.2f}), RMS={RMS:.4f} (dBFS={20*np.log10(RMS):.2f})')
