import json
import os
import zipfile

mapping = {
    'CVV _ Organic.lottie': 'cvv-organic.json',
    'talking.lottie': 'talking.json',
    'holdpaper.lottie': 'holdpaper.json',
    'Central icons _ Brush.lottie': 'central-icons-brush.json',
    'Laughing emoji.lottie': 'laughing-emoji.json',
    'Cool emoji.lottie': 'cool-emoji.json',
    'Anxious emoji.lottie': 'anxious-emoji.json',
    'Instagram logo.lottie': 'instagram-logo.json',
    'Threads.lottie': 'threads.json',
    'Facebook.lottie': 'facebook.json',
    'Chat.lottie': 'chat.json',
    'Add to cart.lottie': 'add-to-cart.json',
}

for src_name, out_name in mapping.items():
    src_path = os.path.join('animations', src_name)
    out_path = os.path.join('animations', out_name)
    with zipfile.ZipFile(src_path, 'r') as z:
        manifest = json.loads(z.read('manifest.json'))
        animations = manifest.get('animations', [])
        if not animations:
            raise SystemExit(f'No animations metadata in {src_name}')
        anim_id = animations[0].get('id')
        if not anim_id:
            raise SystemExit(f'No animation id in {src_name}')
        candidate = f'animations/{anim_id}.json'
        if candidate in z.namelist():
            data = z.read(candidate)
        elif 'animations/main.json' in z.namelist():
            data = z.read('animations/main.json')
        elif 'main.json' in z.namelist():
            data = z.read('main.json')
        else:
            raise SystemExit(f'Unable to find animation json in {src_name}')
    with open(out_path, 'wb') as f:
        f.write(data)
    print('created', out_path)
