/* Caso Black · camada de dados
   O site sempre guarda a ficha no aparelho (localStorage) e, se configurado, espelha num backend.
   Pra ligar um backend, edite CB_CONFIG abaixo (ou defina window.CB_CONFIG antes deste arquivo):
     - Supabase:  {backend:'supabase', supabaseUrl:'https://xxxx.supabase.co', supabaseAnon:'<chave anon pública>'}
     - Site do Village / qualquer API: {backend:'endpoint', endpoint:'https://village.../api/caso-black'}
       recebe POST JSON {evento:'cadastro'|'carimbo', ...} (ver README-dados.md)
   Envio que falhar entra numa fila local e é reenviado na próxima abertura. */
window.CB_CONFIG = Object.assign({backend: 'local', supabaseUrl: '', supabaseAnon: '', endpoint: ''}, window.CB_CONFIG || {});

const Dados = window.Dados = (() => {
  const C = window.CB_CONFIG, LS = 'cb-ficha', FILA = 'cb-fila';
  const ler = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch (e) { return d } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) {} };
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : r & 3 | 8).toString(16) });

  const remoto = {
    local: async () => true,
    supabase: async ({tabela, linha, conflito}) => {
      const q = conflito ? '?on_conflict=' + conflito : '';
      const r = await fetch(`${C.supabaseUrl}/rest/v1/${tabela}${q}`, {method: 'POST', headers: {
        apikey: C.supabaseAnon, Authorization: 'Bearer ' + C.supabaseAnon, 'Content-Type': 'application/json',
        Prefer: 'return=minimal' + (conflito ? ',resolution=ignore-duplicates' : '')}, body: JSON.stringify(linha)});
      return r.ok || r.status === 409;
    },
    endpoint: async ({tabela, linha}) => {
      const r = await fetch(C.endpoint, {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({evento: {investigadores: 'cadastro', carimbos: 'carimbo'}[tabela] || tabela, ...linha})});
      return r.ok;
    },
  };
  const enviarUm = async item => { try { return await (remoto[C.backend] || remoto.local)(item) } catch (e) { return false } };
  async function enviar(item) {
    if (C.backend === 'local') return;
    const fila = ler(FILA, []);
    if (fila.length || !(await enviarUm(item))) { fila.push(item); gravar(FILA, fila); esvaziar() }
  }
  let ocupado = false;
  async function esvaziar() {
    if (ocupado || C.backend === 'local') return; ocupado = true;
    let fila = ler(FILA, []);
    while (fila.length && await enviarUm(fila[0])) { fila.shift(); gravar(FILA, fila) }
    ocupado = false;
  }

  const ref = () => { let r = ''; try { r = new URLSearchParams(location.search).get('ref') || ''; r = r.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30); if (r) localStorage.setItem('cb-ref', r); else r = localStorage.getItem('cb-ref') || '' } catch (e) {} return r || 'carta-qr' };
  ref();
  let ficha = ler(LS, null);
  return {
    ficha: () => ficha,
    carimbos: () => ficha ? ficha.carimbos : [],
    async entrar({nome, contato, lgpd}) {
      const tipo = contato.includes('@') ? 'email' : 'whatsapp';
      ficha = {id: uuid(), nome, contato, tipo, carimbos: [], resolvido: false, em: new Date().toISOString()};
      gravar(LS, ficha);
      await enviar({tabela: 'investigadores', linha: {id: ficha.id, nome, contato, tipo, lgpd: !!lgpd, origem: ref()}});
      return ficha;
    },
    async carimbar(estacao, via) {   // estacao 1..5 · 6 = caso resolvido
      if (!ficha) return false;
      const novo = !ficha.carimbos.includes(estacao);
      if (novo) { ficha.carimbos.push(estacao); if (estacao === 6) ficha.resolvido = true; gravar(LS, ficha) }
      if (novo) await enviar({tabela: 'carimbos', linha: {investigador_id: ficha.id, estacao, via}, conflito: 'investigador_id,estacao'});
      return novo;
    },
    async opinar(nota, faltou) {   // nota 1..3 (😕 🙂 😍), faltou: texto opcional
      gravar('cb-opiniao', {nota, faltou});
      await enviar({tabela: 'feedback', linha: {id: uuid(), investigador_id: ficha ? ficha.id : null, nota, faltou: (faltou || '').slice(0, 500) || null, origem: ref()}});
    },
    opiniao: () => ler('cb-opiniao', null),
    async mural(equipe, blob) {   // álbum do caso no Mural da Black; aparece só depois de aprovado pela equipe do Village
      if (!ficha) return false;
      const id = uuid(), arquivo = id + '.jpg';
      if (C.backend === 'supabase') {
        const r = await fetch(`${C.supabaseUrl}/storage/v1/object/mural/${arquivo}`, {method: 'POST', headers: {
          apikey: C.supabaseAnon, Authorization: 'Bearer ' + C.supabaseAnon, 'Content-Type': 'image/jpeg'}, body: blob}).catch(() => null);
        if (!r || !r.ok) return false;
        await enviar({tabela: 'mural', linha: {id, investigador_id: ficha.id, equipe, arquivo, autorizo: true}});
      } else if (C.backend === 'endpoint') {
        const imagem = await new Promise(ok => { const f = new FileReader(); f.onload = () => ok(f.result); f.readAsDataURL(blob) });
        if (!(await enviarUm({tabela: 'mural', linha: {id, investigador_id: ficha.id, equipe, autorizo: true, imagem}}))) return false;
      }
      gravar('cb-mural', {id, equipe, em: new Date().toISOString()});
      return true;
    },
    noMural: () => ler('cb-mural', null),
    sair() { ficha = null; try { localStorage.removeItem(LS) } catch (e) {} },
    esvaziar,
  };
})();
Dados.esvaziar();
