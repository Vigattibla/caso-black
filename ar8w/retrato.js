/* Frente da carta: lê o retrato falado desenhado, faz ele saltar do papel, falar e tirar o disfarce (é o Bê). */
import {historia} from './historia.js?v=25';
import {falar, sequencia} from './fala.js';
import {projetor} from './chave/leitor.js?v=22';
import {tirarFoto} from './foto.js?v=1';
import {IMG} from './chave/layout.js';

// Região do rosto no alvo "frente" (px de 1200×1600) e a guia impressa (cabeça + ombros), relativa à região.
const R = {x0: 383, y0: 686, x1: 815, y1: 1214}, W = R.x1 - R.x0, H = R.y1 - R.y0;
const CAB = {x: 216, y: 268, rx: 125, ry: 157}, OMBRO = {x0: 50, x1: 381, topo: 403}, BOCA = 350;
const RW = 216, RH = Math.round(RW * H / W);
const TINTA_MIN = .012;
const falasSuspeito = ['Ei! Quem me desenhou?! …Tá bom, tá bom. Vocês me pegaram.',
  'Óculos, bigodão, chapéu, gravata… o disfarce era perfeito!',
  'Mas detetive bom não se engana. Lá vai o disfarce…'];

const CSS = `.e1.retrato{padding:0;background:transparent;border:0;box-shadow:none;display:block;pointer-events:none;transform-style:preserve-3d}
.retrato .ret-area{position:absolute;left:${R.x0 / 2}px;top:${R.y0 / 2}px;width:${W / 2}px;height:${H / 2}px;border:3px dashed #fdc72f;overflow:hidden}
.retrato .ret-area::after{content:'';position:absolute;left:0;right:0;height:4px;background:#fdc72f;box-shadow:0 0 14px #fdc72f;animation:ret-varre 1.6s ease-in-out infinite alternate}
.retrato.lido .ret-area{border-color:transparent}.retrato.lido .ret-area::after{display:none}
@keyframes ret-varre{from{top:0}to{top:calc(100% - 4px)}}
.retrato .leitura-status{top:${R.y1 / 2 + 12}px;bottom:auto}
.retrato .ret-vivo{position:absolute;left:${R.x0 / 2}px;top:${R.y0 / 2}px;width:${W / 2}px;height:${H / 2}px;transform-style:preserve-3d;pointer-events:none}
.ret-vivo canvas,.ret-vivo .ret-caco{position:absolute;left:0;width:100%;display:block}
.ret-vivo .ret-topo{top:0}.ret-vivo .ret-queixo{top:${BOCA / H * 100}%;transition:transform .09s}
.ret-vivo .ret-sombra{position:absolute;left:10%;right:10%;bottom:-6%;height:12%;border-radius:50%;background:#0008;filter:blur(8px)}
.ret-vivo .ret-be{position:absolute;left:8%;top:4%;width:84%;opacity:0}
.retrato .ret-rodape{position:absolute;left:20px;right:20px;bottom:15px;pointer-events:auto}
.demo-retrato{position:absolute;inset:0}.demo-retrato canvas{width:100%;height:100%;display:block}
.demo-retrato .ler-retrato{position:absolute;bottom:100%;margin-bottom:10px;left:0;right:0}`;

