"""Read public page content and selected media only. Never execute WordPress or import its settings.
Usage: python3 scripts/import_wordpress.py /workspace/site-source
Requires Pillow. Database parsing is limited to public NextGEN gallery tables.
"""
import sys,re,json,zipfile,hashlib,html,base64,io
from pathlib import Path
from urllib.parse import urlparse,unquote
import xml.etree.ElementTree as ET
from PIL import Image,ImageOps
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path(sys.argv[1] if len(sys.argv)>1 else '/workspace/site-source')
OUT=ROOT/'public/assets';OUT.mkdir(parents=True,exist_ok=True)
z=zipfile.ZipFile(SOURCE/'mo_download.zip');names=set(z.namelist())
ns={'w':'http://wordpress.org/export/1.2/','c':'http://purl.org/rss/1.0/modules/content/'}
items=ET.parse(SOURCE/'voodooxpeditionfoiler.WordPress.2026-10-22.xml').findall('./channel/item')
def field(i,key):return i.findtext('w:'+key,default='',namespaces=ns)
def meta(i):return {p.findtext('w:meta_key',namespaces=ns):p.findtext('w:meta_value',namespaces=ns) for p in i.findall('w:postmeta',ns)}
posts={field(i,'post_id'):i for i in items}
urls={k:urlparse(i.findtext('link') or '').path for k,i in posts.items()}
attachments={field(i,'post_id'):field(i,'attachment_url') for i in items if field(i,'post_type')=='attachment'}
assets={};missing=[]
existing_file=ROOT/'src/data/site.json'
previous=json.loads(existing_file.read_text()).get('assets',{}) if existing_file.exists() else {}
def asset(url):
 if not url:return ''
 url=html.unescape(url).strip();path=unquote(urlparse(url).path)
 if path in assets:return assets[path]['src']
 if path in previous and previous[path].get('variants') and all((ROOT/'public'/v['src'].lstrip('/')).exists() for v in previous[path]['variants']):
  assets[path]=previous[path];return assets[path]['src']
 if not path.startswith('/wp-content/'):return ''
 n='public_html'+path
 cached=SOURCE/'live-assets'/path.lstrip('/')
 if n not in names and not cached.exists():
  missing.append(url);return ''
 ext=Path(path).suffix.lower()
 if ext not in ('.png','.jpg','.jpeg','.webp','.gif','.mp4','.webm','.svg'):return ''
 key=hashlib.sha256(path.encode()).hexdigest()[:9]+'-'+Path(path).stem[:90]
 if ext in ('.mp4','.webm'):
  # Keep large source media outside the checkout; transcode selected clips separately.
  target=SOURCE/'selected-video';target.mkdir(exist_ok=True)
  dst=target/(key+ext)
  if not dst.exists():dst.write_bytes(z.read(n))
  assets[path]={'source':'https://voodooyachts.com'+path,'src':'/assets/'+key+'.mp4','videoSource':str(dst)}
  return assets[path]['src']
 if ext=='.svg':
  # SVG not copied: source can contain active content.
  missing.append(url);return ''
 try:
  im=ImageOps.exif_transpose(Image.open(io.BytesIO((cached.read_bytes() if cached.exists() else z.read(n)))))
  if im.mode not in ('RGB','RGBA'):im=im.convert('RGBA' if 'transparency' in im.info else 'RGB')
  w,h=im.size;variants=[]
  for width in sorted(set([min(640,w),min(1280,w),min(1920,w)])):
   name=f'{key}-{width}.webp';dest=OUT/name
   if not dest.exists():
    thumb=im.copy();thumb.thumbnail((width,10000));thumb.save(dest,'WEBP',quality=85,method=4)
   variants.append({'src':'/assets/'+name,'width':width})
  assets[path]={'source':'https://voodooyachts.com'+path,'src':variants[-1]['src'],'width':w,'height':h,'variants':variants}
  return assets[path]['src']
 except Exception as e:
  missing.append(url);print('Image unavailable:',path,type(e).__name__);return ''
