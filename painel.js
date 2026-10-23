(() => {
  const $ = s => document.querySelector(s), endpoint = 'api/index.php';
  let csrf = '', dados;
  const aviso = text => { $('#aviso').textContent = text; };
  async function api(query = '', body) {
    const r = await fetch(endpoint + query, {cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(15000),
      ...(body ? {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...body, csrf})} : {})});
    const data = await r.json(); if (!r.ok) throw Error(data.erro || 'Não foi possível concluir.'); return data;
  }
  function tela(auth) { $('#acesso').hidden = auth; $('#conteudo').hidden = !auth; $('#sair').hidden = !auth; }
  function el(tag, text, cls) { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }
  function pintarAlbuns() {
    const g = $('#lista-albuns'); g.replaceChildren(); const filtro = $('#filtro').value;
    const lista = dados.albuns.filter(a => filtro === 'todos' || a.status === filtro);
    if (!lista.length) return g.append(el('p', 'Nenhum álbum nesta lista.'));
    for (const a of lista) {
      const row = el('article', undefined, 'album-recebido'), link = el('a');
      link.href = endpoint + '?imagem=' + encodeURIComponent(a.id); link.target = '_blank'; link.rel = 'noopener';
      const img = new Image(); img.src = link.href; img.alt = 'Álbum da equipe ' + a.equipe; img.loading = 'lazy'; link.append(img);
      const info = el('div'); info.append(el('h3', a.equipe), el('p', 'Enviado em ' + new Date(a.criado_em).toLocaleString('pt-BR')), el('p', a.status === 'aprovado' ? (a.impresso_em ? 'Aprovado · marcado como impresso' : 'Aprovado · pronto para imprimir') : a.status === 'rejeitado' ? 'Não aprovado para impressão' : 'Aguardando aprovação', 'estado'));
      const actions = el('div', undefined, 'acoes');
      for (const [status, label] of [['aprovado', 'Aprovar para imprimir'], ['rejeitado', 'Não aprovar'], ['pendente', 'Rever depois']]) {
        if (a.status === status) continue;
        const btn = el('button', label); btn.onclick = async () => {
          btn.disabled = true;
          try { await api('', {evento: 'moderar', id: a.id, status}); await carregar(); aviso('Álbum atualizado.'); }
          catch (e) { aviso(e.message); } finally { btn.disabled = false; }
        }; actions.append(btn);
      }
      info.append(actions); row.append(link, info); g.append(row);
    }
  }
  async function carregar() {
    dados = await api('?admin=1'); $('#total').textContent = '(' + dados.total + ')'; $('#vip').value = dados.vip_url;
    $('#limite-lista').textContent = dados.total > dados.investigadores.length ? 'Últimos 1.000 cadastros na tela. O CSV contém a lista completa.' : '';
    const rows = $('#contatos'); rows.replaceChildren();
    for (const f of dados.investigadores) {
      const tr = el('tr'); for (const value of [f.nome, f.email || '—', f.whatsapp || '—', f.resolvido ? 'Caso resolvido' : f.provas + '/5', new Date(f.criado_em).toLocaleString('pt-BR')]) tr.append(el('td', value)); rows.append(tr);
    }
    if (!dados.investigadores.length) { const td = el('td', 'Nenhum cadastro recebido.'); td.colSpan = 5; const tr = el('tr'); tr.append(td); rows.append(tr); }
    pintarAlbuns();
  }
  $('#login').onsubmit = async e => {
    e.preventDefault(); const btn = e.submitter; btn.disabled = true; aviso('Entrando…');
    try { const s = await api('', {evento: 'login', senha: $('#senha').value}); csrf = s.csrf; $('#senha').value = ''; tela(true);
      if (new URLSearchParams(location.search).get('voltar') === 'mural') { location.href = 'mural.html'; return; }
      await carregar(); aviso('');
    } catch (e) { aviso(e.message); } finally { btn.disabled = false; }
  };
  $('#ajustes').onsubmit = async e => { e.preventDefault(); const btn = e.submitter; btn.disabled = true; try { await api('', {evento: 'ajustes', vip_url: $('#vip').value.trim()}); aviso('Link do grupo salvo.'); } catch (e) { aviso(e.message); } finally { btn.disabled = false; } };
  $('#sair').onclick = async () => { try { await api('', {evento: 'logout'}); location.reload(); } catch (e) { aviso(e.message); } };
  $('#atualizar').onclick = () => carregar().then(() => aviso('Atualizado.')).catch(e => aviso(e.message));
  $('#filtro').onchange = pintarAlbuns;
  api('?session=1').then(async s => { csrf = s.csrf; tela(s.autenticado); if (s.autenticado) await carregar(); }).catch(e => aviso('Não foi possível conectar ao painel. ' + e.message));
})();
