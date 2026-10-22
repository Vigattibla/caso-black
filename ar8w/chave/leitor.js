/* Lê a moldura da chave na imagem da câmera: dentes (cima/baixo), haste e o traço recortado. */
import {IMG, MOLDURA, DENTES, HASTE} from './layout.js';

const RW = 416, RH = Math.round(RW * (MOLDURA.y1 - MOLDURA.y0) / (MOLDURA.x1 - MOLDURA.x0));

// M = projeção · view · matriz do alvo (column-major). Devolve px do canvas com y de baixo pra cima (readPixels).
export function projetor(M, cw, ch) {
  const e = M;
  return (u, v) => {
    const x = u / IMG.w - 0.5, y = (0.5 - v / IMG.h) * IMG.h / IMG.w;
    const X = e[0] * x + e[4] * y + e[12], Y = e[1] * x + e[5] * y + e[13], W = e[3] * x + e[7] * y + e[15];
    return [(X / W + 1) / 2 * cw, (Y / W + 1) / 2 * ch, W];
  };
}

export function lerChave(gl, M, cw, ch) {
  const P = projetor(M, cw, ch);
  const cantos = [[MOLDURA.x0, MOLDURA.y0], [MOLDURA.x1, MOLDURA.y0], [MOLDURA.x0, MOLDURA.y1], [MOLDURA.x1, MOLDURA.y1]].map(([u, v]) => P(u, v));
  if (cantos.some(c => c[2] <= 0)) return {erro: 'fora'};
  const xs = cantos.map(c => c[0]), ys = cantos.map(c => c[1]);
  const bx0 = Math.floor(Math.min(...xs)), by0 = Math.floor(Math.min(...ys)), bx1 = Math.ceil(Math.max(...xs)), by1 = Math.ceil(Math.max(...ys));
  if (bx0 < 0 || by0 < 0 || bx1 > cw || by1 > ch) return {erro: 'fora'};
  if (bx1 - bx0 < 160) return {erro: 'longe'};
  const bw = bx1 - bx0, bh = by1 - by0, px = new Uint8Array(bw * bh * 4);
  gl.readPixels(bx0, by0, bw, bh, gl.RGBA, gl.UNSIGNED_BYTE, px);

  // Retifica a moldura (homografia pela própria projeção do plano).
  const rgb = new Uint8ClampedArray(RW * RH * 4), L = new Float32Array(RW * RH);
  const du = (MOLDURA.x1 - MOLDURA.x0) / RW, dv = (MOLDURA.y1 - MOLDURA.y0) / RH;
  for (let j = 0; j < RH; j++) for (let i = 0; i < RW; i++) {
    const [x, y] = P(MOLDURA.x0 + (i + 0.5) * du, MOLDURA.y0 + (j + 0.5) * dv);
    const xi = Math.min(bw - 1, Math.max(0, x - bx0 | 0)), yi = Math.min(bh - 1, Math.max(0, y - by0 | 0));
    const k = (yi * bw + xi) * 4, o = (j * RW + i) * 4;
    rgb[o] = px[k]; rgb[o + 1] = px[k + 1]; rgb[o + 2] = px[k + 2];
    L[j * RW + i] = 0.299 * px[k] + 0.587 * px[k + 1] + 0.114 * px[k + 2];
  }

  // Tinta = bem mais escuro que o papel da faixa (aguenta sombra e luz desigual; guia impressa clara fica de fora).
  const tinta = new Float32Array(RW * RH), FX = 8;
  for (let f = 0; f < FX; f++) {
    const i0 = f * RW / FX | 0, i1 = (f + 1) * RW / FX | 0, vals = [];
    for (let j = 0; j < RH; j += 2) for (let i = i0; i < i1; i += 2) vals.push(L[j * RW + i]);
    vals.sort((a, b) => a - b);
    const ref = Math.max(60, vals[vals.length * 0.85 | 0]);
    for (let j = 0; j < RH; j++) for (let i = i0; i < i1; i++) {
      const n = j * RW + i, t = Math.min(1, Math.max(0, (0.72 * ref - L[n]) / (0.2 * ref)));
      tinta[n] = t; rgb[n * 4 + 3] = t * 255;
    }
  }

  const frac = r => {
    const i0 = (r.x0 - MOLDURA.x0) / du | 0, i1 = (r.x1 - MOLDURA.x0) / du | 0, j0 = (r.y0 - MOLDURA.y0) / dv | 0, j1 = (r.y1 - MOLDURA.y0) / dv | 0;
    let s = 0, n = 0;
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) { s += tinta[j * RW + i] > 0.5; n++; }
    return s / n;
  };
  const dentes = DENTES.map(d => {
    const a = frac(d.cima), b = frac(d.baixo);
    return a > 0.15 && a > 2 * b ? 'C' : b > 0.15 && b > 2 * a ? 'B' : '?';
  });
  const papel = [0, 0, 0];
  let np = 0;
  for (let n = 0; n < RW * RH; n += 7) if (tinta[n] === 0) { papel[0] += rgb[n * 4]; papel[1] += rgb[n * 4 + 1]; papel[2] += rgb[n * 4 + 2]; np++; }
  const c = document.createElement('canvas');
  c.width = RW; c.height = RH;
  c.getContext('2d').putImageData(new ImageData(rgb, RW, RH), 0, 0);
  return {codigo: dentes.join(''), dentes, haste: frac(HASTE), traco: c, papel: papel.map(v => Math.round(v / Math.max(1, np)))};
}

// Recorte com borda branca (adesivo), para o traço se destacar em AR.
export function adesivo(tinta, borda = 7) {
  const c = document.createElement('canvas'), x = c.getContext('2d');
  c.width = tinta.width + borda * 2; c.height = tinta.height + borda * 2;
  const b = document.createElement('canvas'), bx = b.getContext('2d');
  b.width = tinta.width; b.height = tinta.height;
  bx.drawImage(tinta, 0, 0); bx.globalCompositeOperation = 'source-in'; bx.fillStyle = '#fff'; bx.fillRect(0, 0, b.width, b.height);
  for (let a = 0; a < 16; a++) x.drawImage(b, borda + Math.cos(a / 8 * Math.PI) * borda, borda + Math.sin(a / 8 * Math.PI) * borda);
  x.drawImage(tinta, borda, borda);
  return c;
}