// Retifica a região do rosto da câmera; tinta (bem mais escura que o papel) vai pro alfa.
export function lerRetrato(gl, M, cw, ch) {
  const P = projetor(M, cw, ch);
  const cantos = [[R.x0, R.y0], [R.x1, R.y0], [R.x0, R.y1], [R.x1, R.y1]].map(([u, v]) => P(u, v));
  if (cantos.some(c => c[2] <= 0)) return {erro: 'fora'};
  const xs = cantos.map(c => c[0]), ys = cantos.map(c => c[1]);
  const bx0 = Math.floor(Math.min(...xs)), by0 = Math.floor(Math.min(...ys)), bx1 = Math.ceil(Math.max(...xs)), by1 = Math.ceil(Math.max(...ys));
  if (bx0 < 0 || by0 < 0 || bx1 > cw || by1 > ch) return {erro: 'fora'};
  if (bx1 - bx0 < 120) return {erro: 'longe'};
  const bw = bx1 - bx0, bh = by1 - by0, px = new Uint8Array(bw * bh * 4);
  gl.readPixels(bx0, by0, bw, bh, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const L = new Float32Array(RW * RH), du = W / RW, dv = H / RH;
  for (let j = 0; j < RH; j++) for (let i = 0; i < RW; i++) {
    const [x, y] = P(R.x0 + (i + .5) * du, R.y0 + (j + .5) * dv);
    const k = ((Math.min(bh - 1, Math.max(0, y - by0 | 0))) * bw + Math.min(bw - 1, Math.max(0, x - bx0 | 0))) * 4;
    L[j * RW + i] = Math.min(px[k], px[k + 1], px[k + 2]); // menor canal: caneta azul conta como tinta
  }
  const rgba = new Uint8ClampedArray(RW * RH * 4), FX = 6;
  let tinta = 0;
  for (let f = 0; f < FX; f++) {
    const i0 = f * RW / FX | 0, i1 = (f + 1) * RW / FX | 0, vals = [];
    for (let j = 0; j < RH; j += 2) for (let i = i0; i < i1; i += 2) vals.push(L[j * RW + i]);
    vals.sort((a, b) => a - b);
    const ref = Math.max(60, vals[vals.length * .85 | 0]);
    for (let j = 0; j < RH; j++) for (let i = i0; i < i1; i++) {
      const n = j * RW + i, t = Math.min(1, Math.max(0, (.72 * ref - L[n]) / (.2 * ref)));
      rgba[n * 4] = 20; rgba[n * 4 + 1] = 24; rgba[n * 4 + 2] = 43; rgba[n * 4 + 3] = t * 255; tinta += t > .5;
    }
  }
  const c = document.createElement('canvas'); c.width = RW; c.height = RH;
  c.getContext('2d').putImageData(new ImageData(rgba, RW, RH), 0, 0);
  return {tinta: tinta / (RW * RH), traco: c};
}

// Boneco: cabeça e ombros brancos (a guia da carta) + o traço lido por cima.
function boneco(traco) {
  const c = document.createElement('canvas'), x = c.getContext('2d'); c.width = W; c.height = H;
  x.fillStyle = '#fffdf6'; x.strokeStyle = '#203b80'; x.lineWidth = 7;
  x.beginPath(); x.moveTo(OMBRO.x0, H); x.bezierCurveTo(OMBRO.x0, OMBRO.topo + 52, CAB.x - 95, OMBRO.topo, CAB.x, OMBRO.topo);
  x.bezierCurveTo(CAB.x + 95, OMBRO.topo, OMBRO.x1, OMBRO.topo + 52, OMBRO.x1, H); x.closePath(); x.fill(); x.stroke();
  x.beginPath(); x.ellipse(CAB.x, CAB.y, CAB.rx, CAB.ry, 0, 0, 2 * Math.PI); x.fill(); x.stroke();
  x.imageSmoothingEnabled = true; x.drawImage(traco, 0, 0, W, H);
  return c;
}

export function criarRetrato({estado, demo}) {
  if (!document.querySelector('#css-retrato')) { const s = document.createElement('style'); s.id = 'css-retrato'; s.textContent = CSS; document.head.append(s); }
  const el = document.createElement('section'); el.className = 'e1 retrato'; el.dataset.estacao = 'frente';
  el.innerHTML = `<div class="ret-area"></div><p class="leitura-status" role="status"></p><div class="ret-rodape"><div class="fala-slot"></div><div class="foto-convite" hidden><button class="escolher-foto">📸 Tirar outra foto</button><div class="album"></div><a class="btn-caderno" href="../?album=1">Ver meu álbum e enviar à recepção</a><a class="btn-caderno btn-vip" href="../#vip">Receber as ofertas da Black</a></div></div>`;
  window.Dados?.grupo().then(link => { if (link) { const a = el.querySelector('.btn-vip'); a.href = link; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Entrar no grupo VIP'; } });
  const q = s => el.querySelector(s), teste = demo || new URLSearchParams(location.search).get('retrato') === '1';
  const liberado = () => teste || estado.valor.concluidas.includes(5);
  let seguidas = 0, lido = false, boca, balanco, tempoFala, tempoRevelacao;
  el.limpar = () => { clearTimeout(tempoFala); clearTimeout(tempoRevelacao); clearInterval(boca); balanco?.cancel(); for (const a of el.getAnimations?.({subtree: true}) || []) a.cancel(); };
  const status = t => { q('.leitura-status').textContent = t; q('.leitura-status').hidden = !t; };

  function avaliar(r) {
    if (lido || !liberado()) return false;
    if (r.erro) { seguidas = 0; status(r.erro === 'longe' ? 'CHEGUE MAIS PERTO' : 'MOSTRE O RETRATO INTEIRO'); return false; }
    if (r.tinta < TINTA_MIN) { seguidas = 0; status('DESENHE OS TRAÇOS NO ROSTO'); return false; }
    status('LENDO O RETRATO…');
    if (++seguidas < 3) return false;
    lido = true; ganharVida(r.traco); return true;
  }

  function ganharVida(traco) {
    el.classList.add('lido'); status(''); navigator.vibrate?.(60);
    const img = boneco(traco), vivo = document.createElement('div'); vivo.className = 'ret-vivo';
    const topo = document.createElement('canvas'), queixo = document.createElement('canvas');
    topo.className = 'ret-topo'; queixo.className = 'ret-queixo';
    topo.width = queixo.width = W; topo.height = BOCA; queixo.height = H - BOCA;
    topo.style.height = BOCA / H * 100 + '%'; queixo.style.height = (H - BOCA) / H * 100 + '%';
    topo.getContext('2d').drawImage(img, 0, 0); queixo.getContext('2d').drawImage(img, 0, -BOCA);
    vivo.innerHTML = '<div class="ret-sombra"></div>'; vivo.append(topo, queixo);
    el.append(vivo);
    // Salta do papel (translateZ só aparece em AR; na demo vira um zoom).
    vivo.animate([{transform: 'translateZ(0) scale(1)', opacity: .2}, {transform: 'translateZ(140px) translateY(-30px) scale(1.18)', opacity: 1}],
      {duration: 1100, easing: 'cubic-bezier(.2,1.6,.4,1)', fill: 'forwards'});
    balanco = topo.animate([{transform: 'rotate(-2deg)'}, {transform: 'rotate(2deg)'}], {duration: 900, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out'});
    let aberta = false;
    boca = setInterval(() => { aberta = !aberta; queixo.style.transform = aberta ? 'translateY(7%)' : 'none'; }, 140);
    tempoFala = setTimeout(() => { if (!el.isConnected) return; sequencia(falasSuspeito.map(texto => ({texto, quem: 'Suspeito'})), () => {
      clearInterval(boca); balanco.cancel(); if (!el.isConnected) return; queixo.style.transform = 'none'; tirarDisfarce(vivo, img);
    }); }, 900);
  }

  function tirarDisfarce(vivo, img) {
    if (!el.isConnected) return;
    const url = img.toDataURL('image/png'), C = 6, L = 7;
    enviarTela(url);
    vivo.querySelectorAll('canvas').forEach(c => c.remove());
    const be = document.createElement('img'); be.className = 'ret-be'; be.src = '../assets/be-cabeca.png'; be.alt = 'Bê'; vivo.append(be);
    for (let j = 0; j < L; j++) for (let i = 0; i < C; i++) {
      const caco = document.createElement('div'); caco.className = 'ret-caco';
      Object.assign(caco.style, {left: i / C * 100 + '%', top: j / L * 100 + '%', width: 100 / C + '%', height: 100 / L + '%', backgroundImage: `url(${url})`, backgroundSize: `${C * 100}% ${L * 100}%`, backgroundPosition: `${i / (C - 1) * 100}% ${j / (L - 1) * 100}%`});
      vivo.append(caco);
      caco.animate([{transform: 'none', opacity: 1}, {transform: `translate(${(Math.random() - .5) * 120}px,${260 + Math.random() * 160}px) rotate(${(Math.random() - .5) * 220}deg)`, opacity: 0}],
        {duration: 1200, delay: 300 + Math.random() * 500 + j * 60, easing: 'cubic-bezier(.5,0,.9,.6)', fill: 'forwards'});
    }
    vivo.animate([{transform: 'translateZ(140px) translateY(-30px) scale(1.18) rotate(0)'}, {transform: 'translateZ(140px) translateY(-30px) scale(1.18) rotate(4deg)'}, {transform: 'translateZ(140px) translateY(-30px) scale(1.18) rotate(-4deg)'}],
      {duration: 160, iterations: 3});
    be.animate([{opacity: 0, transform: 'scale(.4)'}, {opacity: 1, transform: 'scale(1.08)'}, {opacity: 1, transform: 'scale(1)'}], {duration: 900, delay: 900, fill: 'forwards'});
    tempoRevelacao = setTimeout(() => {
      if (!el.isConnected) return;
      be.animate([{transform: 'translateY(0)'}, {transform: 'translateY(-6%)'}], {duration: 700, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out', composite: 'add'});
      estado.fechar(); if (!el.isConnected) return; sequencia(historia.final.slice(1), () => { if (!el.isConnected) return; q('.foto-convite').hidden = false; mostrarAlbum(); fotoTurma(); });
    }, 1900);
  }

  function mostrarAlbum() {
    q('.album').innerHTML = estado.valor.fotos.map((img, i) => `<a download="caso-black-${i + 1}.jpg" href="${img}"><img src="${img}" alt="Foto ${i + 1} da turma"></a>`).join('');
  }
  // Caso fechado: a câmera abre direto pra foto da turma (sem perguntar); o botão tira outras.
  async function fotoTurma() {
    if (!el.isConnected) return;
    const dado = await tirarFoto({titulo: 'FOTO DA TURMA · CASO FECHADO', legenda: 'CASO BLACK · CASO FECHADO!'});
    if (!dado || !el.isConnected) return; estado.foto(dado); mostrarAlbum(); falar('Foto guardada no álbum do caso! Toca nela pra salvar no celular.', 'Gabi');
  }
  q('.escolher-foto').onclick = fotoTurma;

  el.avaliar = avaliar;
  el.podeLer = () => !lido && liberado();
  if (estado.valor.final && !teste) {
    lido = true; el.classList.add('lido'); status('');
    const vivo = document.createElement('div'); vivo.className = 'ret-vivo'; vivo.innerHTML = '<img class="ret-be" src="../assets/be-cabeca.png" alt="Bê" style="opacity:1">'; el.append(vivo);
    const f = historia.final.at(-1); falar(f.texto, f.quem); q('.foto-convite').hidden = false; mostrarAlbum();
  } else if (!liberado()) { status('FALTAM TESTEMUNHAS'); falar('O retrato ainda tá incompleto. Termina as cinco placas e volta aqui!'); }
  else { status('MOSTRE O RETRATO'); falar('Retrato falado pronto? Mira a câmera no rosto e segura firme!'); if (demo) montarDemo(); }

  function montarDemo() {
    const area = document.createElement('div'); area.className = 'demo-retrato';
    area.innerHTML = '<canvas aria-label="Retrato de teste"></canvas><button class="ler-retrato">Ler retrato</button>';
    q('.ret-area').style.overflow = 'visible'; q('.ret-area').append(area);
    const tela = area.querySelector('canvas'); tela.width = W; tela.height = H;
    const x = document.createElement('canvas').getContext('2d'); x.canvas.width = IMG.w; x.canvas.height = IMG.h;
    x.fillStyle = '#fffdf6'; x.fillRect(0, 0, IMG.w, IMG.h);
    x.save(); x.translate(R.x0, R.y0); x.fillStyle = '#eee'; x.strokeStyle = '#d4d4d4'; x.lineWidth = 3;
    x.beginPath(); x.ellipse(CAB.x, CAB.y, CAB.rx, CAB.ry, 0, 0, 2 * Math.PI); x.fill(); x.stroke();
    x.strokeStyle = '#203b80'; x.fillStyle = '#203b80'; x.lineWidth = 9; x.lineCap = 'round';
    x.fillRect(CAB.x - 130, CAB.y - CAB.ry - 14, 260, 20); x.fillRect(CAB.x - 75, CAB.y - CAB.ry - 84, 150, 74); // chapéu
    const oy = CAB.y - 30; x.beginPath(); x.ellipse(CAB.x - 48, oy, 36, 26, 0, 0, 7); x.ellipse(CAB.x + 48, oy, 36, 26, 0, 0, 7); x.fill(); x.fillRect(CAB.x - 14, oy - 4, 28, 8); // óculos
    const by = CAB.y + 45; x.beginPath(); x.moveTo(CAB.x - 75, by); x.quadraticCurveTo(CAB.x, by - 50, CAB.x + 75, by); x.quadraticCurveTo(CAB.x, by - 15, CAB.x - 75, by); x.fill(); // bigode
    x.beginPath(); x.arc(CAB.x, CAB.y + 55, 45, .3, Math.PI - .3); x.stroke(); // sorriso
    const gy = CAB.y + CAB.ry + 22; x.beginPath(); x.moveTo(CAB.x, gy); x.lineTo(CAB.x - 45, gy - 22); x.lineTo(CAB.x - 45, gy + 22); x.closePath(); x.moveTo(CAB.x, gy); x.lineTo(CAB.x + 45, gy - 22); x.lineTo(CAB.x + 45, gy + 22); x.closePath(); x.fill(); // gravata
    x.restore();
    tela.getContext('2d').drawImage(x.canvas, R.x0, R.y0, W, H, 0, 0, W, H);
    area.querySelector('.ler-retrato').onclick = () => {
      area.remove(); q('.ret-area').style.overflow = '';
      const pixels = x.getImageData(0, 0, IMG.w, IMG.h).data;
      const gl = {readPixels(bx, by, w, h, f, t, destino) { for (let j = 0; j < h; j++) { const inicio = ((IMG.h - 1 - by - j) * IMG.w + bx) * 4; destino.set(pixels.subarray(inicio, inicio + w * 4), j * w * 4); } }};
      const M = [2, 0, 0, 0, 0, 1.5, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], r = lerRetrato(gl, M, IMG.w, IMG.h);
      el.ultimaLeitura = {tinta: r.tinta};
      for (let i = 0; i < 3; i++) avaliar(r);
    };
  }
  return el;
}

// Telão (tv.html): guarda os últimos retratos; o telão no mesmo navegador recebe pelo evento de storage.
function enviarTela(img) {
  try {
    const lista = JSON.parse(localStorage.getItem('cb_tv') || '[]');
    localStorage.setItem('cb_tv', JSON.stringify([...lista, {id: Date.now() + '-' + Math.random().toString(36).slice(2, 6), img}].slice(-12)));
  } catch (e) {}
  // Telão em rede (tv.php): JPEG leve de até 432 px, fundo branco por baixo da transparência.
  const im = new Image();
  im.onload = () => {
    const k = Math.min(1, 432 / im.width), c = document.createElement('canvas'), x = c.getContext('2d');
    c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
    x.fillStyle = '#fffdf6'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
    c.toBlob(b => b && fetch('./tv.php', {method: 'POST', body: b, headers: {'Content-Type': 'image/jpeg'}, keepalive: true}).catch(() => {}), 'image/jpeg', .8);
  };
  im.src = img;
}
