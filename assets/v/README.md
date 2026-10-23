Vídeos do Lucas + Cacá (fundo verde, os dois no quadro): `abertura.mp4` e `estacao1.mp4` até `estacao5.mp4`. Roteiro em Caso Black - PRODUCAO/02 Gravar Lucas e Caca.

Ao adicionar um MP4, inclua o nome em `manifest.json`, por exemplo:
`{"estacoes":["estacao1.mp4","estacao2.mp4"],"corpos":["be"]}`.

O catálogo evita pedidos 404 para vídeos ainda não gravados. O quadro usa a legenda sempre e, na estação 1, o áudio existente quando o MP4 não está listado.

`corpos` lista as artes opcionais existentes em `assets/corpo` (sem extensão). Sem corpo, o balão e a foto usam a cabeça de `assets/cab`.
