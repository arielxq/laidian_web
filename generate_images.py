from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

base = Path('images')
base.mkdir(exist_ok=True)

# Logo PNG
logo = Image.new('RGBA', (600, 200), (250, 244, 235, 255))
d = ImageDraw.Draw(logo)
try:
    font = ImageFont.truetype('/Library/Fonts/Times New Roman.ttf', 48)
except Exception:
    font = ImageFont.load_default()
d.text((30, 70), '來單文化', fill=(68, 52, 39, 255), font=font)
logo.save(base / '來單文化.png')

# Product folders and placeholders
products = [
    ('城市字繪系列明信片', '城市字繪系列明信片'),
    ('文化資產系列明信片', '文化資產系列明信片'),
    ('銀票系列明信片', '銀票系列明信片'),
    ('台灣地圖字繪印章本', '台灣地圖字繪印章本'),
    ('台灣旅行手帳本', '台灣旅行手帳本'),
]
for folder, text in products:
    p = base / folder
    p.mkdir(exist_ok=True)
    img = Image.new('RGB', (900, 600), (239, 231, 214))
    draw = ImageDraw.Draw(img)
    try:
        title_font = ImageFont.truetype('/Library/Fonts/Arial.ttf', 36)
    except Exception:
        title_font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), text, font=title_font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    draw.text(((900 - w) / 2, (600 - h) / 2), text, fill=(76, 49, 34), font=title_font)
    img.save(p / 'hero.png')

print('created placeholder images')
