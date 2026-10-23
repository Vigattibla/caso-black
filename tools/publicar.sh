#!/bin/sh
# Publica o commit atual (HEAD) em https://ofertas.villageresort.com.br/caso-black/ via ssh village-ofertas.
# Só arquivos versionados; sobrescreve por cima, não apaga nada no servidor.
set -e
cd "$(dirname "$0")/.."
git archive --format=tar HEAD | ssh -o BatchMode=yes village-ofertas 'tar -xf - -C public_html/caso-black && echo "publicado $(date +%H:%M)"'
