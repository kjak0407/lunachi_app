"""Separate generated atlas objects and repack them with transparent margins."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / '.tools/playthings-source.png'
target = root / 'dist/assets/playthings.png'
if not source.exists():
    source.parent.mkdir(exist_ok=True)
    source.write_bytes(target.read_bytes())
original = Image.open(source).convert('RGBA')
boxes = [
    (0, 70, 331, 296), (345, 0, 590, 329), (620, 45, 940, 306), (943, 18, 1254, 310),
    (0, 334, 329, 621), (331, 345, 635, 628), (655, 328, 927, 636), (954, 315, 1230, 637),
    (0, 643, 325, 929), (330, 660, 645, 927), (659, 637, 930, 936), (949, 638, 1243, 930),
    (0, 930, 334, 1238), (338, 940, 625, 1234), (637, 946, 957, 1231), (981, 935, 1224, 1238),
]
atlas = Image.new('RGBA', (1280, 1280))
for index, box in enumerate(boxes):
    sprite = original.crop(box)
    # Discard detached generation speckles while retaining each main object.
    width, height = sprite.size
    alpha = sprite.getchannel('A')
    pixels = alpha.load()
    unseen = {(x, y) for y in range(height) for x in range(width) if pixels[x, y] > 20}
    keep = set()
    while unseen:
        seed = unseen.pop()
        component, pending = {seed}, [seed]
        while pending:
            x, y = pending.pop()
            for neighbor in ((x-1,y), (x+1,y), (x,y-1), (x,y+1)):
                if neighbor in unseen:
                    unseen.remove(neighbor); component.add(neighbor); pending.append(neighbor)
        if len(component) > 300:
            keep.update(component)
    # Keep a narrow antialiased fringe around substantial components.
    mask = Image.new('L', sprite.size)
    for x, y in keep:
        mask.putpixel((x, y), 255)
    from PIL import ImageFilter, ImageChops
    mask = mask.filter(ImageFilter.MaxFilter(5))
    sprite.putalpha(ImageChops.multiply(alpha, mask))
    sprite = sprite.crop(sprite.getbbox())
    sprite.thumbnail((292, 292), Image.Resampling.LANCZOS)
    atlas.alpha_composite(sprite, (index % 4 * 320 + (320-sprite.width)//2, index//4 * 320 + (320-sprite.height)//2))
atlas.save(target, optimize=True)
print('Prepared 16 sprites in a 1280 x 1280 atlas.')
