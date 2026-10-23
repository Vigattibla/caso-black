# Caso Black · índice do site

Ler isto antes de mexer; não varrer o repositório inteiro.
**Regra:** toda alteração atualiza este índice no mesmo commit (linha em "Mudanças" + mapa, se o arquivo mudou de papel). Uma linha de resumo também vai em `D:/Obsidian/Github/10 Village/Campanhas/Caso Black 2026.md`.

## Onde está
- Repo: `D:/Estudio/entregas/Turma do Be/Outros/caso-black-site` (sem push; publicação direta na VPS ofertas).
- Público: https://ofertas.villageresort.com.br/caso-black/ — a publicação troca os `?v=` dos imports pelo hash do commit (diferença esperada ao comparar).
- Dados privados: `~/caso-black-private` na VPS (API PHP/SQLite). Nunca no Git/vault.
- Relatórios de QA: `C:/Users/Vigatti/Documents/Designe Village Resort/qa/caso-black-*/RESULTADO.md`.

## Mapa
| Área | Arquivos |
|---|---|
| Caderno/ficha (landing do jogo) | `index.html`, `caso.js/.css`, `integracao.js`, `dados.js`, `quadro.js`, `prova.js` |
| Envelopes (Bronze/Prata/Ouro/Nióbio) | `envelopes.js` — valores comerciais são placeholder |
| Jogo AR (8th Wall/XR8) | `ar8w/index.html`, `ar8w/app.js`, `ancora.js`, `estado.js` (rodada) |
| Estações 1–5 | `ar8w/estacao1..5.js`, `vitrine.js` (balcão, est. 04), `ar8w/rastro.js` (Pipoca) |
| Falas/vídeos | `docs/historia-falas.md` → gera `ar8w/historia.js`; `fala.js`, `voz.js`, `investigador.js` (Cacá), `cutscene.js` |
| Carta: frente (retrato) | `ar8w/retrato.js` |
| Carta: verso + chave | `ar8w/verso.js`, `ar8w/chave/*` (leitor, cena, inventário, layout), `chave.html`, `tests/gerar-verso-pdf.py` |
| Fotos / câmera mágica | `ar8w/foto.js`, `filtro.js`, `ar8w/integracao.js` |
| Alvos impressos | `ar8w/alvos/*.json`, `assets/marcadores/` |
| Telão (TV do resort) | `ar8w/tv.html` (`?demo` para ver sem dados), `tv.php`, `assets/tv/` — quadro mostra os 6 últimos retratos |
| Equipe | `painel.html/.js/.css` (aprovação, CSV, link VIP, playlist TV), `mural.html` (impressão) |
| API | `api/index.php`, `api/lib.php` |

## Pendências
- Teste físico das placas/rastreamento em Android e iPhone.
- Valores dos pacotes e link real do grupo VIP (pelo painel).
- Reimprimir a placa 1 (`assets/marcadores/placa-1-A4.pdf`).
- 3º vídeo do telão; testar upload logado no painel.

## Mudanças (mais nova em cima)
- 23/10 `31a798a` — Placa 1: mantém a arte original, "ESTAÇÃO 1" no tamanho/posição das placas 2–5 (`ar8w/tools/texto_placa1.py` sobre `ar8w/tools/placa-base.png`); PDF de impressão `assets/marcadores/placa-1-A4.pdf`. Recorte AR inalterado.
- 23/10 `92f1403` — Painel: chave "Rastro do Pipoca" (seção Estação 4, `ajustes.rastro_pipoca`, exposto em `?config`). Desligado: lupa direto na placa 4 abre o jogo da memória, sem folha do faro nem patinhas AR. Padrão ligado.
- 23/10 (fora do repo) — Carta impressa, frente: QR → https://ofertas.villageresort.com.br/caso-black/; COMO JOGAR com câmera mágica (sem lupa), "anote no verso", subtítulo "anote ou desenhe". Fonte `G:/Meu Drive/Campanhas/2026/Caso Black/Caso Black - carta.ai`; PDF em `Caso Black - PRODUCAO/01 Imprimir/2 - Carta…`.
- 23/10 `037090a` — Telão: títulos CASO BLACK/PROCURADO em Anton (sem letras recortadas), fios terminam em alfinetes na borda do cartaz, placar no canto inferior direito, carimbo fora do rosto, retrato não cobre o título no vertical. Publicado.
- 23/10 `9d9d7c9` — Verso: "ANOTE AQUI O QUE VOCÊ DESCOBRIU" + chamada stories @villageresortmg. Publicado; site confere com o commit.
- 23/10 `dc135d0` — Telão `ar8w/tv.html`: vídeos em loop + quadro de suspeitos.
- 23/10 `81bf172` — Câmera: saída/reentrada, modo por número, cancelamentos ao trocar estação, envelopes persistentes (168 verificações locais).
