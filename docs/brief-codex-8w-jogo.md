# Brief Codex — jogo completo 8th Wall (Caso Black)

Repo: este. Trabalhe só em `ar8w/` (+ `tests/` se precisar). Não faça push. Não toque em `index.html` da raiz, `landing*`, `debug.log`.

## Fonte de verdade
- Falas e fluxo: `docs/historia-falas.md` (use os textos exatamente).
- Protótipos existentes: `ar8w/app.js` + `ancora.js` + `estacao1.js` (placa 1, quadro CSS3D ancorado no alvo); `ar8w/chave.html` + `ar8w/chave/*` (leitura da chave desenhada no verso, inventário, cadeado/fechadura em `chave/placa.js`).
- Mecânicas originais a portar: `quadro.js` (raiz) — `pegadas`, `comanda`, `camera`, `vitrine` (memória do Pipoca), `tempo` (linha do tempo). `mochila.js` (lente).

## Regras fixas
- Canvas com `XR8.FullWindowCanvas.pipelineModule()`; nunca setar width/height × devicePixelRatio na mão.
- Interação AR ancorada na placa da parede (quadro CSS3D sobre o alvo), nunca tela 2D cheia.
- Reaproveitar o balão/fala existente (`beFala` / `#balao` equivalente no ar8w) e o áudio por texto normalizado (`voz.js`); áudio ausente = só balão, sem erro.
- Mascote: só cabeça (`assets/be-cabeca.png`).
- Visual é do usuário: mantenha estilo atual, sem redesenhar.

## Entregar
1. `ar8w/index.html` vira o jogo único: abertura → detecta qual alvo está na frente (`placa-1..5`, `verso`) e monta a estação certa.
2. Estações 2–5 portadas como `estacao2.js`…`estacao5.js` no padrão de `estacao1.js` (DOM 600×800 ancorado).
   - Remover tira de suspeitos e "X fora"; resultado = prova + dente.
   - 1: ao concluir, ganha a **lente** (animação para a mochila) e dente 1 = cima.
   - 4: só libera a memória após usar a lente da mochila na placa (revela pegadas do Pipoca). Sem lente → fala "sem lente".
   - 5: exige chave na mochila; arrastar chave até o cadeado (coords em `chave/placa.js`, adaptar para placa-5) → linha do tempo → resultado.
3. Verso: leitura da chave (código CBBC) só depois dos 4 dentes; chave certa vai pro bolso. Após estação 5, lupa no verso = efeito digital dourada + falas finais do Bê + convite pra foto.
4. Mochila visível (lente, chave) com estado em `localStorage` (`cb8w_v1`): estações concluídas, dentes, itens, provas. Botão discreto de reset (`?reset=1`).
5. Alvos: `ar8w/alvos/placa-2..5.{png,json,_luminance.png}` como **placeholders** 1200×1600 PLANAR gerados por script Python (PIL) a partir do layout de `placa-1.png`: mesmo fundo amarelo listrado/logo, foto do local em `assets/locais/{1..4}.webp` (2=Restaurante,3=Kids,4=Cafeteria; 5=Recepção usa `assets/resort/` ou `assets/balcao/`), título "ESTAÇÃO N", nome do local, e para a 5 um cadeado desenhado. Cada placa precisa ser visualmente distinta (bons features). JSON no mesmo formato de `placa-1.json`. Script em `ar8w/tools/gerar_placas.py`. O usuário vai trocar a arte depois (personagens de corpo inteiro), então deixe área do personagem marcada.
6. Atualizar `voz.js` (ou mapa do ar8w) com as falas novas, chaves de arquivo `assets/a/v/v3-XX.m4a` em ordem do doc (áudio será gerado depois).
7. Modo demo sem câmera: `?demo=N` abre a estação N em tela para teste headless; `?demo=verso`.
8. Teste: `tests/jogo8w.cjs` (node, sem câmera) cobrindo fluxo completo via demo: 1→lente, 4 bloqueia sem lente, chave errada/certa, 5 bloqueia sem chave, final.

## Ao terminar
`git add` só dos arquivos que criou/alterou (nunca -A) e commit "8th Wall: jogo completo estações 1–5, lente, chave, final". Relate em 10 linhas: arquivos, como testar, o que ficou pendente.
