import {criarPainel} from './painel.js?v=24';
import {falar} from './fala.js';
import {CADEADO, FECHADURA} from './chave/placa.js';
export const cartas = [['23h50', 'pegada de estrela'], ['00h15', 'refri pra viagem'], ['00h30', 'sombra no Kids'], ['00h45', 'chapéu sumiu'], ['01h00', 'passou pela recepção']];
export function criarEstacao5(ctx) {
  const p = criarPainel(5, ctx); let aberto = false, n = 0;
  // Coordenadas da arte 1200×1600 → painel 600×800, sem retângulos de tela.
  p.jogo.classList.add('jogo-cadeado');
  p.jogo.innerHTML = `<div class="cadeado" data-ferramenta="chave" style="left:${CADEADO.x0 / 2 - 36}px;top:${CADEADO.y0 / 2 - 160}px;width:${(CADEADO.x1 - CADEADO.x0) / 2}px;height:${(CADEADO.y1 - CADEADO.y0) / 2}px"><div class="cad-foto"><img class="arco" src="../assets/objetos/cadeado-arco.webp" alt=""><img class="corpo" src="../assets/objetos/cadeado-corpo.webp" alt="Cadeado"></div><span class="fechadura" style="left:${(FECHADURA.u - CADEADO.x0) / 2}px;top:${(FECHADURA.v - CADEADO.y0) / 2}px"></span></div><p class="instrucao-chave">Arraste a chave da mochila até o cadeado.</p>`;
  function usar(item) {
    if (item !== 'chave' || aberto || p.venceu) return false;
    if (!ctx.estado.valor.itens.chave) { falar(p.texto['sem chave']); return false; }
    aberto = true; p.q('.cadeado').classList.add('aberto'); falar(p.texto.abriu, 'Gabi');
    const timer = setTimeout(() => { if (!p.el.isConnected) return; tempo(); }, 700);
    p.el.limpar = () => clearTimeout(timer); return true;
  }
  function tempo() {
    p.jogo.classList.remove('jogo-cadeado');
    p.jogo.innerHTML = `<div class="progresso">LINHA DO TEMPO · 0/5</div><div class="tempo">${[3, 1, 4, 0, 2].map(i => `<button class="e1-rec cartao" data-tempo="${i}"><i class="e1-tacha"></i><strong>${cartas[i][0]}</strong><span>${cartas[i][1]}</span></button>`).join('')}</div>`;
    p.jogo.onclick = e => { const b = e.target.closest('[data-tempo]'); if (!b || b.disabled || p.venceu) return; if (+b.dataset.tempo !== n) return p.erro(b); b.disabled = true; b.classList.add('e1-ok'); b.style.order = -10 + n++; p.q('.progresso').textContent = `LINHA DO TEMPO · ${n}/5`; if (n === 5) p.ganhar(); };
  }
  p.el.usarFerramenta = usar;
  p.iniciar(); if (!p.venceu && !ctx.estado.valor.itens.chave) falar(p.texto['sem chave']);
  return p.el;
}
