#!/usr/bin/env python3
"""Build a self-contained HTML reader using Python 3 standard library only.
Markdown support intentionally matches this book: headings, paragraphs,
blockquotes, bullet lists, HTTPS links and named footnotes. No raw HTML.
"""
from pathlib import Path
from urllib.parse import urlsplit
import html
import json
import re

ROOT = Path(__file__).resolve().parent
CSS = '''
:root{--paper:#fbfaf7;--ink:#242529;--muted:#696b71;--line:#d9d8d3;--accent:#ad482f;--soft:#f0eee9;--serif:"Songti SC","Noto Serif CJK SC",serif;--sans:"PingFang SC","Microsoft YaHei",system-ui,sans-serif}
*{box-sizing:border-box}html{scroll-behavior:auto;scroll-padding-top:76px}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.8 var(--sans)}a{color:inherit;text-underline-offset:4px}a:hover{color:var(--accent)}button{font:inherit;cursor:pointer}a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid var(--accent);outline-offset:4px}.wrap{max-width:1120px;padding:0 32px;margin:auto}.mast{padding:52px 0 32px;border-bottom:1px solid var(--line)}.eyebrow{font-size:12px;letter-spacing:.12em;color:var(--accent)}h1{font:600 clamp(42px,6vw,70px)/1.25 var(--serif);margin:22px 0 8px}.subtitle{font:24px/1.6 var(--serif);margin:0}.deck{font-size:17px;color:var(--muted);max-width:680px}.notice{font-size:12px;color:var(--muted)}nav{position:sticky;top:0;z-index:3;background:var(--paper);border-bottom:1px solid var(--line)}nav .wrap{display:flex;gap:25px;overflow:auto;white-space:nowrap;padding-top:12px;padding-bottom:12px}nav a{text-decoration:none;font-size:14px}.entry{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;padding:28px 0}.card{border:1px solid var(--line);padding:20px;text-decoration:none}.card small{color:var(--accent)}.card h2{font:600 21px/1.6 var(--serif);margin:7px 0}.card p{font-size:13px;color:var(--muted)}section{padding:20px 0}.atlas>summary,.course>summary{cursor:pointer;padding:17px 0;font:600 22px/1.5 var(--serif)}.atlas{border-top:1px solid var(--ink)}.part{display:grid;grid-template-columns:220px 1fr;gap:22px;border-top:1px solid var(--line);padding:18px 0}.part h3{font:600 21px/1.6 var(--serif);margin:0}.part ul{list-style:none;padding:0;margin:0}.part li{padding:7px 0;border-bottom:1px solid var(--line);font-size:14px}.state{font-size:11px;color:var(--muted);margin-left:12px}.routes{display:flex;gap:10px;flex-wrap:wrap;margin:22px 0}.route{padding:12px 16px;border:1px solid var(--line);font-size:13px}.route p{margin:4px 0}.article{max-width:780px;margin:65px auto 0;padding-top:30px;border-top:3px solid var(--ink);font:18px/2 var(--serif)}.article h2{font:600 36px/1.45 var(--serif);margin:15px 0 22px}.article h3{font:600 25px/1.5 var(--serif);margin:40px 0 16px}.article p{margin:19px 0}.article blockquote{margin:0 0 30px;color:#626165;font-size:21px;line-height:1.8}.article blockquote p{margin:0}.article li{margin:10px 0}.article a{overflow-wrap:anywhere}.article sup{font:11px var(--sans);line-height:0}.article sup a{color:var(--accent);text-decoration:none}.article .kicker{font:12px var(--sans);color:var(--accent);letter-spacing:.08em}.footnotes{font:13px/1.9 var(--sans);color:var(--muted);border-top:1px solid var(--line);margin-top:35px;overflow-wrap:anywhere}.footnotes summary{padding:15px 0;cursor:pointer}.footnotes ol{padding-left:25px}.media{font:14px/1.8 var(--sans);border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:20px 0;margin:28px 0}.media h4{margin:0 0 7px;font-size:17px}.media p{font:13px/1.8 var(--sans);margin:8px 0;color:var(--muted)}.load-media{border:0;background:var(--ink);color:white;padding:10px 15px;margin-right:12px;border-radius:3px}.player iframe{width:100%;aspect-ratio:16/9;border:0;margin-top:18px}.back{font:13px var(--sans);display:block;margin:34px 0}.courses{display:grid;grid-template-columns:1fr 1fr;gap:18px}.courses>div{border:1px solid var(--line);padding:20px}.courses h3{font:600 22px var(--serif)}.courses li{font-size:14px}footer{padding:30px 0 60px;color:var(--muted);font-size:12px;border-top:1px solid var(--line);margin-top:60px}
@media(max-width:800px){.wrap{padding:0 20px}.mast{padding-top:30px}.entry,.courses{grid-template-columns:1fr}.entry{gap:10px}.card{padding:15px 19px}.part{grid-template-columns:1fr;gap:10px}.article{font-size:17px;margin-top:44px}.article h2{font-size:29px}.article h3{font-size:23px}.article blockquote{font-size:19px}.routes{display:block}.route{margin:10px 0}.state{float:right}nav .wrap{gap:22px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
'''
CSS += '''
.preface-entry{display:block;border-bottom:1px solid var(--line);padding:24px 0 8px;text-decoration:none}.preface-entry h2{font:600 26px/1.6 var(--serif);margin:4px 0}.preface-entry p{font-size:14px;color:var(--muted)}.section-toc{font:13px/1.8 var(--sans);border-bottom:1px solid var(--line);padding:12px 0 18px;margin:0 0 25px}.section-toc summary{cursor:pointer;color:var(--muted)}.section-toc ul{padding-left:20px}.section-toc li{margin:3px 0}.article .section-toc a{text-decoration:none}.route a{color:var(--accent)}.route .unwritten{color:var(--muted)}.article [id]{scroll-margin-top:80px}
'''
JS = '''
function revealHash(){
 const id=decodeURIComponent(location.hash.slice(1));
 const element=document.getElementById(id);if(!element)return;
 let parent=element.parentElement;
 while(parent){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}
 requestAnimationFrame(()=>element.scrollIntoView({block:'start'}));
}
window.addEventListener('hashchange',revealHash);
if(location.hash)window.addEventListener('load',revealHash);
document.querySelectorAll('.load-media').forEach(button=>button.addEventListener('click',()=>{
 const {provider,id}=button.dataset;
 if(!(/^[a-zA-Z0-9_-]+$/.test(id)))return;
 const src=provider==='vimeo'?'https://player.vimeo.com/video/'+id+'?autoplay=0&dnt=1':'https://www.youtube-nocookie.com/embed/'+id+'?autoplay=0&rel=0';
 const frame=document.createElement('iframe');frame.src=src;frame.title=button.dataset.title;frame.allow='fullscreen; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
 button.closest('.media').querySelector('.player').replaceChildren(frame);button.disabled=true;button.textContent='已请求载入播放器';
}));
'''