def link(url):
 if url.startswith('@ET-DC@'):
  try:
   d=json.loads(base64.b64decode(url.split('@')[2]));return urls.get(str(d.get('settings',{}).get('post_id')),'#enquire')
  except Exception:return '#enquire'
 if 'voodooyachts.com' in url:
  u=urlparse(url);return (u.path or '/')+('?' +u.query if u.query else '')+('#'+u.fragment if u.fragment else '')
 return url if url.startswith(('/','#','mailto:','tel:','https://','http://')) else '#enquire'
# Parse only gallery-table inserts; no user, options, credential, form or customer records enter output.
db=zipfile.ZipFile(SOURCE/'db_dump.zip');sql=db.read(db.namelist()[0]).decode(errors='replace')
def sqlrows(table):
 pat=r'INSERT INTO `[^`]*_'+table+r'`[^\n]*?VALUES\s*'
 for m in re.finditer(pat,sql):
  s=sql[m.end():];row=[];value='';quoted=False;escaped=False;active=False
  for c in s:
   if quoted:
    if escaped:value+= {'n':'\n','r':'\r','0':'\0'}.get(c,c);escaped=False
    elif c=='\\':escaped=True
    elif c=="'":quoted=False
    else:value+=c
   elif c=="'":quoted=True
   elif c=='(' and not active:active=True;row=[];value=''
   elif c==',' and active:row.append(value.strip());value=''
   elif c==')' and active:row.append(value.strip());yield row;active=False;value=''
   elif c==';':break
   elif active:value+=c
folders={r[0]:r[3] for r in sqlrows('ngg_gallery')}
galleryraw={}
for r in sqlrows('ngg_pictures'):
 if r[8]!='1':galleryraw.setdefault(r[3],[]).append({'path':'/'+folders.get(r[3],'').strip('/')+'/'+r[4],'alt':r[6] or Path(r[4]).stem,'order':int(r[9] or 0)})
for g in galleryraw.values():g.sort(key=lambda x:x['order'])
print('NextGEN galleries:',len(galleryraw),flush=True)
# Divi shortcodes become a declarative content tree. Arbitrary code modules are never executed.
token=re.compile(r'\[(/?)(et_pb_\w+|ngg)([^\]]*)\]')
attrs_re=re.compile(r'(\w+)="([^"]*)"')
keep={'disabled_on','disabled','background_color','background_image','background_position','background_video_mp4','height','module_class','module_id','column_structure','type','text_orientation','text_text_color','header_text_color','header_2_text_color','header_2_font_size','text_font_size','header_font_size','src','title_text','alt','url','url_new_window','button_url','button_text','image','title','gallery_ids','ids','show_content','background_layout','custom_padding','width','max_width','module_alignment','header_fullscreen','admin_label'}
def parse(content):
 root={'type':'root','attrs':{},'children':[]};stack=[root];pos=0
 for m in token.finditer(content):
  text=content[pos:m.start()]
  if text.strip():stack[-1]['children'].append({'type':'html','html':text})
  closing,typ,raw=m.groups();pos=m.end()
  if closing:
   for j in range(len(stack)-1,0,-1):
    if stack[j]['type']==typ:stack=stack[:j];break
  else:
   a={k:html.unescape(v) for k,v in attrs_re.findall(raw) if k in keep}
   node={'type':typ,'attrs':a,'children':[]};stack[-1]['children'].append(node)
   if typ not in ('ngg','et_pb_line_break_holder'):stack.append(node)
 if content[pos:].strip():stack[-1]['children'].append({'type':'html','html':content[pos:]})
 return root['children']
