"""python ar8w/tools/gerar_placas.py — placeholders PLANAR 1200×1600 (Pillow).

Mantém faixas e logo do layout da placa 1. Arte final/figuras: substituir depois.
Não depende dos arquivos de landing, resort ou fontes que ainda não estão no Git.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import json

ROOT = Path(__file__).resolve().parents[2]
ALVOS = ROOT / 'ar8w' / 'alvos'
BASE = Image.open(ALVOS / 'placa-1.png').convert('RGB')
MODELO = json.loads((ALVOS / 'placa-1.json').read_text(encoding='utf-8'))


def fonte(tamanho):
    candidatos = [ROOT / 'assets/fonts/anton.woff', Path('C:/Windows/Fonts/impact.ttf'),
                  Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')]
    for caminho in candidatos:
        try:
            return ImageFont.truetype(str(caminho), tamanho)
        except OSError:
            pass
    return ImageFont.load_default(size=tamanho)


def texto_centro(d, texto, y, tamanho, cor='#111111'):
    f = fonte(tamanho)
    while d.textbbox((0, 0), texto, font=f)[2] > 1080 and tamanho > 18:
        tamanho -= 2
        f = fonte(tamanho)
    d.text((600, y), texto, font=f, fill=cor, anchor='mt', stroke_width=0)


for n, local in [(2, 'RESTAURANTE'), (3, 'ESPAÇO KIDS'), (4, 'CAFETERIA'), (5, 'RECEPÇÃO')]:
    im = BASE.copy()
    d = ImageDraw.Draw(im)
    # Preserva o logo/fundo superior e as duas faixas listradas; limpa a foto/personagens.
    d.rectangle((0, 400, 1199, 1509), fill='#fdc72f')
    foto = ROOT / f'assets/locais/{n}.webp'
    if n == 5:
        foto = ROOT / 'assets/resort/acomodacoes-800.webp'
        if not foto.exists():
            foto = ROOT / 'assets/balcao/cafe.webp'
    recorte = ImageOps.fit(Image.open(foto).convert('RGB'), (1032, 800), method=Image.Resampling.LANCZOS)
    if n == 5:
        recorte.save(ALVOS / 'recepcao.webp', quality=85)
    im.paste(recorte, (84, 430))
    d = ImageDraw.Draw(im)
    d.rectangle((80, 426, 1120, 1234), outline='#111111', width=8)
    # Cada local conserva a foto inteira; número/faixa também dão features distintos.
    d.rectangle((85, 440, 220, 592), fill='#111111')
    d.text((152, 446), str(n), font=fonte(110), fill='#fdc72f', anchor='mt')
    # Área marcada para a futura arte de personagem de corpo inteiro.
    d.rectangle((80, 1000, 390, 1370), fill='#fff1b7', outline='#111111', width=4)
    for y in range(1000, 1370, 30):
        d.line((80, y, 100, y), fill='#c8102e', width=6)
        d.line((370, y, 390, y), fill='#c8102e', width=6)
    d.text((235, 1130), 'ÁREA DO', font=fonte(32), fill='#111111', anchor='mt')
    d.text((235, 1180), 'PERSONAGEM', font=fonte(32), fill='#111111', anchor='mt')
    if n == 5:
        # Mesmas coordenadas de ar8w/chave/placa.js; centro da fechadura (896,869).
        d.arc((765, 610, 975, 840), 180, 360, fill='#111111', width=24)
        d.rectangle((690, 750, 1050, 963), fill='#fdc72f', outline='#111111', width=12)
        d.ellipse((872, 845, 920, 893), fill='#111111')
        d.polygon([(896, 865), (876, 925), (916, 925)], fill='#111111')
    texto_centro(d, local, 1260, 82)
    texto_centro(d, f'ESTAÇÃO {n}', 1380, 98)
    im.save(ALVOS / f'placa-{n}.png', optimize=True)
    # O runtime consome luminância RGB, como no alvo de referência.
    ImageOps.grayscale(im).convert('RGB').save(ALVOS / f'placa-{n}_luminance.png', optimize=True)
    alvo = json.loads(json.dumps(MODELO))
    alvo['name'] = f'placa-{n}'
    alvo['imagePath'] = f'./alvos/placa-{n}_luminance.png'
    alvo['metadata'] = {'placeholder': True, 'local': local, 'personagem': [80, 1000, 390, 1370]}
    alvo['resources'] = {k: f'placa-{n}_luminance.png' if k == 'luminanceImage' else f'placa-{n}.png' for k in alvo['resources']}
    (ALVOS / f'placa-{n}.json').write_text(json.dumps(alvo, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'placa-{n}: {local} · 1200×1600 PLANAR')
