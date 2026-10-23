import json,subprocess,concurrent.futures
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def prepare(j):
 src=Path(j['videoSource']);out=root/'public'/j['src'].lstrip('/')
 probe=subprocess.run(['ffprobe','-v','error',str(src)],capture_output=True)
 if probe.returncode or not Path(str(src)+'.verified-url').exists():
  dl=subprocess.run(['curl','-sS','-L','--fail','--max-time','180','--max-filesize','500000000','-o',str(src)+'.download',j['source']],capture_output=True)
  if dl.returncode:print('Video source unavailable:',j['source'],flush=True);return
  Path(str(src)+'.download').replace(src)
  Path(str(src)+'.verified-url').write_text(j['source']+'\n')
 result=subprocess.run(['ffmpeg','-v','error','-y','-i',str(src),'-an','-vf','scale=1280:-2','-c:v','libx264','-preset','fast','-crf','28','-movflags','+faststart','-threads','2',str(out)],capture_output=True)
 print('Video',out.name,'prepared' if result.returncode==0 and out.stat().st_size>10000 else 'failed',flush=True)
 if 'Home-Page-Welcome' in str(src) and result.returncode==0:
  subprocess.run(['ffmpeg','-v','error','-y','-ss','2','-i',str(out),'-frames:v','1',str(root/'public/assets/hero-poster.webp')],capture_output=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:list(ex.map(prepare,json.load(open('/workspace/site-source/video-jobs.json'))))
