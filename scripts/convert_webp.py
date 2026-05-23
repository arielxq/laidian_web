from pathlib import Path
import re, json
from PIL import Image

base = Path('.')
html = (base/'index.html').read_text(encoding='utf-8')
# collect product image paths from data-folder attributes and manifest
folders = [m.group(1) for m in re.finditer(r'data-folder="([^\"]+)"', html)]
manifest_path = base/'images'/'manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {}
paths = set()
for folder in folders:
    # prefer manifest list if available
    names = manifest.get(folder, [])
    if not names:
        # fallback: include files in folder
        folder_path = base/'images'/folder
        if folder_path.exists():
            for p in folder_path.iterdir():
                if p.suffix.lower() in ['.jpg','.jpeg','.png']:
                    names.append(p.name)
    for name in names:
        p = base/'images'/folder/name
        if p.exists():
            paths.add(p)
# also include background and logo used in page
for p in [base/'images'/'background01.jpg', base/'images'/'來點文化.png']:
    if p.exists(): paths.add(p)

print('Found', len(paths), 'images to convert')

# sizes to generate (widths)
# include a medium-large 900px size for lightbox srcset
sizes = [520, 900, 1400]
created = []
for p in sorted(paths):
    try:
        with Image.open(p) as im:
            im = im.convert('RGB')
            w,h = im.size
            for target_w in sizes:
                out = p.with_name(p.stem + f'-{target_w}.webp')
                if w <= target_w:
                    # save at original size as webp
                    im.save(out, 'WEBP', quality=75, method=6)
                    created.append(out)
                else:
                    ratio = target_w / float(w)
                    target_h = int(h * ratio)
                    resized = im.resize((target_w, target_h), Image.LANCZOS)
                    resized.save(out, 'WEBP', quality=75, method=6)
                    created.append(out)
        print('OK', p.name)
    except Exception as e:
        print('ERR', p.name, e)

print('Created', len(created), 'webp files')
