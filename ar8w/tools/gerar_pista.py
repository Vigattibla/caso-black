"""python ar8w/tools/gerar_pista.py — folha A4 escondida da estação 4 (alvo PLANAR 1200×1600 + PDF A4).

Fim do rastro de patinhas do Pipoca: o jogo da memória abre em AR sobre esta folha.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import json, math, random, time

ROOT = Path(__file__).resolve().parents[2]
ALVOS = ROOT / 'ar8w' / 'alvos'
W, H = 1200, 1600
# Reaproveita os helpers das placas sem rodar o laço que regrava placa-2…5.
_fonte = Path(__file__).with_name('gerar_placas.py')
_ns = {'__file__': str(_fonte)}
exec(_fonte.read_text(encoding='utf-8').split('\nfor n, local, foto, figuras in PLACAS:')[0], _ns)
fonte, win_fonte, AMARELO, BASE, LOGO, colar, post_it = (_ns[k] for k in ('fonte', 'win_fonte', 'AMARELO', 'BASE', 'LOGO', 'colar', 'post_it'))


def pata(d, cx, cy, s, ang, cor='#203b80'):
    """Patinha: almofada + 4 dedos, girada no sentido da caminhada."""
    c, si = math.cos(ang), math.sin(ang)
    rot = lambda x, y: (cx + x * c - y * si, cy + x * si + y * c)
    def oval(x, y, rx, ry):
        pts = [rot(x + rx * math.cos(t / 12 * math.pi), y + ry * math.sin(t / 12 * math.pi)) for t in range(24)]
        d.polygon(pts, fill=cor)
    oval(0, s * .25, s * .42, s * .34)
    for x, y in ((-.42, -.2), (-.15, -.48), (.15, -.48), (.42, -.2)):
        oval(x * s, y * s, s * .15, s * .2)


def main():
    rnd = random.Random(4)
    im = Image.new('RGB', (W, H), '#fffdf6')
    d = ImageDraw.Draw(im)
    # Rastro chegando pela folha (de baixo para o centro) e patinhas soltas: textura para o rastreamento.
    for i in range(14):
        t = i / 13
        x, y = 140 + 820 * t + 60 * math.sin(t * 7), 1540 - 900 * t
        pata(d, x + (26 if i % 2 else -26), y, 46, -math.pi / 4 + .3 * math.sin(t * 7), '#d9cfb8')
    for _ in range(26):
        pata(d, rnd.randint(40, W - 40), rnd.randint(560, H - 40), rnd.randint(18, 34), rnd.uniform(0, 6.3), '#ece4d0')
    im.paste(BASE, (0, 0), LOGO)
    d = ImageDraw.Draw(im)
    d.rectangle((60, 430, W - 60, 560), fill='#111111')
    d.text((W // 2, 495), 'PISTA ESCONDIDA', font=fonte(96), fill=AMARELO, anchor='mm')
    d.text((W // 2, 610), 'ESTAÇÃO 4 · O FARO DO PIPOCA', font=win_fonte('courbd.ttf', 40), fill='#203b80', anchor='mm')
    pip = Image.open(ROOT / 'assets/personagens/pipoca-detetive.png').convert('RGBA')
    pip.thumbnail((620, 760), Image.Resampling.LANCZOS)
    im.paste(pip, (W - pip.width - 30, H - pip.height - 20), pip)
    for i, nome in enumerate(('chapeu', 'cafe', 'cookie')):
        obj = Image.open(ROOT / f'assets/balcao/{nome}.webp').convert('RGBA')
        obj.thumbnail((210, 210), Image.Resampling.LANCZOS)
        cartao = Image.new('RGBA', (250, 250), '#ffffff')
        cartao.paste(obj, ((250 - obj.width) // 2, (250 - obj.height) // 2), obj)
        ImageDraw.Draw(cartao).rectangle((0, 0, 249, 249), outline='#583a23', width=6)
        colar(im, cartao, (70 + (i % 2) * 230, 720 + i * 240), (-8, 6, -3)[i])
    post_it(im, 'AU AU!\nACHOU!', (560, 700), -6)
    im.save(ALVOS / 'pista-4.png', optimize=True)
    im.convert('L').convert('RGB').save(ALVOS / 'pista-4_luminance.png', optimize=True)
    modelo = json.loads((ALVOS / 'placa-4.json').read_text(encoding='utf-8'))
    agora = int(time.time() * 1000)
    modelo.update(name='pista-4', imagePath='./alvos/pista-4_luminance.png', created=agora, updated=agora,
                  metadata={'placeholder': False, 'local': 'PISTA ESCONDIDA', 'personagens': {}},
                  resources={'originalImage': 'pista-4.png', 'croppedImage': 'pista-4.png', 'thumbnailImage': 'pista-4.png', 'luminanceImage': 'pista-4_luminance.png'})
    (ALVOS / 'pista-4.json').write_text(json.dumps(modelo, ensure_ascii=False, indent=2), encoding='utf-8')
    # PDF A4 retrato em 300 dpi, arte centralizada com margem branca.
    a4 = Image.new('RGB', (2480, 3508), '#ffffff')
    arte = im.resize((2300, 3067), Image.Resampling.LANCZOS)
    a4.paste(arte, ((2480 - 2300) // 2, (3508 - 3067) // 2))
    a4.save(ROOT / 'assets/marcadores/pista-4-A4.pdf', resolution=300)


if __name__ == '__main__':
    main()
