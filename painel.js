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
  async function carregarTv() {
    const t = await api('?tv=1'), ol = $('#lista-tv'), ordem = t.videos.map(v => v.arquivo); ol.replaceChildren();
    if (!t.videos.length) ol.append(el('li', 'Nenhum vídeo. A TV mostra só o quadro dos retratos.'));
    t.videos.forEach((v, i) => {
      const li = el('li', undefined, 'video-tv'), vid = el('video'), info = el('div'), acoes = el('div', undefined, 'acoes');
      vid.src = v.arquivo + '#t=3'; vid.muted = true; vid.preload = 'metadata';
      info.append(el('h3', v.nome), el('p', (v.tamanho / 1e6).toFixed(1).replace('.', ',') + ' MB'));
      const botao = (rotulo, fn, off) => { const b = el('button', rotulo); b.type = 'button'; b.disabled = off; b.onclick = async () => {
        b.disabled = true; try { if (await fn() !== false) { await carregarTv(); aviso('Vídeos da TV atualizados.'); } } catch (e) { aviso(e.message); } finally { b.disabled = off; } }; acoes.append(b); };
      const mover = d => { const o = ordem.slice(); [o[i], o[i + d]] = [o[i + d], o[i]]; return api('', {evento: 'tv-ordem', lista: o}); };
      botao('Subir', () => mover(-1), i === 0); botao('Descer', () => mover(1), i === t.videos.length - 1);
      botao('Tirar da TV', () => confirm('Tirar "' + v.nome + '" da TV?') && api('', {evento: 'tv-remover', arquivo: v.arquivo}), false);
      info.append(acoes); li.append(vid, info); ol.append(li);
    });
  }
  $('#enviar-tv').onsubmit = e => {
    e.preventDefault(); const f = $('#arquivo-tv').files[0], btn = e.submitter, barra = $('#progresso-tv');
    if (!f) return; if (f.size > 400e6) return aviso('Vídeo muito grande. Use até 400 MB.');
    const x = new XMLHttpRequest(); x.open('POST', endpoint + '?tv-video=1');
    x.setRequestHeader('Content-Type', 'video/mp4'); x.setRequestHeader('X-CSRF', csrf); x.setRequestHeader('X-Nome', encodeURIComponent(f.name.replace(/\.[^.]+$/, '')));
    btn.disabled = true; barra.hidden = false; barra.value = 0; aviso('Enviando vídeo…');
    x.upload.onprogress = p => { if (p.total) barra.value = p.loaded / p.total; };
    x.onloadend = async () => {
      btn.disabled = false; barra.hidden = true; let d = {}; try { d = JSON.parse(x.responseText); } catch (_) {}
      if (x.status === 200 && d.ok) { $('#enviar-tv').reset(); await carregarTv().catch(() => {}); aviso('Vídeo adicionado. A TV começa a tocar em até 5 minutos.'); }
      else aviso(d.erro || 'Não foi possível enviar o vídeo.');
    };
    x.send(f);
  };
  async function carregar() {
    dados = await api('?admin=1'); $('#total').textContent = '(' + dados.total + ')'; $('#vip').value = dados.vip_url;
    $('#limite-lista').textContent = dados.total > dados.investigadores.length ? 'Últimos 1.000 cadastros na tela. O CSV contém a lista completa.' : '';
    const rows = $('#contatos'); rows.replaceChildren();
    for (const f of dados.investigadores) {
      const tr = el('tr'); for (const value of [f.nome, f.email || '—', f.whatsapp || '—', f.resolvido ? 'Caso resolvido' : f.provas + '/5', new Date(f.criado_em).toLocaleString('pt-BR')]) tr.append(el('td', value)); rows.append(tr);
    }
    if (!dados.investigadores.length) { const td = el('td', 'Nenhum cadastro recebido.'); td.colSpan = 5; const tr = el('tr'); tr.append(td); rows.append(tr); }
    pintarAlbuns(); await carregarTv();
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
