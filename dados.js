/* Caso Black · camada de dados
   O site sempre guarda a ficha no aparelho (localStorage) e, se configurado, espelha num backend.
   Pra ligar um backend, edite CB_CONFIG abaixo (ou defina window.CB_CONFIG antes deste arquivo):
     - Supabase:  {backend:'supabase', supabaseUrl:'https://xxxx.supabase.co', supabaseAnon:'<chave anon pública>'}
     - Site do Village / qualquer API: {backend:'endpoint', endpoint:'https://village.../api/caso-black'}
       recebe POST JSON {evento:'cadastro'|'carimbo', ...} (ver README-dados.md)
   Envio que falhar entra numa fila local e é reenviado na próxima abertura. */
window.CB_CONFIG = Object.assign({backend: location.hostname === 'ofertas.villageresort.com.br' ? 'endpoint' : 'local', supabaseUrl: '', supabaseAnon: '', endpoint: new URL('api/index.php', document.currentScript.src).href}, window.CB_CONFIG || {});

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
    endpoint: async ({tabela, linha, visitante}) => {
      const r = await fetch(C.endpoint, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-CB-Visitor': visitante || ficha?.token || ''}, signal: AbortSignal.timeout(10000),
        body: JSON.stringify({evento: {investigadores: 'cadastro', carimbos: 'carimbo'}[tabela] || tabela, ...linha})});
      return r.ok;
    },
  };
  const enviarUm = async item => { try { return await (remoto[C.backend] || remoto.local)(item) } catch (e) { return false } };
  async function enviar(item) {
    if (C.backend === 'local') return true;
    item = {...item, operacao: uuid(), visitante: ficha?.token || ''};
    gravar(FILA, [...ler(FILA, []), item]);
    await esvaziar();
    return !ler(FILA, []).some(x => x.operacao === item.operacao);
  }
  let escoando;
  function esvaziar() {
    if (C.backend === 'local') return Promise.resolve();
    if (escoando) return escoando;
    escoando = (async () => {
      for (;;) {
        const item = ler(FILA, [])[0]; if (!item || !(await enviarUm(item))) break;
        // Reler após o fetch preserva envios que entraram enquanto a requisição estava em andamento.
        const fila = ler(FILA, []); fila.shift(); gravar(FILA, fila);
      }
    })().finally(() => { escoando = null; document.dispatchEvent(new Event('cb-envio')); });
    return escoando;
  }

  const ref = () => { let r = ''; try { r = new URLSearchParams(location.search).get('ref') || ''; r = r.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30); if (r) localStorage.setItem('cb-ref', r); else r = localStorage.getItem('cb-ref') || '' } catch (e) {} return r || 'carta-qr' };
  ref();
  let ficha = ler(LS, null);
  const token = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  if (ficha && !ficha.token) {
    ficha.token = token(); gravar(LS, ficha);
    if (C.backend === 'endpoint') {
      const linha = {id: ficha.id, nome: ficha.nome, email: ficha.email || (ficha.tipo === 'email' ? ficha.contato : ''), whatsapp: ficha.whatsapp || (ficha.tipo === 'whatsapp' ? ficha.contato : ''), lgpd: true, origem: ref()};
      const carimbos = [...new Set(ficha.carimbos || [])].filter(n => n >= 1 && n <= 6).sort().map(estacao => ({tabela: 'carimbos', linha: {investigador_id: ficha.id, estacao, via: 'migracao'}, visitante: ficha.token, operacao: uuid()}));
      gravar(FILA, [{tabela: 'investigadores', linha, visitante: ficha.token, operacao: uuid()}, ...carimbos, ...ler(FILA, []).map(x => ({...x, visitante: ficha.token}))]);
    }
  }
  async function integrarAR(estado) {
      const s = estado || ler('cb8w_v1', null); if (s?.versao !== 1) return;
      const numeros = [...new Set((s.concluidas || []).filter(n => Number.isInteger(n) && n >= 1 && n <= 5))];
      const antigos = ler('cb-achadas', []); gravar('cb-achadas', [...new Set([...antigos, ...numeros.map(n => n - 1)])]);
      if (s.final && numeros.length === 5) { try { localStorage.setItem('cb-resolvido', '1'); localStorage.setItem('cb-palavra', '1'); } catch (_) {} }
      const porEstacao = s.fotosEstacoes || {};
      for (const n of numeros) {
        const foto = porEstacao[n];
        if (typeof foto === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(foto) && (!ler('cb-foto-' + n, null) || porEstacao[n])) {
          try { localStorage.setItem('cb-foto-' + n, foto); } catch (_) {}
        }
      }
      // Atualizar todos os carimbos antes de esperar a rede: o jogador continua mesmo offline.
      if (ficha) {
        const novos = numeros.filter(n => !ficha.carimbos.includes(n));
        if (s.final && numeros.length === 5 && !ficha.carimbos.includes(6)) novos.push(6);
        ficha.carimbos = [...new Set([...ficha.carimbos, ...novos])]; ficha.resolvido ||= novos.includes(6); gravar(LS, ficha);
        document.dispatchEvent(new Event('cb-ar-sincronizado'));
        await Promise.all(novos.map(estacao => enviar({tabela: 'carimbos', linha: {investigador_id: ficha.id, estacao, via: 'ar'}})));
      }
      document.dispatchEvent(new Event('cb-ar-sincronizado'));
  }
  return {
    ficha: () => ficha,
    carimbos: () => ficha ? ficha.carimbos : [],
    async entrar({nome, email = '', whatsapp = '', lgpd, origem = ''}) {
      const contato = whatsapp || email, tipo = email && whatsapp ? 'ambos' : whatsapp ? 'whatsapp' : 'email';
      ficha = {id: uuid(), token: token(), nome, contato, email, whatsapp, tipo, carimbos: [], resolvido: false, em: new Date().toISOString()};
      gravar(LS, ficha);
      await enviar({tabela: 'investigadores', linha: {id: ficha.id, nome, contato, email: email || null, whatsapp: whatsapp || null, tipo, lgpd: !!lgpd, origem: origem || ref()}});
      await integrarAR();
      return ficha;
    },
    async carimbar(estacao, via) {   // estacao 1..5 · 6 = caso resolvido
      if (!ficha) return false;
      const novo = !ficha.carimbos.includes(estacao);
      if (novo) { ficha.carimbos.push(estacao); if (estacao === 6) ficha.resolvido = true; gravar(LS, ficha);
        document.dispatchEvent(new CustomEvent('cb-carimbo', {detail: {estacao}})) }
      if (novo) await enviar({tabela: 'carimbos', linha: {investigador_id: ficha.id, estacao, via}, conflito: 'investigador_id,estacao'});
      return novo;
    },
    async opinar(nota, faltou) {   // nota 1..3 (😕 🙂 😍), faltou: texto opcional
      gravar('cb-opiniao', {nota, faltou});
      if (ficha) await enviar({tabela: 'feedback', linha: {id: uuid(), investigador_id: ficha.id, nota, faltou: (faltou || '').slice(0, 500) || null, origem: ref()}});
    },
    opiniao: () => ler('cb-opiniao', null),
    async mural(equipe, blob) {   // álbum do caso no Mural da Black; aparece só depois de aprovado pela equipe do Village
      if (!ficha) return false;
      if (C.backend === 'local') return false;
      await esvaziar();
      if (ler(FILA, []).length) return false;
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
      gravar('cb-mural', {id, equipe, servidor: true, em: new Date().toISOString()});
      return true;
    },
    noMural: () => { const m = ler('cb-mural', null); return m?.servidor || C.backend === 'supabase' ? m : null; },
    sair() { ficha = null; try { localStorage.removeItem(LS) } catch (e) {} },
    esvaziar,
    integrarAR,
    pendentes: () => ler(FILA, []).length,
    async grupo() {
      if (C.backend !== 'endpoint') return '';
      try { const r = await fetch(C.endpoint + '?config=1', {signal: AbortSignal.timeout(8000)}); return r.ok ? (await r.json()).vip_url || '' : ''; } catch (_) { return ''; }
    },
  };
})();
Dados.esvaziar();
addEventListener('online', () => Dados.esvaziar());
