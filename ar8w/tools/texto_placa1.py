"""python ar8w/tools/texto_placa1.py — iguala o "ESTAÇÃO 1" às placas 2–5 da arte original da placa 1.

Parte de tools/placa-base.png (arte original, foto intacta), redesenha o título em Anton
com o tamanho das outras placas entre a moldura e as listras e grava alvo, luminância e PDF A4 de impressão.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
ALVOS = ROOT / 'ar8w' / 'alvos'
ALTURA = 100  # mesma regra de gerar_placas.py (placas 2–5)

im = Image.open(Path(__file__).with_name('placa-base.png')).convert('RGB')
ImageDraw.Draw(im).rectangle((150, 1391, 1050, 1500), fill='#fdc72f')
# A cedilha antiga invade as listras: repõe com o trecho limpo duas listras à esquerda (período 90 px).
im.paste(im.crop((380, 1494, 480, 1560)), (560, 1494))
tinta = Image.new('L', (1600, 400))
ImageDraw.Draw(tinta).text((800, 200), 'ESTAÇÃO 1', font=ImageFont.truetype(str(ROOT / 'assets/fonts/anton.woff'), 220), fill=255, anchor='mm')
tinta = tinta.crop(tinta.getbbox())
escala = ALTURA / tinta.height
tinta = tinta.resize((round(tinta.width * escala), ALTURA), Image.Resampling.LANCZOS)
im.paste('#111111', (600 - tinta.width // 2, 1404), tinta)
im.save(ALVOS / 'placa-1.png', optimize=True)
ImageOps.grayscale(im).convert('RGB').save(ALVOS / 'placa-1_luminance.png', optimize=True)
# PDF A4 retrato em 300 dpi, arte centralizada com margem branca (igual à pista 4).
a4 = Image.new('RGB', (2480, 3508), '#ffffff')
a4.paste(im.resize((2300, 3067), Image.Resampling.LANCZOS), (90, 220))
a4.save(ROOT / 'assets/marcadores/placa-1-A4.pdf', resolution=300)
print('placa-1: ESTAÇÃO 1 no padrão + PDF A4')
