/* Caso Black · chave do arquivo: lê a chave desenhada no verso da carta e a anima em AR (8th Wall).
   ?demo roda sem câmera: verso + desenho de exemplo numa cena three.js, com o mesmo leitor e a mesma animação.
   ?codigo=CBBC muda o desenho do demo (C = dente pra cima, B = pra baixo). */
import * as THREE from 'three';
import {lerChave} from './leitor.js';
import {criarCena, DUR} from './cena.js';
import {criarAncora} from '../ancora.js';
import {CERTO, IMG, DENTES, HASTE} from './layout.js';
window.THREE = THREE; // XR8.Threejs usa o THREE global

const $ = s => document.querySelector(s);
const Q = new URLSearchParams(location.search);
const DEMO = Q.has('demo');
const est = window.__chave = {estado: 'carregando', leituras: [], demo: DEMO};
const status = t => { $('#status').textContent = t; $('#status').hidden = !t; };
const carregarImg = src => new Promise((ok, falha) => { const i = new Image(); i.onload = () => ok(i); i.onerror = falha; i.src = src; });

const LUCAS = {feliz: 5, surpresa: 3, duvida: 1, serio: 2, piscada: 9};
function fala(t, tit, humor = 'duvida') {
  const B = $('#balao');
  B.querySelector('.beQ').innerHTML = `<img src="../assets/cab/lucas-${String(LUCAS[humor]).padStart(2, '0')}.webp?v=2" alt="">`;
  $('#beTx').innerHTML = (tit ? `<b>${tit}</b>` : '') + t;
  B.classList.add('on'); clearTimeout(B._t);
  B._t = setTimeout(() => B.classList.remove('on'), Math.max(4500, t.length * 70));
}
$('#balao').onclick = () => $('#balao').classList.remove('on');

// Inventário: a chave desenhada fica guardada no aparelho (o "bolso" impresso no verso).
const lerMochila = () => { try { return JSON.parse(localStorage.getItem('cb-chave') || 'null'); } catch { return null; } };
function guardar(img, codigo) {
  try { localStorage.setItem('cb-chave', JSON.stringify({codigo, img: img.toDataURL('image/png'), em: Date.now()})); } catch {}
  mostrarMochila();
}
function mostrarMochila() {
  const m = lerMochila();
  $('#mochila').hidden = !m;
  if (m) $('#mochila img').src = m.img;
}
if (Q.has('nova')) try { localStorage.removeItem('cb-chave'); } catch {}
mostrarMochila();

const mostrarDentes = d => { $('#dentes').innerHTML = d.map((c, i) => `<span class="${c === '?' ? '' : 'ok'}">${i + 1}${c === 'C' ? '↑' : c === 'B' ? '↓' : '?'}</span>`).join(''); };

// Decisão: 3 leituras iguais seguidas; a mesma chave errada não dispara de novo.
let cena, anterior = '', iguais = 0, ultimoErrado = null;
function avaliar(r) {
  est.ultima = {codigo: r.codigo, haste: r.haste, erro: r.erro};
  if (r.erro) { iguais = 0; return status(r.erro === 'longe' ? 'Chegue mais perto da chave' : 'Enquadre a chave inteira'); }
  mostrarDentes(r.dentes);
  if (r.codigo.includes('?') || r.haste < 0.08) { iguais = 0; return status('Desenhe a haste e os 4 dentes (pra cima ou pra baixo)'); }
  iguais = r.codigo === anterior ? iguais + 1 : 1; anterior = r.codigo;
  if (iguais < 3) return status('Segure firme… lendo a chave');
  if (r.codigo === ultimoErrado) return status('Essa chave emperrou. Desenhe de novo na folha extra.');
  iguais = 0; disparar(r);
}

function disparar(r) {
  const ok = r.codigo === CERTO;
  est.estado = 'animando'; est.leituras.push(r.codigo); status('');
  $('#dentes').innerHTML = '';
  const st = cena.iniciar(r, ok, () => {
    if (ok) {
      guardar(st, r.codigo); est.estado = 'aberto'; cena.mostrarAberto();
      fala('Abriu! A pista apareceu em cima do cadeado, e a sua chave foi pro bolso da mochila. Leve a carta: ela abre a próxima estação.', 'BOA, DETETIVE!', 'feliz');
    } else {
      ultimoErrado = r.codigo; est.estado = 'lendo'; cena.esconder();
      const certos = [...r.codigo].filter((c, i) => c === CERTO[i]).length;
      fala(`Emperrou! ${certos} de 4 dentes estão certos. Relê a charada e desenha de novo na folha extra.`, 'HMMM…', 'duvida');
    }
  });
}