def process(nodes):
 result=[]
 for n in nodes:
  typ=n['type'];a=n.get('attrs',{})
  if a.get('disabled')=='on' or a.get('disabled_on','').split('|')[-1]=='on':continue
  # Footer becomes a shared, demo-safe React component.
  if a.get('admin_label')=='Footer Section':continue
  if typ in ('et_pb_code','et_pb_contact_form','et_pb_social_media_follow','et_pb_social_media_follow_network','et_pb_line_break_holder'):continue
  if typ=='html':
   raw=n['html'];raw=re.sub(r'<(script|style|iframe)\b[^>]*>.*?</\1>','',raw,flags=re.S|re.I)
   raw=re.sub(r'\[instagram-feed[^\]]*\]','',raw)
   raw=re.sub(r'https?://(?:www\.)?voodooyachts\.com(/wp-content/[^\s"<>]+)',lambda m:asset(m.group(0)),raw)
   raw=re.sub(r'(href=["\'])https?://(?:www\.)?voodooyachts\.com',r'\1',raw)
   n={'type':'html','html':raw}
   if not re.sub(r'<[^>]+>','',raw).strip() and '<img' not in raw:continue
  else:
   for key in ['background_image','src','image','background_video_mp4']:
    if a.get(key):a[key]=asset(a[key])
   for key in ['button_url','url']:
    if a.get(key):a[key]=link(a[key])
   if typ=='ngg':
    pics=galleryraw.get(a.get('ids',''),[])
    n['images']=[{'src':asset(p['path']),'alt':p['alt']} for p in pics]
    n['images']=[p for p in n['images'] if p['src']]
   if a.get('module_id')=='reef-background':a['background_image']=asset('https://voodooyachts.com/wp-content/uploads/2019/12/Sustainability-Header-new.jpg')
   if typ=='et_pb_gallery':n['images']=[{'src':asset(attachments.get(k,'')),'alt':'Voodoo yacht detail'} for k in a.get('gallery_ids','').split(',') if attachments.get(k)]
   n['children']=process(n.get('children',[]))
   if not n['children'] and typ in ('et_pb_text','et_pb_row') and not a.get('background_image'):continue
  result.append(n)
 return result
pages=[]
exclude={'home','landing','holding-page','range-map-testing-page','xf95-3'}
for i in items:
 typ=field(i,'post_type')
 if typ not in ('page','project','post') or field(i,'status')!='publish' or field(i,'post_name') in exclude:continue
 if typ=='post' and i.findtext('title')=='Hello world!':continue
 content=i.findtext('c:encoded',default='',namespaces=ns)
 if not content:continue
 print('Importing',i.findtext('title'),flush=True)
 p={'id':field(i,'post_id'),'title':i.findtext('title'),'path':urlparse(i.findtext('link')).path,'kind':'story' if typ in ('project','post') else ('yacht' if re.match(r'^(XF|DSF)',i.findtext('title') or '') else 'page'),'modified':field(i,'post_modified'),'nodes':process(parse(content))}
 m=meta(i)
 if m.get('_thumbnail_id'):p['thumbnail']=asset(attachments.get(m['_thumbnail_id'],''))
 text=re.sub(r'\[[^\]]+\]|<[^>]+>',' ',content);text=html.unescape(re.sub(r'\s+',' ',text)).strip();p['description']=text[:155]
 pages.append(p)
logo=asset('https://voodooyachts.com/wp-content/uploads/2019/09/VOODOO-Logo-White.png')
# Include the original, referenced design CSS only as review evidence, not as executable application code.
(ROOT/'docs/original-theme.css').write_bytes(z.read('public_html/wp-content/themes/webbros/style.css'))
data={'pages':pages,'assets':{p:{k:v for k,v in a.items() if k!='videoSource'} for p,a in assets.items()},'logo':logo}
(ROOT/'src/data/site.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
(ROOT/'docs/asset-manifest.json').write_text(json.dumps([{k:v for k,v in a.items() if k!='videoSource'} for a in assets.values()],ensure_ascii=False,indent=2))
(ROOT/'docs/import-report.json').write_text(json.dumps({'pages':[{k:v for k,v in p.items() if k!='nodes'} for p in pages],'missingAssets':sorted(set(missing)),'galleryCount':len(galleryraw),'excludedLegacySlugs':sorted(exclude)},ensure_ascii=False,indent=2))
(SOURCE/'video-jobs.json').write_text(json.dumps([a for a in assets.values() if 'videoSource' in a],indent=2))
print('Imported',len(pages),'pages;',len(assets),'media;',len(set(missing)),'unresolved URLs.',flush=True)
