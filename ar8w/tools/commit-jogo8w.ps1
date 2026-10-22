# Executar fora do sandbox do Codex: .git está somente leitura nesta sessão.
# Lista fechada; commit --only preserva qualquer outro arquivo já staged.
$ErrorActionPreference = 'Stop'
$repoJogo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$arquivosJogo = @(
    'ar8w/alvos/placa-2_luminance.png',
    'ar8w/alvos/placa-2.json',
    'ar8w/alvos/placa-2.png',
    'ar8w/alvos/placa-3_luminance.png',
    'ar8w/alvos/placa-3.json',
    'ar8w/alvos/placa-3.png',
    'ar8w/alvos/placa-4_luminance.png',
    'ar8w/alvos/placa-4.json',
    'ar8w/alvos/placa-4.png',
    'ar8w/alvos/placa-5_luminance.png',
    'ar8w/alvos/placa-5.json',
    'ar8w/alvos/placa-5.png',
    'ar8w/alvos/recepcao.webp',
    'ar8w/app.js',
    'ar8w/estacao1.js',
    'ar8w/estacao2.js',
    'ar8w/estacao3.js',
    'ar8w/estacao4.js',
    'ar8w/estacao5.js',
    'ar8w/estado.js',
    'ar8w/fala.js',
    'ar8w/historia.js',
    'ar8w/index.html',
    'ar8w/jogo.css',
    'ar8w/mochila.js',
    'ar8w/painel.js',
    'ar8w/README.md',
    'ar8w/tools/commit-jogo8w.ps1',
    'ar8w/tools/gerar_placas.py',
    'ar8w/tools/sincronizar_falas.cjs',
    'ar8w/verso.js',
    'ar8w/voz.js',
    'ar8w/vozes-disponiveis.json',
    'ar8w/vozes.json',
    'tests/ar8w.cjs',
    'tests/jogo8w.cjs'
)
& git -C $repoJogo add -- $arquivosJogo
if ($LASTEXITCODE -ne 0) { throw 'git add falhou; nenhum commit executado.' }
& git -C $repoJogo diff --cached --check -- $arquivosJogo
if ($LASTEXITCODE -ne 0) { throw 'Diff inválido; nenhum commit executado.' }
& git -C $repoJogo commit --only -m '8th Wall: jogo completo estações 1–5, lente, chave, final' -- $arquivosJogo | Select-Object -Last 6
if ($LASTEXITCODE -ne 0) { throw 'git commit falhou.' }
& git -C $repoJogo log -1 --oneline