def esc(value):
    return html.escape(str(value), quote=True)

def inline(text, prefix, notes, order):
    tokens=[]
    def put(value):
        tokens.append(value)
        return f'ZZTOKEN{len(tokens)-1}ZZ'
    def link(match):
        label,url=match.groups()
        if urlsplit(url).scheme!='https':
            raise ValueError(f'Only HTTPS links permitted: {url}')
        return put(f'<a href="{esc(url)}" target="_blank" rel="noopener noreferrer">{esc(label)}</a>')
    text=re.sub(r'\[(?!\^)([^\n]+?)\]\((https://[^\s)]+)\)',link,text)
    def foot(match):
        key=match.group(1)
        if key not in notes:raise ValueError(f'Undefined footnote {key}')
        if key not in order:order.append(key)
        n=order.index(key)+1
        return put(f'<sup><a href="#{prefix}-note-{esc(key)}" aria-label="注释{n}">〔{n}〕</a></sup>')
    text=re.sub(r'\[\^([a-zA-Z0-9_-]+)\]',foot,text)
    # Bare URLs occur in notes. Existing linked URLs are already protected.
    text=re.sub(r'https://[^\s<>]+',lambda m:put(f'<a href="{esc(m.group())}" target="_blank" rel="noopener noreferrer">{esc(m.group())}</a>'),text)
    text=esc(text)
    for i,value in enumerate(tokens):text=text.replace(f'ZZTOKEN{i}ZZ',value)
    return text

