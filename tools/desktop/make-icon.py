"""
Gera o ícone do app desktop (apps/desktop/assets/icon.ico e icon.png) a partir
do sprite do trevo de quatro folhas. Sprite em pixel art: amplia por fator
inteiro sem suavização para não borrar.

    python tools/desktop/make-icon.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SPRITE = ROOT / 'apps/frontend/public/sprites/misc/four-leaf-clover.gif'
OUT = ROOT / 'apps/desktop/assets'
SIZES = [16, 24, 32, 48, 64, 128, 256]

frame = Image.open(SPRITE)
frame.seek(0)
art = frame.convert('RGBA')
art = art.crop(art.getbbox())


def render(size: int) -> Image.Image:
    side = max(art.size)
    scale = (size * 0.94) / side
    if scale >= 1:
        scale = int(scale)
        resized = art.resize((art.width * scale, art.height * scale), Image.NEAREST)
    else:
        # Tamanhos menores que o sprite: reduz a partir da versão grande
        big = art.resize((art.width * 8, art.height * 8), Image.NEAREST)
        ratio = (size * 0.94) / max(big.size)
        resized = big.resize((max(1, round(big.width * ratio)), max(1, round(big.height * ratio))), Image.LANCZOS)
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    canvas.paste(resized, ((size - resized.width) // 2, (size - resized.height) // 2), resized)
    return canvas


OUT.mkdir(parents=True, exist_ok=True)
images = [render(s) for s in SIZES]
images[-1].save(OUT / 'icon.png')
images[-1].save(OUT / 'icon.ico', sizes=[(s, s) for s in SIZES], append_images=images[:-1])
print(f'Ícone gerado em {OUT}')
