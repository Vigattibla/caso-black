import {criarPainel} from './painel.js';
export function criarEstacao3(ctx) {
  const p = criarPainel(3, ctx), achou = new Set();
  const alvos = [['escorregador', 'Escorregador', 37, 18, 14, 27], ['castelo', 'Castelo', 81, 17, 17, 40], ['camiseta', 'Camiseta do monitor', 57, 39, 10, 21], ['cadeira', 'Cadeira azul', 5, 65, 11, 21], ['chapeu', 'Chapéu do menino', 21, 23, 10, 21]];
  p.jogo.innerHTML = '<div class="progresso" role="status">ACHE AS 5 DIFERENÇAS · 0/5</div><div class="camera-fotos">' + [false, true].map(depois => `<div class="cena ${depois ? 'depois' : 'antes'}"><img src="../assets/kids-${depois ? 'depois' : 'antes'}.webp" alt="Kids ${depois ? 'depois' : 'antes'} do sumiço" draggable="false"><div class="camtag">${depois ? 'DEPOIS' : 'ANTES'} · CAM 03 · REC</div>${alvos.map(([id, nome, x, y, w, h]) => `<${depois ? 'button' : 'span'} ${depois ? `data-dif="${id}" aria-label="${nome}" aria-pressed="false"` : `data-marca="${id}" hidden`} class="dif" style="left:${x + w / 2}%;top:${y + h / 2}%;width:${w}%;height:${h}%"></${depois ? 'button' : 'span'}>`).join('')}</div>`).join('') + '</div>';
  p.q('.depois').onclick = e => {
    if (p.venceu) return;
    const b = e.target.closest('[data-dif]'); if (!b) return p.erro(p.q('.depois'));
    if (achou.has(b.dataset.dif)) return;
    achou.add(b.dataset.dif); b.classList.add('e1-ok'); b.setAttribute('aria-pressed', 'true'); p.q(`[data-marca="${b.dataset.dif}"]`).hidden = false;
    p.q('.progresso').textContent = `ACHE AS 5 DIFERENÇAS · ${achou.size}/5`;
    if (achou.size === 5) p.ganhar();
  };
  p.iniciar(); return p.el;
}
