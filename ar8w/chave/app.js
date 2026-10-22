/* Caso Black · chave do arquivo: lê a chave desenhada no verso da carta e a anima em AR (8th Wall).
   ?demo roda sem câmera: verso + desenho de exemplo numa cena three.js, com o mesmo leitor e a mesma animação.
   ?codigo=CBBC muda o desenho do demo (C = dente pra cima, B = pra baixo). */
import * as THREE from 'three';
import {lerChave} from './leitor.js';
import {criarCena, DUR} from './cena.js';
import {criarColeta} from './inventario.js';
import {criarAncora} from '../ancora.js';
import {CERTO, IMG, DENTES, HASTE, ARGOLA} from './layout.js';
window.THREE = THREE; // XR8.Threejs usa o THREE global

const $ = s => document.querySelector(s);
const Q = new URLSearchParams(location.search);
const DEMO = Q.has('demo');
const est = window.__chave = {estado: 'carregando', leituras: [], demo: DEMO};
const status = t => { $('#status').textContent = t; $('#status').hidden = !t; };
const carregarImg = src => new Promise((ok, falha) => { const i = new Image(); i.onload = () => ok(i); i.onerror = falha; i.src = src; });

// No verso o balão sobe pro topo para não cobrir a mochila impressa.
function fala(t, tit, opts = {}) {
  const B = $('#balao');
  B.querySelector('.beQ').innerHTML = '<img src="../assets/lucas-detetive.webp" alt="Lucas detetive">';
  $('#beTx').innerHTML = (tit ? `<b>${tit}</b>` : '') + t;
  B.classList.toggle('topo', !!opts.topo); document.body.classList.toggle('balao-topo', !!opts.topo);
  B.classList.add('on'); clearTimeout(B._t);
  B._t = setTimeout(calar, Math.max(4500, t.length * 70));
}
function calar() { $('#balao').classList.remove('on'); document.body.classList.remove('balao-topo'); }
$('#balao').onclick = calar;

// Inventário: a chave desenhada fica guardada no aparelho (o "bolso" impresso no verso).
const lerMochila = () => { try { const m = JSON.parse(localStorage.getItem('cb-chave') || 'null'); return m && /^[CB]{4}$/.test(m.codigo) && typeof m.img === 'string' ? m : null; } catch { return null; } };
function guardar(img, codigo) {
  try { localStorage.setItem('cb-chave', JSON.stringify({codigo, img: img.toDataURL('image/png'), em: Date.now()})); } catch { return false; }
  mostrarMochila();
  return true;
}
function mostrarMochila() {
  const m = lerMochila();
  $('#mochila').hidden = !m;
  if (m) $('#mochila img').src = m.img;
}
if (Q.has('nova')) try { localStorage.removeItem('cb-chave'); } catch {}
mostrarMochila();

let alvoAtual = null, coleta, placaCena, chaveUsada = false;
async function usarNaPlaca() {
  if (chaveUsada || est.estado === 'animando') return;
  const m = lerMochila();
  if (!m || !/^[CB]{4}$/.test(m.codigo) || typeof m.img !== 'string') { est.estado = 'aguardando-chave'; return status('Desenhe e guarde uma chave no verso da carta'); }
  chaveUsada = true;
  try {
    const img = await carregarImg(m.img), traco = document.createElement('canvas');
    traco.width = img.width; traco.height = img.height; traco.getContext('2d').drawImage(img, 0, 0);
    if (alvoAtual !== 'placa-1') { chaveUsada = false; return; }
    const ok = m.codigo === CERTO; est.estado = 'animando'; est.tentativas = (est.tentativas || 0) + 1; status('');
    placaCena.usarChave({traco, papel: [255, 253, 246]}, ok, () => {
      est.estado = ok ? 'aberto' : 'emperrado';
      if (ok) { placaCena.mostrarAberto(); fala('Abriu! Sua chave continua na mochila para a próxima estação.', 'BOA, DETETIVE!'); }
      else { const certos = [...m.codigo].filter((c, i) => c === CERTO[i]).length; fala(`Emperrou! ${certos} de 4 dentes estão certos. Volte ao verso e desenhe outra chave.`, 'HMMM…'); }
    });
  } catch { chaveUsada = false; est.estado = 'aguardando-chave'; status('Não foi possível ler a chave guardada. Leia o verso novamente.'); }
}
function selecionarAlvo(nome) {
  if (!['verso', 'placa-1'].includes(nome)) return false;
  if (alvoAtual === nome) return true;
  coleta?.esconder(); placaCena?.esconder(); alvoAtual = nome; est.alvo = nome; iguais = 0; anterior = ''; chaveUsada = false;
  cena = nome === 'verso' ? coleta : placaCena;
  $('#dentes').innerHTML = '';
  if (nome === 'verso') { est.estado = 'lendo'; status('Aponte para o desenho no verso da carta'); }
  else { placaCena.mostrarFechado(); est.estado = 'aguardando-chave'; usarNaPlaca(); }
  return true;
}

