import {criarPainel} from './painel.js?v=23';
export function criarEstacao2(ctx) {
  const p = criarPainel(2, ctx), partes = ['COMANDA SEM NOME', '00h15', '1 refri de laranja', 'PRA VIAGEM'];
  let n = 0;
  p.jogo.innerHTML = `<div class="montagem"><div class="tiras">${[2, 0, 3, 1].map(i => `<button class="e1-rec tira" data-tira="${i}"><i class="e1-tacha"></i>${partes[i]}</button>`).join('')}</div><div class="encaixe"><small>MONTE A COMANDA<br>DE CIMA PRA BAIXO</small></div></div>`;
  p.jogo.onclick = e => {
    const b = e.target.closest('[data-tira]'); if (!b || b.disabled || p.venceu) return;
    if (+b.dataset.tira !== n) return p.erro(b);
    if (!n) p.q('.encaixe').textContent = '';
    p.q('.encaixe').insertAdjacentHTML('beforeend', `<div class="tira">${partes[n++]}</div>`);
    b.disabled = true; b.classList.add('e1-ok'); if (n === partes.length) p.ganhar();
  };
  p.iniciar(); return p.el;
}
