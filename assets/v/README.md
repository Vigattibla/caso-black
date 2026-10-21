Vídeos do Investigador Caca: `estacao1.mp4` até `estacao5.mp4`.

Ao adicionar um MP4, inclua o nome em `manifest.json`, por exemplo:
`{"estacoes":["estacao1.mp4","estacao2.mp4"],"corpos":["be"]}`.

O catálogo evita pedidos 404 para vídeos ainda não gravados. O quadro usa a legenda sempre e, na estação 1, o áudio existente quando o MP4 não está listado.

`corpos` lista as artes opcionais existentes em `assets/corpo` (sem extensão). Sem corpo, o balão e a foto usam a cabeça de `assets/cab`.