/* ---------- AR (8th Wall) ---------- */
const ancora = criarAncora();
const bruto = new THREE.Object3D(); // pose crua da folha (leitura); a exibição usa a âncora suavizada
let raiz, folha, gl, alvoLargura = 1, ultimo = 0, ultLeitura = 0;
const M = new THREE.Matrix4();
function matriz(camera, obj, larg) {
  obj.updateMatrixWorld();
  return M.copy(camera.projectionMatrix).multiply(camera.matrixWorldInverse).multiply(obj.matrixWorld).multiply(new THREE.Matrix4().makeScale(larg, larg, larg)).elements;
}

const leitorMod = {
  name: 'leitorchave',
  onAttach({GLctx}) { gl = GLctx; },
  onRender() { // entre o desenho da câmera e o da cena: o buffer só tem a imagem da câmera
    if (est.estado !== 'lendo' || !ancora.visto) return;
    const agora = performance.now();
    if (agora - ultLeitura < 220) return;
    ultLeitura = agora;
    const {camera} = XR8.Threejs.xrScene(), c = $('#camera');
    const fb = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    try { avaliar(lerChave(gl, matriz(camera, bruto, alvoLargura), c.width, c.height)); } finally { gl.bindFramebuffer(gl.FRAMEBUFFER, fb); }
  },
};

const pose = d => { bruto.position.set(d.position.x, d.position.y, d.position.z); bruto.quaternion.set(d.rotation.x, d.rotation.y, d.rotation.z, d.rotation.w); bruto.scale.setScalar(d.scale); };
const modulo = {
  name: 'casochave',
  onStart() {
    const {scene, camera} = XR8.Threejs.xrScene();
    camera.position.set(0, 1.6, 0);
    XR8.XrController.updateCameraProjectionMatrix({origin: camera.position, facing: camera.quaternion});
    raiz = new THREE.Group(); raiz.visible = false; scene.add(raiz);
    folha = new THREE.Group(); raiz.add(folha);
    cena = criarCena(folha, est.cadeado);
    est.estado = 'lendo';
    status('Aponte para o verso da carta');
  },
  onUpdate() {
    const agora = performance.now(), dt = Math.min(0.1, (agora - (ultimo || agora)) / 1000);
    ultimo = agora;
    const p = ancora.passo(dt);
    if (!p) return;
    raiz.position.set(...p.p); raiz.quaternion.set(...p.q); raiz.scale.setScalar(p.s);
    folha.scale.setScalar(alvoLargura); raiz.visible = true;
    cena.passo(dt);
  },
  listeners: [
    {event: 'reality.imagefound', process: ({detail}) => { alvoLargura = detail.scaledWidth; pose(detail); ancora.found(detail); }},
    {event: 'reality.imageupdated', process: ({detail}) => { pose(detail); ancora.updated(detail); }},
    {event: 'reality.imagelost', process: () => { ancora.lost(); if (est.estado === 'lendo') status('Aponte para o verso da carta'); }},
  ],
  onCameraStatusChange({status: s}) {
    if (s === 'requesting') status('Permita o acesso à câmera…');
    if (s === 'failed' || s === 'denied') erro('Sem acesso à câmera. Libere a câmera nas permissões do navegador e recarregue.');
  },
  onException(e) { console.error(e); erro('A lupa travou. Recarregue a página.'); },
};
function erro(t) { $('#erro p').textContent = t; $('#erro').hidden = false; }

async function configurar() {
  const json = await (await fetch('./alvos/verso-teste.json')).json();
  json.imagePath = new URL('./alvos/verso-teste_luminance.png', location.href).href;
  XR8.XrController.configure({imageTargetData: [json], disableWorldTracking: false});
}

let rodando = false;
async function abrir() {
  if (rodando) return;
  if (!XR8.XrDevice.isDeviceBrowserCompatible()) return erro('Este navegador não abre a lupa. Use o Chrome (Android) ou o Safari (iPhone).');
  rodando = true; $('#inicio').hidden = true;
  await configurar();
  XR8.addCameraPipelineModules([
    XR8.FullWindowCanvas.pipelineModule(),
    XR8.GlTextureRenderer.pipelineModule(),
    leitorMod,
    XR8.Threejs.pipelineModule(),
    XR8.XrController.pipelineModule(),
    modulo,
  ]);
  XR8.run({canvas: $('#camera'), allowedDevices: XR8.XrConfig.device().MOBILE_AND_HEADSETS});
}

