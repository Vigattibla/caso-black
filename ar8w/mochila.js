export function criarMochila(estado, painel, avisar) {
  const el = document.querySelector('#mochila'); let selecionado, arrasto;
  const icones = {lente: '<img class="obj" src="../assets/objetos/lente.webp" alt="">', chave: '<img class="obj" src="../assets/objetos/chave-item.webp" alt="">'};
  const tem = item => item === 'lente' ? estado.valor.mao === 'lente' : !!estado.valor.itens[item];
  const rotulo = item => item === 'lente' ? (tem(item) ? 'Lupa na mão' : estado.valor.itens.lente ? 'Lupa guardada na carta' : 'Lupa ainda não encontrada') : `Chave${tem(item) ? ' na mochila' : ' ainda não encontrada'}`;
  function atualizar() {
    for (const item of ['lente', 'chave']) {
      const b = el.querySelector(`[data-item="${item}"]`); b.innerHTML = icones[item] + `<span>${item === 'lente' ? 'Lupa' : 'Chave'}</span>`;
      if (item === 'chave' && estado.valor.itens.chave?.img) { const img = new Image(); img.src = estado.valor.itens.chave.img; img.alt = 'Sua chave desenhada'; b.querySelector('img').replaceWith(img); }
      b.hidden = !tem(item); b.setAttribute('aria-label', rotulo(item));
    }
    // Só aparece o que já foi achado: dentes como uma chave em miniatura; itens só depois de pegos.
    const d = estado.valor.dentes, achados = [1, 2, 3, 4].filter(n => d[n]);
    const dentes = document.querySelector('#dentes'); dentes.hidden = !achados.length;
    dentes.innerHTML = miniChave(d); dentes.setAttribute('aria-label', `Chave: ${achados.length} de 4 dentes`);
    el.hidden = !achados.length && !['lente', 'chave'].some(tem);
  }
  function usar(item, alvo) { if (alvo && painel()?.contains(alvo)) if (painel().usarFerramenta?.(item) && item === 'lente') estado.soltar(); }
  el.addEventListener('pointerdown', e => {
    const b = e.target.closest('[data-item]'); if (!b || e.button !== 0) return;
    const item = b.dataset.item;
    if (!tem(item)) { avisar(item); return; }
    e.preventDefault(); b.setPointerCapture(e.pointerId); selecionado = item;
    const fantasma = document.createElement('div'); fantasma.className = 'item-voando'; fantasma.append(b.querySelector('img').cloneNode(true)); document.body.append(fantasma);
    arrasto = {b, item, fantasma, x: e.clientX, y: e.clientY}; mover(e);
  });
  function mover(e) { if (arrasto) { arrasto.fantasma.style.left = e.clientX - 35 + 'px'; arrasto.fantasma.style.top = e.clientY - 35 + 'px'; } }
  el.addEventListener('pointermove', mover);
  el.addEventListener('pointerup', e => {
    if (!arrasto) return;
    const {b, item, fantasma, x, y} = arrasto; arrasto = null; fantasma.remove();
    if (b.hasPointerCapture(e.pointerId)) b.releasePointerCapture(e.pointerId);
    if (Math.hypot(e.clientX - x, e.clientY - y) > 8) { usar(item, document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-ferramenta]')); selecionado = null; }
    atualizarSelecao();
  });
  el.addEventListener('pointercancel', () => { arrasto?.fantasma.remove(); arrasto = null; selecionado = null; atualizarSelecao(); });
  function atualizarSelecao() { el.querySelectorAll('[data-item]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.item === selecionado))); }
  // Alternativa por teclado/toques para o mesmo uso da ferramenta.
  el.addEventListener('click', e => { const b = e.target.closest('[data-item]'); if (b && e.detail === 0) { if (!tem(b.dataset.item)) return avisar(b.dataset.item); selecionado = b.dataset.item; atualizarSelecao(); } });
  document.addEventListener('click', e => { const alvo = e.target.closest('[data-ferramenta]'); if (alvo && selecionado) { usar(selecionado, alvo); selecionado = null; atualizarSelecao(); } });
  estado.eventos.addEventListener('change', atualizar); atualizar();
  return {
    premiar(item, origem) {
      atualizar(); if (item !== 'lente' && item !== 'chave') return;
      // Lupa recém-achada vai para a carta (some para baixo); tocada no verso, vem para a mão.
      const r = origem.getBoundingClientRect(), slot = el.querySelector(`[data-item="${item}"]`).getBoundingClientRect(), fim = tem(item) ? slot : {left: innerWidth / 2, top: innerHeight + 40, width: 0, height: 0};
      const v = document.createElement('div'); v.className = 'item-voando'; v.append(el.querySelector(`[data-item="${item}"]`).querySelector('img').cloneNode(true)); v.style.left = r.left + r.width / 2 - 35 + 'px'; v.style.top = r.top + r.height / 2 - 35 + 'px'; document.body.append(v);
      const a = v.animate([{transform: 'scale(1.5)', opacity: 1}, {transform: `translate(${fim.left + fim.width / 2 - r.left - r.width / 2}px,${fim.top + fim.height / 2 - r.top - r.height / 2}px) scale(.65)`, opacity: .4}], {duration: 1000, easing: 'ease-in-out'});
      a.onfinish = () => v.remove();
    },
  };
}

function miniChave(d) {
  const partes = [1, 2, 3, 4].map(n => {
    const x = 34 + n * 16;
    if (!d[n]) return `<text x="${x + 5}" y="30" class="falta">?</text>`;
    return d[n] === 'C' ? `<path d="M${x} 19V7h10v12"/>` : `<path d="M${x} 31v12h10V31"/>`;
  });
  return `<svg viewBox="0 0 120 50" aria-hidden="true"><circle cx="16" cy="25" r="11"/><circle cx="16" cy="25" r="4"/><path d="M27 19h88v12H27"/>${partes.join('')}</svg>`;
}