def render_markdown(text, prefix):
    notes={};body=[]
    for line in text.splitlines():
        m=re.match(r'^\[\^([a-zA-Z0-9_-]+)\]:\s*(.*)$',line)
        if m:notes[m.group(1)]=m.group(2)
        else:body.append(line)
    order=[];out=[];paragraph=[];in_list=False
    def flush():
        if paragraph:
            out.append('<p>'+inline(' '.join(paragraph),prefix,notes,order)+'</p>');paragraph.clear()
    for line in body+['']:
        if line.startswith('- '):
            flush()
            if not in_list:out.append('<ul>');in_list=True
            out.append('<li>'+inline(line[2:],prefix,notes,order)+'</li>');continue
        if in_list:out.append('</ul>');in_list=False
        if not line.strip():flush();continue
        if line.startswith('# '):
            flush();out.append('<h2>'+inline(line[2:],prefix,notes,order)+'</h2>')
        elif line.startswith('## '):
            flush();out.append('<h3>'+inline(line[3:],prefix,notes,order)+'</h3>')
        elif line.startswith('> '):
            flush();out.append('<blockquote><p>'+inline(line[2:],prefix,notes,order)+'</p></blockquote>')
        else:paragraph.append(line)
    unused=set(notes)-set(order)
    if unused:raise ValueError(f'Unused footnotes: {unused}')
    footnotes='<details class="footnotes"><summary>本章注释</summary><ol>'
    for key in order:
        footnotes+=f'<li id="{prefix}-note-{esc(key)}">'+inline(notes[key],prefix,{},[])+'</li>'
    return '\n'.join(out),(footnotes+'</ol></details>' if order else '')

def checked_source(pathname):
    path=(ROOT/pathname).resolve()
    if ROOT not in path.parents:raise ValueError('Source outside book')
    text=path.read_text(encoding='utf-8')
    for banned in ['amb_live_', '/Users/', '钱誉文', 'Glitch Sequence', '12月4日', '12 月 4 日', '你已经', '你喜欢']:
        if banned in text:raise ValueError(f'Private-context marker in {path.name}: {banned}')
    return text

def with_section_toc(body,prefix):
    entries=[]
    def heading(match):
        anchor=f'{prefix}-section-{len(entries)+1}'
        title=match.group(1)
        entries.append((anchor,title))
        return f'<h3 id="{anchor}">{title}</h3>'
    body=re.sub(r'<h3>(.*?)</h3>',heading,body)
    if entries:
        toc='<details class="section-toc"><summary>本章段落</summary><ul>'+''.join(f'<li><a href="#{anchor}">{title}</a></li>' for anchor,title in entries)+'</ul></details>'
        body=re.sub(r'(</h2>)',lambda m:m.group(1)+toc,body,count=1)
    return body

