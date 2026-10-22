import {historia} from './historia.js?v=23';
import {falar, sequencia} from './fala.js';
import {lerChave, adesivo} from './chave/leitor.js?v=22';
import {IMG, MOLDURA, DENTES, HASTE, ARGOLA} from './chave/layout.js';
export function criarVerso({estado, demo, premiar}) {
  const el = document.createElement('section'); el.className = 'e1 verso'; el.dataset.estacao = 'verso';
  el.innerHTML = '<div class="leitura-moldura">' + guia(estado.valor.dentes) + '<p class="leitura-status" role="status"></p><button class="leitura-socorro" hidden>Não está lendo? Toque aqui</button></div><div class="verso-rodape"><div class="fala-slot"></div></div>';
  const q = s => el.querySelector(s); let anterior = '', iguais = 0, guardando = false, inicio = 0, ultimo = null;
  const faltam = () => 4 - [1, 2, 3, 4].filter(n => estado.valor.dentes[n]).length;
  function avaliar(r) {
    if (guardando || estado.valor.itens.chave || estado.valor.concluidas.includes(5) || !estado.podeLer()) return false;
    // Retorno ao vivo do que a câmera está vendo; plano B depois de ~25 s tentando.
    inicio ||= Date.now(); if (r.traco) ultimo = r;
    if (Date.now() - inicio > 25000) q('.leitura-socorro').hidden = false;
    const st = r.erro === 'longe' ? 'CHEGUE MAIS PERTO' : r.erro ? 'MOSTRE A CHAVE INTEIRA' : 'LENDO: ' + r.dentes.map(d => d === 'C' ? '↑' : d === 'B' ? '↓' : '?').join(' ');
    if (q('.leitura-status').textContent !== st) q('.leitura-status').textContent = st;
    if (r.erro || !/^[CB]{4}$/.test(r.codigo)) { iguais = 0; anterior = ''; return false; }
    iguais = r.codigo === anterior ? iguais + 1 : 1; anterior = r.codigo;
    if (iguais < 3) return false;
    iguais = 0;
    if (r.codigo !== 'CBBC') { falar(historia.chave.errada); return false; }
    return guardar(r.codigo, r.traco);
  }
  function guardar(codigo, traco) {
    if (!estado.guardarChave(codigo, traco ? adesivo(traco).toDataURL('image/png') : '')) return false;
    guardando = true; q('.leitura-socorro').hidden = true; premiar('chave', el); falar(historia.chave.certa); q('.leitura-status').textContent = 'CHAVE GUARDADA'; q('.chave-guia').classList.add('guardada'); return true;
  }
  q('.leitura-socorro').onclick = () => { if (!guardando && el.podeLer()) guardar('CBBC', ultimo?.traco); };
  el.avaliar = avaliar;
  el.podeLer = () => estado.podeLer() && !estado.valor.itens.chave && !estado.valor.concluidas.includes(5);
  if (estado.valor.concluidas.includes(5)) { q('.chave-guia').classList.add('guardada'); q('.leitura-status').textContent = 'VIRE A CARTA: RETRATO FALADO'; falar('A chave já fez o trabalho dela. Vira a carta e mira a câmera no retrato falado!'); }
  else {
    falar(historia.chave[estado.valor.itens.chave ? 'certa' : 'pedido']);
    q('.leitura-status').textContent = estado.valor.itens.chave ? 'CHAVE GUARDADA' : estado.podeLer() ? 'PASSE LÁPIS OU CANETA POR CIMA DO AMARELO' : `COPIE O AMARELO · FALTA${faltam() > 1 ? 'M' : ''} ${faltam()} DENTE${faltam() > 1 ? 'S' : ''} NAS PLACAS`;
    if (estado.valor.itens.chave) q('.chave-guia').classList.add('guardada');
    if (demo) montarDemo();
  }
  function montarDemo() {
    const area = document.createElement('div'); area.className = 'demo-chave';
    area.innerHTML = '<canvas width="1200" height="1600" aria-label="Desenho da chave de teste"></canvas><div class="demo-dentes">' + [0, 1, 2, 3].map(i => `<button data-dente="${i}" aria-label="Alternar dente ${i + 1}">↑</button>`).join('') + '</div><button class="ler-chave">Ler desenho</button>';
    q('.leitura-moldura').append(area); const codigo = ['C', 'C', 'C', 'C'], c = area.querySelector('canvas'), x = c.getContext('2d');
    function desenhar() {
      x.fillStyle = '#fffdf6'; x.fillRect(0, 0, IMG.w, IMG.h); x.strokeStyle = '#203b80'; x.lineWidth = 14; x.lineJoin = 'round';
      x.beginPath(); x.arc(ARGOLA.x, ARGOLA.y, ARGOLA.r, 0, 2 * Math.PI); x.stroke(); x.beginPath(); x.arc(ARGOLA.x, ARGOLA.y, ARGOLA.furo, 0, 2 * Math.PI); x.stroke();
      x.strokeRect(HASTE.x0 - 30, HASTE.y0 + 8, HASTE.x1 - HASTE.x0 + 20, HASTE.y1 - HASTE.y0 - 16);
      DENTES.forEach((d, i) => { const r = codigo[i] === 'C' ? d.cima : d.baixo, base = codigo[i] === 'C' ? HASTE.y0 + 8 : HASTE.y1 - 8, ponta = codigo[i] === 'C' ? r.y0 + 12 : r.y1 - 12; x.beginPath(); x.moveTo(r.x0 + 6, base); x.lineTo(r.x0 + 6, ponta); x.lineTo(r.x1 - 6, ponta); x.lineTo(r.x1 - 6, base); x.stroke(); });
    }
    area.onclick = e => { const b = e.target.closest('[data-dente]'); if (!b) return; const i = +b.dataset.dente; codigo[i] = codigo[i] === 'C' ? 'B' : 'C'; b.textContent = codigo[i] === 'C' ? '↑' : '↓'; desenhar(); };
    area.querySelector('.ler-chave').onclick = () => {
      if (!estado.podeLer()) { falar(historia.chave.pedido); return; }
      // Buffer da imagem de teste: o mesmo leitor/retificação/limiares usados no vídeo AR.
      const pixels = x.getImageData(0, 0, IMG.w, IMG.h).data;
      const gl = {readPixels(bx, by, w, h, formato, tipo, destino) { for (let j = 0; j < h; j++) { const inicio = ((IMG.h - 1 - by - j) * IMG.w + bx) * 4; destino.set(pixels.subarray(inicio, inicio + w * 4), j * w * 4); } }};
      const M = [2, 0, 0, 0, 0, 1.5, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      const r = lerChave(gl, M, IMG.w, IMG.h); el.ultimaLeitura = {codigo: r.codigo, haste: r.haste};
      for (let i = 0; i < 3; i++) avaliar(r);
    };
    desenhar();
  }
  return el;
}
// Guia em AR 1:1 sobre a moldura impressa: argola e haste sempre; cada dente aparece quando a placa dele é resolvida.
function guia(dentes) {
  const linha = (pts, cls = '') => `<polyline class="${cls}" points="${pts.map(p => p.join(',')).join(' ')}"/>`;
  const partes = [`<circle cx="${ARGOLA.x}" cy="${ARGOLA.y}" r="${ARGOLA.r}"/>`, `<circle cx="${ARGOLA.x}" cy="${ARGOLA.y}" r="${ARGOLA.furo}"/>`,
    linha([[ARGOLA.x + ARGOLA.r - 6, HASTE.y0 + 8], [HASTE.x1 - 10, HASTE.y0 + 8], [HASTE.x1 - 10, HASTE.y1 - 8], [ARGOLA.x + ARGOLA.r - 6, HASTE.y1 - 8]])];
  DENTES.forEach((d, i) => {
    const lado = dentes[i + 1];
    if (!lado) { const [cx, cy] = [(d.cima.x0 + d.cima.x1) / 2, (HASTE.y0 + HASTE.y1) / 2]; partes.push(`<text class="falta" x="${cx}" y="${cy + 22}">?</text>`); return; }
    const r = lado === 'C' ? d.cima : d.baixo, base = lado === 'C' ? HASTE.y0 + 8 : HASTE.y1 - 8, ponta = lado === 'C' ? r.y0 + 12 : r.y1 - 12;
    partes.push(linha([[r.x0 + 6, base], [r.x0 + 6, ponta], [r.x1 - 6, ponta], [r.x1 - 6, base]]));
  });
  return `<svg class="chave-guia" viewBox="${MOLDURA.x0} ${MOLDURA.y0} ${MOLDURA.x1 - MOLDURA.x0} ${MOLDURA.y1 - MOLDURA.y0}" aria-hidden="true"><g class="sombra">${partes.join('')}</g><g class="traco">${partes.join('')}</g></svg>`;
}
