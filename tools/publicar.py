"""Publica o commit atual (HEAD) em https://ofertas.villageresort.com.br/caso-black/ via `ssh village-ofertas`.
O Cloudflare guarda .js/.css por 4 h e o OpenLiteSpeed ignora cabeçalhos no .htaccess, então cada link relativo
de JS/CSS (import, src, href, Worker, importScripts) ganha ?v=<hash do commit>: publicação nova = URL nova.
Só arquivos versionados; sobrescreve por cima, não apaga nada no servidor. Uso: python tools/publicar.py"""
import io, re, subprocess, sys, tarfile
from pathlib import Path

raiz = Path(__file__).resolve().parent.parent
git = lambda *a: subprocess.run(['git', *a], cwd=raiz, capture_output=True, check=True).stdout
versao = git('rev-parse', '--short', 'HEAD').decode().strip()
LINK = re.compile(r"""((?:\bfrom|\bimport\(|\bsrc=|\bhref=|new Worker\(|importScripts\()\s*)(['"])(?![a-z]+:|//)([^'"?#]+\.(?:m?js|css))(?:\?[^'"#]*)?\2""")
carimbar = lambda t: LINK.sub(lambda m: f'{m[1]}{m[2]}{m[3]}?v={versao}{m[2]}', t)

entrada = tarfile.open(fileobj=io.BytesIO(git('archive', '--format=tar', 'HEAD')))
saida_buf = io.BytesIO(); saida = tarfile.open(fileobj=saida_buf, mode='w')
mudados = 0
for info in entrada:
    dados = entrada.extractfile(info).read() if info.isfile() else None
    if dados is not None and info.name.endswith(('.js', '.mjs', '.html')) and '/vendor/' not in f'/{info.name}':
        novo = carimbar(dados.decode('utf-8')).encode('utf-8')
        if novo != dados: mudados += 1; dados = novo; info.size = len(dados)
    saida.addfile(info, io.BytesIO(dados) if dados is not None else None)
saida.close()
r = subprocess.run(['ssh', '-o', 'BatchMode=yes', 'village-ofertas', 'tar -xf - -C public_html/caso-black'], input=saida_buf.getvalue())
if r.returncode: sys.exit(r.returncode)
print(f'publicado {versao} ({mudados} arquivos com links carimbados)')