const mostrarDentes = d => { $('#dentes').innerHTML = d.map((c, i) => `<span class="${c === '?' ? '' : 'ok'}">${i + 1}${c === 'C' ? '↑' : c === 'B' ? '↓' : '?'}</span>`).join(''); };

// Coleta: 3 leituras iguais seguidas, sem avaliar a solução da estação.
let cena, anterior = '', iguais = 0;
function avaliar(r) {
  est.ultima = {codigo: r.codigo, haste: r.haste, erro: r.erro};
  if (r.erro) { iguais = 0; return status(r.erro === 'longe' ? 'Chegue mais perto da chave' : 'Enquadre a chave inteira'); }
  mostrarDentes(r.dentes);
  if (r.codigo.includes('?') || r.haste < 0.08) { iguais = 0; return status('Desenhe a haste e os 4 dentes (pra cima ou pra baixo)'); }
  iguais = r.codigo === anterior ? iguais + 1 : 1; anterior = r.codigo;
  if (iguais < 3) return status('Segure firme… lendo a chave');
  iguais = 0; disparar(r);
}

function disparar(r) {
  est.estado = 'animando'; est.leituras.push(r.codigo); status('');
  $('#dentes').innerHTML = '';
  const st = coleta.iniciar(r, () => {
    if (!guardar(st, r.codigo)) { est.estado = 'erro'; return erro('Não foi possível guardar sua ferramenta. Libere o armazenamento do navegador e tente novamente.'); }
    est.estado = 'guardado';
    fala('Ferramenta na mochila! Agora aponte a lupa para a placa da estação.', 'CHAVE GUARDADA', {topo: true});
    status('Chave guardada. Procure a placa da estação.');
  });
}

/* ---------- AR (8th Wall) ---------- */
let ancora = criarAncora();
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
    if (alvoAtual !== 'verso' || est.estado !== 'lendo' || !ancora.visto) return;
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
    coleta = criarColeta(folha); placaCena = criarCena(folha, est.cadeado);
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
    cena?.passo(dt);
  },
  listeners: [
    {event: 'reality.imagefound', process: ({detail}) => { if (!['verso','placa-1'].includes(detail.name)) return; if (detail.name !== alvoAtual) { ancora = criarAncora(); raiz.visible = false; } alvoLargura = detail.scaledWidth; pose(detail); ancora.found(detail); selecionarAlvo(detail.name); }},
    {event: 'reality.imageupdated', process: ({detail}) => { if (detail.name !== alvoAtual) return; alvoLargura = detail.scaledWidth; pose(detail); ancora.updated(detail); }},
    {event: 'reality.imagelost', process: ({detail}) => { if (detail.name !== alvoAtual) return; ancora.lost(); if (est.estado === 'lendo') status('Aponte para o verso da carta'); }},
  ],
  onCameraStatusChange({status: s}) {
    if (s === 'requesting') status('Permita o acesso à câmera…');
    if (s === 'failed' || s === 'denied') erro('Sem acesso à câmera. Libere a câmera nas permissões do navegador e recarregue.');
  },
  onException(e) { console.error(e); erro('A lupa travou. Recarregue a página.'); },
};
function erro(t) { $('#erro p').textContent = t; $('#erro').hidden = false; }

