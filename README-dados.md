# Caso Black · dados

O site funciona sozinho (`backend:'local'`): ficha e carimbos ficam no celular da pessoa.
Para receber os cadastros, ligue um backend em `dados.js` → `CB_CONFIG`.

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