def main():
    data=json.loads((ROOT/'book.json').read_text(encoding='utf-8'))
    chapters=[c for p in data['parts'] for c in p['chapters']]
    assert [c['number'] for c in chapters]==list(range(1,25)), 'Chapter order differs from approved structure'
    written=[c for c in chapters if c.get('file')]
    available={c['number'] for c in written}
    frontmatter=data.get('frontmatter',[])
    for route in data['routes']:assert all(1<=n<=24 for n in route['chapters'])
    page=['<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>'+esc(data['title']+'：'+data['subtitle'])+'</title><style>'+CSS+'</style></head><body>']
    note=data['edition']+' · 收录前言与第'+ '、'.join(f'{c["number"]:02d}' for c in written)+'章；其他章节保留目录。'
    page.append('<header class="mast" id="top"><div class="wrap"><div class="eyebrow">'+esc(data['description'])+'</div><h1>'+esc(data['title'])+'</h1><p class="subtitle">'+esc(data['subtitle'])+'</p><p class="deck">从作品认识声音的来处，从创作选择理解工具，再把音乐带进现场。</p><p class="notice">'+esc(note)+'</p></div></header>')
    page.append('<nav aria-label="阅读导航"><div class="wrap"><a href="#reading">阅读目录</a><a href="#preface">前言</a><a href="#atlas">六组地图</a><a href="#chapter-1">开篇</a><a href="#chapter-2">池田亮司</a><a href="#chapter-9">Robert Henke</a><a href="#chapter-20">黑川与NONOTAK</a><a href="#courses">制作课程</a></div></nav><main class="wrap">')
    page.append('<section id="reading">')
    for f in frontmatter:
        page.append('<a class="preface-entry" href="#'+esc(f['id'])+'"><span class="eyebrow">开始阅读</span><h2>'+esc(f['title'])+'</h2><p>作品、工具与一条可以折返的阅读路线。</p></a>')
    page.append('<div class="entry">')
    for c in written:
        page.append(f'<a class="card" href="#chapter-{c["number"]}"><small>第{c["number"]:02d}章</small><h2>{esc(c["title"])}</h2><p>{esc(c.get("summary","阅读正文 →"))}</p></a>')
    page.append('</div></section><details class="atlas" id="atlas"><summary>六组目录与主题路线</summary>')
    for p in data['parts']:
        page.append('<div class="part"><h3>'+esc(p['id']+' · '+p['title'])+'</h3><ul>')
        for c in p['chapters']:
            title=f'{c["number"]:02d}　{esc(c["title"])}'
            if c.get('file'):title=f'<a href="#chapter-{c["number"]}">{title}</a><span class="state">正文稿</span>'
            else:title+='<span class="state">目录</span>'
            page.append('<li>'+title+'</li>')
        page.append('</ul></div>')
    page.append('<div class="routes">')
    for route in data['routes']:
        route_links=[f'<a href="#chapter-{n}">{n:02d}</a>' if n in available else f'<span class="unwritten">{n:02d}</span>' for n in route['chapters']]
        page.append('<div class="route"><strong>'+esc(route['title'])+'</strong><p>'+' → '.join(route_links)+'</p></div>')
    page.append('</div><p class="notice">可点击的编号已有正文；灰色编号仍为目录，不作为完成章节。</p></details>')
    report=[]
    for f in frontmatter:
        text=checked_source(f['file']);body,notes=render_markdown(text,'front-'+f['id'])
        page.append('<article class="article" id="'+esc(f['id'])+'"><div class="kicker">序</div>'+with_section_toc(body,'front-'+f['id'])+notes+'<a class="back" href="#chapter-1">继续阅读：从一场演出开始 →</a></article>')
        report.append({'chapter':'preface','source':f['file'],'han_characters':len(re.findall(r'[\u4e00-\u9fff]',text))})
    for c in written:
        text=checked_source(c['file']);prefix=f'c{c["number"]}'
        body,notes=render_markdown(text,prefix)
        page.append(f'<article class="article" id="chapter-{c["number"]}"><div class="kicker">第{c["number"]:02d}章</div>'+with_section_toc(body,prefix))
        for m in data['media'].get(str(c['number']),[]):
            assert m['provider'] in ['vimeo','youtube']
            assert re.fullmatch(r'[a-zA-Z0-9_-]+',m['id'])
            page.append('<aside class="media"><h4>'+esc(m['title'])+'</h4><p>'+esc(m['note'])+'</p><button class="load-media" data-provider="'+esc(m['provider'])+'" data-id="'+esc(m['id'])+'" data-title="'+esc(m['title'])+'">载入作品或讲座录像</button><a href="'+esc(m['source'])+'" target="_blank" rel="noopener noreferrer">在原站打开 ↗</a><div class="player"></div></aside>')
        page.append(notes+'<a class="back" href="#reading">返回阅读目录 ↑</a></article>')
        report.append({'chapter':c['number'],'source':c['file'],'han_characters':len(re.findall(r'[\u4e00-\u9fff]',text))})
    page.append('<section id="courses"><h2>制作课程</h2><p class="notice">四组课程仍在设计中，尚未提供经实机验证的可跟做工程。正文阅读不以完成作业为条件。</p><div class="courses">')
    for group in data['courses']:
        page.append('<div><h3>'+esc(group['title'])+'</h3><ul>'+''.join('<li>'+esc(u)+'</li>' for u in group['units'])+'</ul></div>')
    page.append('</div></section></main><footer><div class="wrap">声音的组织 · 网页审读稿。正文与注释可离线阅读；外部媒体仅在主动点击后载入，实际播放取决于平台和网络。作品版权归原作者与发行机构。<br>未写章节不计入正文完成量；编务记录与图像许可清单另存，不进入人物正文。</div></footer><script>'+JS+'</script></body></html>')
    output='\n'.join(page)
    ids=re.findall(r'\bid="([^"]+)"',output)
    assert len(ids)==len(set(ids)), 'Duplicate HTML IDs'
    for target in re.findall(r'href="#([^"]+)"',output):assert target in ids, f'Missing anchor {target}'
    for url in re.findall(r'href="(https://[^"]+)"',output):
        assert not any(ch in url for ch in ['。','《','》','；']), f'Malformed URL: {url}'
    dest=ROOT/'site';dest.mkdir(exist_ok=True)
    (dest/'index.html').write_text(output,encoding='utf-8')
    (dest/'build-report.json').write_text(json.dumps({'edition':data['edition'],'chapters':report,'checks':['24 chapter order','all manuscript paths','footnote definitions','HTML IDs and anchors','selected private-context markers'],'limitations':['No independent reader test','No actual Ableton/TouchDesigner runtime test','Third-party playback not validated','No third-party photo embedded']},ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'output':'site/index.html','written_chapters':[c['number'] for c in written],'frontmatter':len(frontmatter),'han_characters':sum(r['han_characters'] for r in report)},ensure_ascii=False))

if __name__=='__main__':main()
