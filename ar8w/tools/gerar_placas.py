"""python ar8w/tools/gerar_placas.py — placas 2–5 PLANAR 1200×1600 (Pillow).

Segue o layout da placa 1: foto grande atrás do logo, fita "NÃO ULTRAPASSE",
personagens de corpo inteiro (assets/personagens) saindo pelos cantos e "ESTAÇÃO N".
O cadeado da 5 não é impresso: o AR desenha o dele (ar8w/estacao5.js).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
from scipy import ndimage
import numpy as np
import json

ROOT = Path(__file__).resolve().parents[2]
ALVOS = ROOT / 'ar8w' / 'alvos'
BASE = Image.open(ALVOS / 'placa-1.png').convert('RGB')
MODELO = json.loads((ALVOS / 'placa-1.json').read_text(encoding='utf-8'))
AMARELO = '#fdc72f'
MOLDURA = (172, 322, 1030, 1390)  # mesma moldura preta da placa 1
FOTO = (180, 330, 1022, 1382)


def fonte(tamanho):
    candidatos = [ROOT / 'assets/fonts/anton.woff', Path('C:/Windows/Fonts/impact.ttf'),
                  Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')]
    for caminho in candidatos:
        try:
            return ImageFont.truetype(str(caminho), tamanho)
        except OSError:
            pass
    return ImageFont.load_default(size=tamanho)


def mascara_logo():
    """Logo da placa 1 (preto + letras brancas fechadas), sem a foto da piscina."""
    a = np.asarray(BASE.convert('L'), dtype=np.int16)
    escuro = a < 45
    escuro[:100] = False
    escuro[400:] = False
    escuro[:, :230] = False
    escuro[:, 970:] = False
    rotulos, _ = ndimage.label(escuro)
    # Componentes do selo "CASO BLACK", do rótulo "ARQUIVO SECRETO" e do chapéu.
    ids = {rotulos[260, 600], rotulos[340, 600], rotulos[130, 850]} - {0}
    logo = ndimage.binary_fill_holes(np.isin(rotulos, list(ids)))
    logo = ndimage.binary_dilation(logo, iterations=1)
    return Image.fromarray((logo * 255).astype(np.uint8))


LOGO = mascara_logo()


def personagem(nome, caixa):
    arquivo = ROOT / (nome if '/' in nome else f'assets/personagens/{nome}-detetive.png')
    fig = Image.open(arquivo).convert('RGBA')
    x0, y0, x1, y1 = caixa
    fig.thumbnail((x1 - x0, y1 - y0), Image.Resampling.LANCZOS)
    return fig, (x0 + (x1 - x0 - fig.width) // 2, y1 - fig.height)


def fita(im, texto, centro, angulo, largura=1500):
    faixa = Image.new('RGBA', (largura, 96), '#f5d90a')
    d = ImageDraw.Draw(faixa)
    d.rectangle((0, 0, largura - 1, 95), outline='#111111', width=5)
    f = fonte(58)
    passo = d.textbbox((0, 0), texto + '   ', font=f)[2]
    for x in range(-40, largura, passo):
        d.text((x, 48), texto, font=f, fill='#111111', anchor='lm')
    faixa = faixa.rotate(angulo, expand=True, resample=Image.Resampling.BICUBIC)
    # Recorta a fita na moldura da foto, como na placa 1.
    camada = Image.new('RGBA', im.size, (0, 0, 0, 0))
    camada.paste(faixa, (centro[0] - faixa.width // 2, centro[1] - faixa.height // 2), faixa)
    camada = camada.crop(FOTO)
    im.paste(camada, FOTO[:2], camada)


ESQ = (10, 880, 280, 1520)
DIR = (880, 1000, 1190, 1520)
# Sem personagens: a placa fica só com foto, logo e elemento da estação.
PLACAS = [
    (2, 'RESTAURANTE', 'assets/locais/2.webp', []),
    (3, 'ESPAÇO KIDS', 'assets/kids-antes.webp', []),
    (4, 'CAFETERIA', 'assets/locais/4.webp', []),
    (5, 'RECEPÇÃO', 'assets/locais/5.webp', []),
]

def win_fonte(arquivo, tamanho):
    try:
        return ImageFont.truetype(f'C:/Windows/Fonts/{arquivo}', tamanho)
    except OSError:
        return fonte(tamanho)


def cena_padrao(im, n, local, recorte):
    d = ImageDraw.Draw(im)
    d.rectangle(MOLDURA, fill='#111111')
    im.paste(recorte, FOTO[:2])
    im.paste(BASE, (0, 0), LOGO)
    fita(im, 'NÃO ULTRAPASSE', (600, 1290), -10 if n % 2 else 10)
    d = ImageDraw.Draw(im)
    f = fonte(64)
    w = d.textbbox((0, 0), local, font=f)[2]
    d.rectangle((FOTO[0], 410, FOTO[0] + w + 48, 500), fill='#111111')
    d.text((FOTO[0] + 24, 455), local, font=f, fill=AMARELO, anchor='lm')


def cena_kids(im, n, local, recorte):
    """Espaço Kids: a foto (a mesma cena "antes" do jogo) vira o frame da câmera das 00h30."""
    d = ImageDraw.Draw(im)
    # Gabinete do monitor, mais grosso que a moldura comum, com LED.
    d.rounded_rectangle((146, 300, 1056, 1394), 30, fill='#1d1d1f', outline='#000000', width=6)
    d.ellipse((1030, 340, 1044, 354), fill='#3dff6e')
    # Imagem de CFTV: verde monocromático, contraste alto, ruído e vinheta.
    w, h = recorte.size
    tela = ImageOps.autocontrast(ImageOps.grayscale(recorte), cutoff=2)
    tela = ImageOps.colorize(tela, black='#02130a', mid='#2f8a52', white='#d4ffe0')
    a = np.asarray(tela).astype(np.float32)
    rng = np.random.default_rng(3)
    a += rng.normal(0, 9, a.shape[:2])[..., None]
    a[::4] *= 0.62
    yy, xx = np.mgrid[0:h, 0:w]
    a *= (1 - 0.55 * (((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / 2)[..., None]
    tela = Image.fromarray(a.clip(0, 255).astype(np.uint8))
    im.paste(tela, FOTO[:2])
    im.paste(BASE, (0, 0), LOGO)
    d = ImageDraw.Draw(im)
    # Cantoneiras do visor.
    x0, y0, x1, y1 = FOTO[0] + 26, 420, FOTO[2] - 26, FOTO[3] - 26
    for cx, cy, sx, sy in ((x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)):
        d.line((cx, cy, cx + 70 * sx, cy), fill='#e8ffe8', width=7)
        d.line((cx, cy, cx, cy + 70 * sy), fill='#e8ffe8', width=7)
    osd = win_fonte('consolab.ttf', 46)

    def texto(xy, t, cor='#e8ffe8', anchor='la'):
        d.text((xy[0] + 3, xy[1] + 3), t, font=osd, fill='#000000', anchor=anchor)
        d.text(xy, t, font=osd, fill=cor, anchor=anchor)

    texto((x0 + 24, y0 + 22), 'CAM 03')
    texto((x0 + 24, y0 + 76), local)
    d.ellipse((x1 - 190, y0 + 30, x1 - 160, y0 + 60), fill='#ff2a2a')
    texto((x1 - 24, y0 + 22), 'REC', anchor='ra')
    texto((x1 - 24, y0 + 76), '00:30:17', anchor='ra')
    # Post-it colado no monitor: o desafio da estação.
    post_it(im, 'ACHE 5\nDIFERENÇAS!', (780, 1118), 7)


def colar(im, peca, pos, angulo=0, sombra=80):
    """Cola uma peça de papel girada, com sombra curta."""
    peca = peca.rotate(angulo, expand=True, resample=Image.Resampling.BICUBIC)
    s = Image.new('RGBA', peca.size, (0, 0, 0, 0))
    s.putalpha(peca.getchannel('A').point(lambda v: v * sombra // 255))
    im.paste(s, (pos[0] + 10, pos[1] + 12), s)
    im.paste(peca, pos, peca)


def cena_restaurante(im, n, local, recorte):
    """Restaurante: comanda sem nome das 00h15 presa sobre a foto; o pedido está rasurado."""
    cena_padrao(im, n, local, recorte)
    w, h = 340, 500
    c = Image.new('RGBA', (w, h), '#fbf8ef')
    d = ImageDraw.Draw(c)
    mono, mono_g = win_fonte('courbd.ttf', 30), win_fonte('courbd.ttf', 44)
    mao = win_fonte('segoeprb.ttf', 40)
    # Mancha de copo (cor neutra, sem entregar a bebida).
    d.ellipse((170, 300, 320, 450), outline=(160, 120, 80, 70), width=9)
    d.text((w // 2, 34), 'COMANDA', font=mono_g, fill='#111111', anchor='mt')
    d.text((w // 2, 86), 'Nº 0015', font=mono, fill='#c4161c', anchor='mt')
    tracejado = lambda y: [d.line((x, y, x + 12, y), fill='#555555', width=3) for x in range(20, w - 20, 22)]
    tracejado(132)
    for i, linha in enumerate(('MESA: —', 'NOME: ????', 'HORA: 00:15')):
        d.text((26, 152 + i * 46), linha, font=mono, fill='#111111')
    tracejado(298)
    # Linhas do pedido apagadas com rabisco.
    rng = np.random.default_rng(7)
    for i in range(3):
        y = 330 + i * 42
        d.text((26, y), 'x ' + '#' * rng.integers(6, 11), font=mono, fill='#9a9a9a')
        pts = [(22 + k * 18, y + 16 + (8 if k % 2 else -8)) for k in range(16)]
        d.line(pts, fill='#1f3f8f', width=4)
    d.text((w // 2, 470), 'QUEM PEDIU?', font=mao, fill='#c4161c', anchor='mm')
    d.rectangle((0, 0, w - 1, h - 1), outline='#d6d0bf', width=2)
    colar(im, c, (650, 520), -6)
    d = ImageDraw.Draw(im)
    # Alfinete vermelho.
    d.ellipse((800, 515, 846, 561), fill='#c4161c', outline='#111111', width=4)
    d.ellipse((812, 524, 824, 536), fill='#ff8a8a')


def post_it(im, texto, pos, angulo):
    """Post-it escrito à mão, no mesmo estilo do monitor da placa 3."""
    nota = Image.new('RGBA', (300, 230), '#fff38a')
    dn = ImageDraw.Draw(nota)
    dn.rectangle((0, 0, 299, 34), fill='#f2e06a')
    # Fonte reduz até o texto caber com margem igual dos dois lados.
    for tam in range(46, 20, -2):
        mao = win_fonte('segoeprb.ttf', tam)
        x0, y0, x1, y1 = dn.multiline_textbbox((150, 128), texto, font=mao, anchor='mm', align='center', spacing=2)
        if x1 - x0 <= 250 and y1 - y0 <= 160:
            break
    dn.multiline_text((150, 128), texto, font=mao, fill='#c4161c', anchor='mm', align='center', spacing=2)
    colar(im, nota, pos, angulo, sombra=90)


def cena_cafeteria(im, n, local, recorte):
    """Cafeteria: dica da lente num post-it; as pegadas só aparecem no AR."""
    cena_padrao(im, n, local, recorte)
    post_it(im, 'USE A\nLENTE!', (640, 560), -6)


def cena_recepcao(im, n, local, recorte):
    """Recepção: carimbo de última pista; a área do cadeado fica livre para o AR."""
    cena_padrao(im, n, local, recorte)
    carimbo = Image.new('RGBA', (520, 150), (0, 0, 0, 0))
    dc = ImageDraw.Draw(carimbo)
    dc.rounded_rectangle((6, 6, 513, 143), 18, outline='#c4161c', width=10)
    dc.text((260, 76), 'ÚLTIMA PISTA', font=fonte(78), fill='#c4161c', anchor='mm')
    carimbo = carimbo.rotate(-8, expand=True, resample=Image.Resampling.BICUBIC)
    # Tinta gasta: falhas aleatórias como carimbo de verdade.
    a = np.asarray(carimbo.getchannel('A')).astype(np.float32)
    a *= np.random.default_rng(5).uniform(0.55, 1, a.shape)
    carimbo.putalpha(Image.fromarray(a.astype(np.uint8)))
    im.paste(carimbo, (200, 640), carimbo)
CADEADO = (690, 610, 1050, 963)  # mesma área de ar8w/chave/placa.js
CENAS = {2: cena_restaurante, 3: cena_kids, 4: cena_cafeteria, 5: cena_recepcao}

for n, local, foto, figuras in PLACAS:
    im = BASE.copy()
    d = ImageDraw.Draw(im)
    # Mantém só faixas listradas e logo; limpa foto, personagens e texto da placa 1.
    d.rectangle((0, 95, 1199, 1509), fill=AMARELO)
    caminho = ROOT / foto
    if not caminho.exists():
        caminho = ROOT / 'assets/balcao/cafe.webp'
    # Na recepção, sobe o enquadramento para cortar o vulto borrado do rodapé da foto.
    recorte = ImageOps.fit(Image.open(caminho).convert('RGB'), (FOTO[2] - FOTO[0], FOTO[3] - FOTO[1]),
                           method=Image.Resampling.LANCZOS, centering=(0.5, 0.2 if n == 5 else 0.5))
    if n == 5:
        recorte.save(ALVOS / 'recepcao.webp', quality=85)
    CENAS.get(n, cena_padrao)(im, n, local, recorte)
    for nome, caixa in figuras:
        fig, pos = personagem(nome, caixa)
        im.paste(fig, pos, fig)
    # Título pela tinta real (til e cedilha inclusos), entre a moldura e as listras.
    tinta = Image.new('L', (1600, 400))
    ImageDraw.Draw(tinta).text((800, 200), f'ESTAÇÃO {n}', font=fonte(220), fill=255, anchor='mm')
    tinta = tinta.crop(tinta.getbbox())
    escala = min(100 / tinta.height, 920 / tinta.width)
    tinta = tinta.resize((round(tinta.width * escala), round(tinta.height * escala)), Image.Resampling.LANCZOS)
    im.paste('#111111', (600 - tinta.width // 2, 1404), tinta)
    im.save(ALVOS / f'placa-{n}.png', optimize=True)
    # O runtime consome luminância RGB, como no alvo de referência.
    ImageOps.grayscale(im).convert('RGB').save(ALVOS / f'placa-{n}_luminance.png', optimize=True)
    alvo = json.loads(json.dumps(MODELO))
    alvo['name'] = f'placa-{n}'
    alvo['imagePath'] = f'./alvos/placa-{n}_luminance.png'
    alvo['metadata'] = {'placeholder': False, 'local': local,
                        'personagens': {Path(nome).stem.replace('-detetive', ''): list(caixa) for nome, caixa in figuras}}
    alvo['resources'] = {k: f'placa-{n}_luminance.png' if k == 'luminanceImage' else f'placa-{n}.png' for k in alvo['resources']}
    (ALVOS / f'placa-{n}.json').write_text(json.dumps(alvo, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'placa-{n}: {local}')
