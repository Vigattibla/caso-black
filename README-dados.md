# Caso Black · dados

## Hospedagem oficial — PHP + SQLite

Em `ofertas.villageresort.com.br`, `dados.js` usa automaticamente `api/index.php` no mesmo domínio. Nome, e-mail, telefone/WhatsApp, autorização e progresso são gravados em SQLite fora de `public_html`, em `~/caso-black-private`. Em outros hosts, o modo padrão continua local; `window.CB_CONFIG` permite configurar testes.

- Equipe: `painel.html`, acesso por senha, contatos e CSV, aprovação dos álbuns e link do grupo VIP.
- Recepção: `mural.html`, exige o mesmo login e mostra somente álbuns aprovados. Imprime dois por A4 e registra quais foram impressos.
- Fotos e contatos não possuem listagem pública. As imagens são servidas somente para a equipe autenticada; os arquivos ficam em `~/caso-black-private/albuns`.
- O jogador resolve o caso, tira fotos e usa **Ver meu álbum e enviar à recepção**. O envio exige nome da equipe e autorização para exposição no mural físico; fica pendente até aprovação.
- A fila de cadastro/provas é guardada no aparelho quando falta internet e reenviada ao reconectar. Um envio de álbum só confirma sucesso quando o servidor o recebe.
- O progresso do AR (`cb8w_v1`) alimenta os carimbos, o final e as fotos por estação do caderno. A primeira visita ao caderno não apaga mais o AR.
- Sem link de WhatsApp configurado, o final permite registrar contato para novidades. A equipe pode cadastrar o convite no painel sem nova publicação.

Configuração privada: `config.json` contém `password_hash` (PHP `password_hash`) e `salt` aleatório. Não versionar esse arquivo nem copiar dados reais para o Git/vault. A senha inicial foi entregue separadamente ao responsável. Para backup do SQLite em uso, usar a API de backup do SQLite; não copiar só o arquivo principal enquanto houver WAL ativo. Copiar também a pasta privada de álbuns para o destino de backup autorizado.

As alternativas abaixo continuam disponíveis para outra hospedagem.

## Opção A · Supabase (grátis)
1. Crie o projeto em supabase.com → SQL Editor → cole `supabase.sql` → Run.
2. Settings → API: copie **Project URL** e a chave **anon public**.
3. Em `dados.js`:
   `{backend:'supabase', supabaseUrl:'https://xxxx.supabase.co', supabaseAnon:'<anon>'}`
4. Painel: Table Editor → view `painel` (Export CSV para a lista VIP).

A chave anon é pública por design; a RLS só permite inserir, nunca ler.
Risco: qualquer pessoa com a chave pode inserir lixo. Para uma campanha curta basta;
se aparecer spam, limpe pela view e/ou troque a chave.

## Opção B · site do Village (ou qualquer API)
`{backend:'endpoint', endpoint:'https://.../api/caso-black'}` · o site manda `POST` JSON:
- cadastro: `{evento:'cadastro', id, nome, contato, tipo:'email'|'whatsapp', lgpd:true, origem}`
- carimbo: `{evento:'carimbo', investigador_id, estacao:1..6, via:'placa'|'codigo'|'palavra'|...}`
Responder 2xx. Repetição do mesmo carimbo deve ser ignorada (chave investigador_id+estacao).
Precisa de CORS liberado para o domínio do site.

## Falhas
Envio que falhar entra numa fila no aparelho e é reenviado quando o site abrir de novo.

## Placas
ArUco 4x4 ids 300–304 = estações 1–5 (`propostas/caso-black/placas/`). Imprimir com ≥ 4 cm,
fundo branco ao redor, papel fosco.
