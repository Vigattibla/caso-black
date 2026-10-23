/* Posições no verso de teste (px da imagem 1200x1600). Local do alvo: largura 1, centro no meio, y pra cima. */
export const IMG = {w: 1200, h: 1600};
export const MOLDURA = {x0: 120, y0: 310, x1: 1080, y1: 875};
export const DENTES = [530, 670, 810, 950].map(cx => ({
  cima: {x0: cx - 38, y0: 420, x1: cx + 38, y1: 550},
  baixo: {x0: cx - 38, y0: 634, x1: cx + 38, y1: 764},
}));
export const HASTE = {x0: 440, y0: 560, x1: 1010, y1: 624};
export const ARGOLA = {x: 290, y: 592, r: 140, furo: 72};
export const BOLSO = {u: 330, v: 1245};
export const CERTO = 'CBBC'; // 1 cima · 2 baixo · 3 baixo · 4 cima
export const local = (u, v) => [u / IMG.w - 0.5, (0.5 - v / IMG.h) * IMG.h / IMG.w];
export const tam = r => [(r.x1 - r.x0) / IMG.w, (r.y1 - r.y0) / IMG.w];
export const centro = r => local((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2);
