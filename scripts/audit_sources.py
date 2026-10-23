import json,subprocess,concurrent.futures,html,re
from pathlib import Path
from html.parser import HTMLParser
root=Path(__file__).resolve().parents[1];out=Path('/workspace/site-source/live-pages');out.mkdir(exist_ok=True)
class Headings(HTMLParser):
 def __init__(self):super().__init__();self.tag=None;self.text='';self.headings=[]
 def handle_starttag(self,t,a):
  if t in ('h1','h2','h3','h4'):self.tag=t;self.text=''
 def handle_data(self,s):
  if self.tag:self.text+=s
 def handle_endtag(self,t):
  if t==self.tag:self.headings.append(re.sub(r'\s+',' ',self.text).strip());self.tag=None
site=json.loads((root/'src/data/site.json').read_text())
def audit(p):
 dest=out/(p['id']+'.html');r=subprocess.run(['curl','-sS','-L','--fail','--max-time','35','-o',str(dest),'https://voodooyachts.com'+p['path']],capture_output=True)
 if r.returncode:return {'path':p['path'],'liveStatus':'inaccessible'}
 parser=Headings();parser.feed(dest.read_text(errors='replace'))
 def nodes(ns):
  for n in ns:
   if n['type']=='html':yield n['html']
   yield from nodes(n.get('children',[]))
 source=Headings();source.feed(''.join(nodes(p['nodes'])))
 normalize=lambda t:html.unescape(t).lower().strip().replace('’',"'")
 live=set(map(normalize,parser.headings));source_titles=[h for h in source.headings if h and not h.startswith('@ET-DC@')]
 missing=[h for h in source_titles if normalize(h) not in live]
 return {'path':p['path'],'liveStatus':'accessible','exportHeadingsAbsentFromLive':list(dict.fromkeys(missing)),'liveHeadings':parser.headings}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:results=list(ex.map(audit,site['pages']))
(root/'docs/live-source-audit.json').write_text(json.dumps({'checkedDate':'2026-10-23','method':'TLS-verified HTTP reads; heading comparison against imported public export content. Differences require review; punctuation and nested markup can affect this comparison.','pages':results},indent=2,ensure_ascii=False)+'\n')
print('Live checks:',len(results),'pages;',sum(r['liveStatus']=='accessible' for r in results),'accessible')
print('Heading differences:',[(r['path'],r.get('exportHeadingsAbsentFromLive')) for r in results if r.get('exportHeadingsAbsentFromLive')])
