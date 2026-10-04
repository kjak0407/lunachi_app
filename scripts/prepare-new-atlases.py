"""Pack generated transparent objects into uniform cells for CSS sprites."""
from pathlib import Path
from PIL import Image
import numpy as np
import sys

root = Path(__file__).resolve().parents[1]
for name in (sys.argv[1:] or ['vehicles-v2', 'instruments-v2']):
    source = root / '.tools' / (name + '-source.png')
    if not source.exists():
        source.write_bytes((root / 'dist/assets' / (name + '.png')).read_bytes())
    original = Image.open(source).convert('RGBA')
    alpha = np.array(original.getchannel('A'))
    active = alpha > 40
    height, width = active.shape
    groups = [[] for _ in range(9)]
    for y in range(height):
        for x in range(width):
            if not active[y, x]:
                continue
            active[y, x] = False
            stack, points = [(x, y)], []
            while stack:
                px, py = stack.pop()
                points.append((px, py))
                for nx, ny in [(px-1,py),(px+1,py),(px,py-1),(px,py+1)]:
                    if 0 <= nx < width and 0 <= ny < height and active[ny, nx]:
                        active[ny, nx] = False
                        stack.append((nx, ny))
            if len(points) < 80:
                continue
            center = np.mean(points, axis=0)
            col = min(2, int(center[0] * 3 / width))
            row = min(2, int(center[1] * 3 / height))
            groups[row * 3 + col].extend(points)
    atlas = Image.new('RGBA', (1200, 1200))
    for index, points in enumerate(groups):
        mask = Image.new('L', original.size)
        pixels = mask.load()
        for x, y in points:
            pixels[x, y] = 255
        from PIL import ImageFilter, ImageChops
        mask = mask.filter(ImageFilter.MaxFilter(5))
        sprite = original.copy()
        sprite.putalpha(ImageChops.multiply(original.getchannel('A'), mask))
        sprite = sprite.crop(sprite.getbbox())
        sprite.thumbnail((350, 350), Image.Resampling.LANCZOS)
        atlas.alpha_composite(sprite, (index % 3 * 400 + (400-sprite.width)//2, index//3 * 400 + (400-sprite.height)//2))
    atlas.save(root / 'dist/assets' / (name + '.png'), optimize=True)
    print(name, len(groups), 'sprites')