/* ---------- Demo sem câmera ---------- */
function desenharChave(x, codigo) { // traço de caneta azul, como uma criança faria
  x.strokeStyle = '#1d2f7a'; x.lineWidth = 10; x.lineCap = x.lineJoin = 'round';
  let s = 7; const r = () => ((s = s * 16807 % 2147483647) / 2147483647 - 0.5) * 6;
  const linha = pts => { x.beginPath(); pts.forEach(([a, b], i) => x[i ? 'lineTo' : 'moveTo'](a + r(), b + r())); x.stroke(); };
  x.beginPath(); x.ellipse(232, 470, 92, 98, 0.1, 0, Math.PI * 2); x.stroke();
  x.beginPath(); x.ellipse(232, 470, 34, 36, 0, 0, Math.PI * 2); x.stroke();
  linha([[322, 450], [882, 452], [884, 490], [322, 488]]);
  [...codigo].forEach((c, i) => {
    const d = DENTES[i][c === 'C' ? 'cima' : 'baixo'], y0 = c === 'C' ? 452 : 490, y1 = c === 'C' ? d.y0 + 8 : d.y1 - 8;
    linha([[d.x0 + 4, y0], [d.x0 + 4, y1], [d.x1 - 4, y1], [d.x1 - 4, y0]]);
    for (let k = d.x0 + 14; k < d.x1 - 8; k += 14) linha([[k, y0], [k, y1]]);
  });
}

async function demo() {
  $('#inicio').hidden = true; $('#credito').hidden = true;
  const verso = await carregarImg('./alvos/verso-teste.png');
  const papel = document.createElement('canvas'); papel.width = IMG.w; papel.height = IMG.h;
  const px = papel.getContext('2d'); px.drawImage(verso, 0, 0);
  desenharChave(px, (Q.get('codigo') || CERTO).toUpperCase());
  const canvas = $('#camera');
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true});
  renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(innerWidth, innerHeight, false);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#3b2c20');
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.01, 20);
  camera.position.set(0.02, -0.55, 2.0); camera.up.set(0, 1, 0); camera.lookAt(0.02, 0.12, 0);
  folha = new THREE.Group(); scene.add(folha);
  const t = new THREE.CanvasTexture(papel); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  folha.add(new THREE.Mesh(new THREE.PlaneGeometry(1, IMG.h / IMG.w), new THREE.MeshBasicMaterial({map: t})));
  cena = criarCena(folha, est.cadeado);
  const ajustar = () => { renderer.setSize(innerWidth || 1, innerHeight || 1, false); camera.aspect = (innerWidth || 1) / (innerHeight || 1); camera.updateProjectionMatrix(); };
  ajustar(); addEventListener('resize', ajustar);
  const desenhar = () => renderer.render(scene, camera);
  est.estado = 'lendo';
  est.seek = s => { est.pausado = true; cena.em(s); desenhar(); return cena.t; };
  let antes = performance.now();
  renderer.setAnimationLoop(agora => {
    const dt = Math.min(0.1, (agora - antes) / 1000); antes = agora;
    if (est.estado === 'lendo' && agora - ultLeitura > 220) {
      ultLeitura = agora;
      cena.grupo.visible = false; desenhar();
      avaliar(lerChave(renderer.getContext(), matriz(camera, folha, 1), canvas.width, canvas.height));
    }
    if (!est.pausado) cena.passo(dt);
    desenhar();
  });
  status('Demo: lendo a chave desenhada');
}

/* ---------- Início ---------- */
carregarImg('../assets/cadeado.png').then(img => {
  est.cadeado = img;
  if (DEMO) return demo().catch(e => { console.error(e); erro('Demo falhou: ' + e.message); });
  const pronto = () => {
    est.xr = true;
    configurar().then(() => { est.configurado = true; }, e => { console.error(e); est.configErro = String(e); });
    $('#abrir').disabled = false; $('#abrir').textContent = 'Abrir lupa';
  };
  window.XR8 ? pronto() : addEventListener('xrloaded', pronto);
  $('#abrir').addEventListener('click', abrir);
});
export {DUR, HASTE};
