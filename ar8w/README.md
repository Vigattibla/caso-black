# Caso Black · jogo 8th Wall

Entrada única: `ar8w/index.html`. As páginas `chave.html`, `placa-teste.html` e
`verso-teste.html` continuam como protótipos isolados.

## Testar

```sh
node tests/jogo8w.cjs
node tests/ar8w.cjs
```

Node 22+ e Chrome/Chromium headless. `AR_CHROME` permite indicar outro executável.
O teste inicia o servidor local e fecha os processos; as capturas ficam no diretório
temporário `cb-jogo8w-shots`. Não precisa instalar pacotes npm.

Para abrir manualmente, sirva a raiz do repositório (`python -m http.server 8000`).
Demo: `http://localhost:8000/ar8w/?demo=1` (também `2`, `3`, `4`, `5`, `verso`).
A demo não inicia XR/câmera e usa o mesmo estado e os mesmos painéis do AR.
`?demo=4&reset=1` limpa o progresso ao abrir; retire `reset=1` antes de recarregar
para conservar o novo progresso. Esse parâmetro também exibe o botão Reset.

Fluxo: 1 → lente; 2 e 3 → dentes; 4 → arrastar a lente sobre a placa, ler as falas,
achar seis pares; verso → desenhar CBBC; 5 → arrastar a chave até o cadeado e
ordenar os horários; verso → digital dourada, falas finais e foto para o álbum.
Na demo do verso, os quatro botões alternam os dentes; “Ler desenho” passa a
imagem pelo mesmo leitor de pixels usado no vídeo AR, com três leituras estáveis.
Sem os quatro dentes o leitor não libera a chave.

## Arquitetura e dados

- `app.js`: seis alvos, troca de estação, âncora SLAM e render CSS3D.
- `estacao1.js`…`estacao5.js`, `painel.js`, `verso.js`: DOM local 600×800.
- `mochila.js`, `estado.js`: lente, chave desenhada, conclusões, dentes, provas,
  final e até cinco fotos locais em `cb8w_v1`; sem envio externo.
- `fala.js`, `voz.js`, `historia.js`, `vozes.json`: um balão reutilizado; textos
  literais de `docs/historia-falas.md`, áudio opcional por texto normalizado.

Regenerar textos/mapa (48 entradas `assets/a/v/v3-01.m4a`…`v3-48.m4a`, na ordem
dos textos entre crases do documento, inclusive provas e rótulos de foto):

```sh
node ar8w/tools/sincronizar_falas.cjs
```

Execute também após gerar os áudios: `vozes-disponiveis.json` lista só os arquivos
que existem, evitando requisições 404 quando há apenas texto disponível.

Regenerar arte provisória e luminância dos alvos 2–5 (Python + Pillow):

```sh
python ar8w/tools/gerar_placas.py
```

Os JSONs seguem o formato PLANAR de `placa-1.json`, 1200×1600. As faixas e o logo
vêm da placa 1; fotos, números e nomes diferenciam os alvos. A área do personagem
está marcada. O cadeado da placa 5 usa as coordenadas de `chave/placa.js`; a
miniatura local da recepção é gerada junto. O verso continua `verso-teste.json`
(nome de alvo `verso`); mantenha o layout de `chave/layout.js` ao trocar essa arte.

## Pendências de produção

- Substituir as quatro placas provisórias pela arte final do usuário e regenerar
  imagem/luminância/JSON mantendo nome e dimensões.
- Gerar os áudios v3. Arquivo ausente deixa o texto no balão e não bloqueia o jogo.
- Conferir tracking, distâncias, reflexos, desenho da chave e arrastos no Android
  e no iPhone, com as placas impressas. O headless valida lógica e configuração
  do SDK, sem medir a câmera física. AR exige HTTPS e permissão de câmera.
