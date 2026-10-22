/* Posições no verso de teste (px da imagem 1200x1600). Local do alvo: largura 1, centro no meio, y pra cima. */
export const IMG = {w: 1200, h: 1600};
export const MOLDURA = {x0: 100, y0: 300, x1: 930, y1: 640}; // área onde a pessoa desenha a chave
export const DENTES = [450, 570, 690, 810].map(cx => ({
  cima: {x0: cx - 30, y0: 355, x1: cx + 30, y1: 430},
  baixo: {x0: cx - 30, y0: 510, x1: cx + 30, y1: 585},
}));
export const HASTE = {x0: 360, y0: 452, x1: 880, y1: 488};
export const CADEADO = {x0: 940, y0: 340, x1: 1120, y1: 517}; // cadeado impresso
export const FECHADURA = {u: 1043, v: 470}; // buraco do cadeado
export const BOLSO = {u: 880, v: 1095};
export const CERTO = 'CBBC'; // 1 cima · 2 baixo · 3 baixo · 4 cima
export const local = (u, v) => [u / IMG.w - 0.5, (0.5 - v / IMG.h) * IMG.h / IMG.w];
export const tam = r => [(r.x1 - r.x0) / IMG.w, (r.y1 - r.y0) / IMG.w];
export const centro = r => local((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2);
