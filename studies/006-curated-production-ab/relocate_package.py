"""Repair only this package's media paths after moving/copying it."""
from pathlib import Path
import xml.etree.ElementTree as ET
import hashlib,json,sys
root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parent
for version in ['A','B']:
 file=root/version/f'CF_16bar_{version}.tracktionedit'
 tree=ET.parse(file)
 for clip in tree.getroot().iter('AUDIOCLIP'):
  media=root/version/'media'/Path(clip.get('source')).name
  assert media.exists(),media
  clip.set('source',str(media))
 ET.indent(tree);tree.write(file,encoding='utf-8',xml_declaration=True)
manifest=json.loads((root/'manifest.json').read_text())
manifest['files']={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file() and p.name!='manifest.json'}
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Media references repaired. This is NOT a Waveform open/save validation.')
