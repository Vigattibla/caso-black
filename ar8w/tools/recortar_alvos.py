"""Recorta cada alvo só na parte que é exclusiva dele (a foto), sem logo, listras, fita e rodapé em comum.
As placas 2–5 e a pista dividem esses elementos e o 8th Wall confundia uma com a outra.
Rodar depois de gerar_placas.py / gerar_pista.py (eles regravam o JSON sem o recorte).
O app compensa o recorte com metadata.recorte (posição e largura da folha inteira)."""
import json
from pathlib import Path
from PIL import Image

ALVOS = Path(__file__).resolve().parents[1] / 'alvos'
# x, y, largura, altura na imagem inteira (1200×1600); sempre 3:4.
RECORTES = {
    'placa-1': (338, 360, 525, 700),
    'placa-2': (300, 380, 600, 800),
    'placa-3': (300, 380, 600, 800),
    'placa-4': (300, 380, 600, 800),
    'placa-5': (300, 380, 600, 800),
    'pista-4': (240, 640, 720, 960),
}

for nome, (x, y, w, h) in RECORTES.items():
    assert w * 4 == h * 3, nome
    arq = ALVOS / f'{nome}.json'
    alvo = json.loads(arq.read_text(encoding='utf-8'))
    inteira = Image.open(ALVOS / f'{nome}_luminance.png').convert('L')
    W, H = inteira.size
    inteira.crop((x, y, x + w, y + h)).save(ALVOS / f'{nome}_recorte.png', optimize=True)
    alvo['properties'] = {'left': 0, 'top': 0, 'width': w, 'height': h, 'isRotated': False, 'originalWidth': w, 'originalHeight': h}
    alvo['metadata'] = {**(alvo.get('metadata') or {}), 'recorte': {'x': x, 'y': y, 'w': w, 'h': h, 'W': W, 'H': H}}
    arq.write_text(json.dumps(alvo, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(nome, (x, y, w, h))
