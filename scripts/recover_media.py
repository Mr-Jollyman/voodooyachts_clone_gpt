"""Fetch missing public media from its original verified source URL, caching outside Git."""
import json,subprocess,concurrent.futures
from pathlib import Path
from urllib.parse import urlparse,unquote
root=Path(__file__).resolve().parents[1];cache=Path('/workspace/site-source/live-assets')
urls=list({a['source'] for a in json.loads((root/'src/data/site.json').read_text())['assets'].values()})
def fetch(url):
 path=unquote(urlparse(url).path)
 if not path.startswith('/wp-content/') or Path(path).suffix.lower() not in ('.png','.jpg','.jpeg','.webp','.gif'):return None
 dest=cache/path.lstrip('/');dest.parent.mkdir(parents=True,exist_ok=True)
 if dest.exists():return True
 result=subprocess.run(['curl','-sS','-L','--fail','--max-time','40','--max-filesize','30000000','-o',str(dest)+'.partial','https://voodooyachts.com'+path],capture_output=True)
 tmp=Path(str(dest)+'.partial')
 if result.returncode==0:tmp.rename(dest);return True
 tmp.unlink(missing_ok=True);return False
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
 results=list(ex.map(fetch,urls))
print('Recovered',results.count(True),'public source images;',results.count(False),'unavailable.')