async function configurar() {
  const alvos = await Promise.all(['verso-teste', 'placa-1'].map(async nome => {
    const json = await (await fetch(`./alvos/${nome}.json`)).json();
    json.imagePath = new URL(`./alvos/${nome}_luminance.png`, location.href).href;
    return json;
  }));
  XR8.XrController.configure({imageTargetData: alvos, disableWorldTracking: false});
  est.alvos = alvos.map(a => a.name);
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
function desenharChave(x, codigo) {
  const t = HASTE.y0 + 8, b = HASTE.y1 - 8, fim = HASTE.x1, A = ARGOLA, ang = Math.asin((b - t) / 2 / A.r);
  x.strokeStyle = '#203b80'; x.lineWidth = 11; x.lineCap = x.lineJoin = 'round';
  x.beginPath(); x.moveTo(A.x + A.r * Math.cos(ang), t);
  DENTES.forEach((d,i) => { if(codigo[i] !== 'C') return; x.lineTo(d.cima.x0+6,t); x.lineTo(d.cima.x0+6,d.cima.y0+12); x.lineTo(d.cima.x1-6,d.cima.y0+12); x.lineTo(d.cima.x1-6,t); });
  x.lineTo(fim-12,t); x.quadraticCurveTo(fim,t,fim,t+12); x.lineTo(fim,b-12); x.quadraticCurveTo(fim,b,fim-12,b);
  [...DENTES].reverse().forEach((d,j) => { if(codigo[3-j] !== 'B') return; x.lineTo(d.baixo.x1-6,b); x.lineTo(d.baixo.x1-6,d.baixo.y1-12); x.lineTo(d.baixo.x0+6,d.baixo.y1-12); x.lineTo(d.baixo.x0+6,b); });
  x.lineTo(A.x + A.r * Math.cos(ang), b); x.arc(A.x,A.y,A.r,ang,2*Math.PI-ang); x.closePath(); x.stroke();
  x.beginPath(); x.arc(A.x,A.y,A.furo,0,Math.PI*2); x.stroke();
}

async function demo() {
  $('#inicio').hidden = true; $('#credito').hidden = true;
  const verso = await carregarImg('./alvos/verso-teste.png');
  const papel = document.createElement('canvas'); papel.width = IMG.w; papel.height = IMG.h;
  const px = papel.getContext('2d'); px.drawImage(verso, 0, 0);
  if (!Q.has('sem-desenho')) desenharChave(px, (Q.get('codigo') || CERTO).toUpperCase());
  const canvas = $('#camera');
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true});
  renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(innerWidth, innerHeight, false);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#3b2c20');
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.01, 20);
  camera.position.set(0.02, -0.55, 2.0); camera.up.set(0, 1, 0); camera.lookAt(0.02, 0.12, 0);
  folha = new THREE.Group(); scene.add(folha);
  const t = new THREE.CanvasTexture(papel); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  folha.add(new THREE.Mesh(new THREE.PlaneGeometry(1, IMG.h / IMG.w), new THREE.MeshBasicMaterial({map: t})));
  coleta = criarColeta(folha); placaCena = criarCena(folha, est.cadeado);
  const placa = await carregarImg('./alvos/placa-1.png');
  const trocar = nome => {
    if (!['verso','placa-1'].includes(nome)) return;
    const mesh = folha.children[0]; mesh.material.map.dispose();
    const nt = new THREE.CanvasTexture(nome === 'verso' ? papel : placa); nt.colorSpace = THREE.SRGBColorSpace; nt.anisotropy = 8;
    mesh.material.map = nt; mesh.material.needsUpdate = true;
    selecionarAlvo(nome);
  };
  est.alvoDemo = trocar;
  $('#estacao-demo').hidden = false;
  $('#estacao-demo').onclick = () => trocar(alvoAtual === 'verso' ? 'placa-1' : 'verso');
  const ajustar = () => { renderer.setSize(innerWidth || 1, innerHeight || 1, false); camera.aspect = (innerWidth || 1) / (innerHeight || 1); camera.updateProjectionMatrix(); };
  ajustar(); addEventListener('resize', ajustar);
  const desenhar = () => renderer.render(scene, camera);
  trocar(Q.get('alvo') === 'placa-1' ? 'placa-1' : 'verso');
  est.seek = s => { est.pausado = true; cena.em(s); desenhar(); return cena.t; };
  let antes = performance.now();
  renderer.setAnimationLoop(agora => {
    const dt = Math.min(0.1, (agora - antes) / 1000); antes = agora;
    if (alvoAtual === 'verso' && est.estado === 'lendo' && agora - ultLeitura > 220) {
      ultLeitura = agora;
      cena.grupo.visible = false; desenhar();
      avaliar(lerChave(renderer.getContext(), matriz(camera, folha, 1), canvas.width, canvas.height));
    }
    if (!est.pausado) cena.passo(dt);
    desenhar();
  });
  if (alvoAtual === 'verso') status('Demo: lendo a chave desenhada');
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
