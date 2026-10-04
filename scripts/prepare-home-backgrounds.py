"""Split the ImageGen triptych into three compact phone wallpapers."""
import sys
from pathlib import Path
from PIL import Image

source = Image.open(sys.argv[1]).convert('RGB')
assets = Path(__file__).resolve().parents[1] / 'dist' / 'assets'
for i, period in enumerate(['morning', 'day', 'night']):
    panel = source.crop((round(source.width * i / 3), 0,
                         round(source.width * (i + 1) / 3), source.height))
    panel.save(assets / f'home-{period}.jpg', quality=88, optimize=True)
