/* Jogo único: quadro CSS3D no alvo; demo usa os mesmos painéis sem ligar câmera. */
import * as THREE from 'three';
import {CSS3DRenderer, CSS3DObject} from './vendor/CSS3DRenderer.js';
import {criarAncora} from './ancora.js';
import {criarEstacao1, CSS} from './estacao1.js';
import {criarEstacao2} from './estacao2.js';
import {criarEstacao3} from './estacao3.js';
import {criarEstacao4} from './estacao4.js';
import {criarEstacao5} from './estacao5.js';
import {criarVerso} from './verso.js';
import {criarEstado} from './estado.js';
import {criarMochila} from './mochila.js';
import {falar, sequencia, calar} from './fala.js';
import {historia} from './historia.js';
import {lerChave} from './chave/leitor.js';
import {CSS_INV} from './investigador.js';
window.THREE = THREE;
const $ = s => document.querySelector(s), Q = new URLSearchParams(location.search);
const balao = $('#balao'); // CSS3D pode manter o DOM fora do documento até o próximo render.
const DEMO = Q.get('demo'), estado = criarEstado();
if (Q.get('reset') === '1') { estado.reset(); $('#reset').hidden = false; }
$('#reset').onclick = () => { estado.reset(); location.reload(); };
const style = document.createElement('style'); style.textContent = CSS + CSS_INV; document.head.append(style);
const status = t => { $('#status').textContent = t; $('#status').hidden = !t; };
const est = window.__ar8w = {estado, eventos: [], demo: !!DEMO};
let ancora = criarAncora(), painel, alvoAtual, alvoLargura = 1, cssScene, cssRenderer, raiz, quadroObj, ultimo = 0, rodando = false, gl, ultimaLeitura = 0;
est.ancora = ancora;
const bruto = new THREE.Object3D(), M = new THREE.Matrix4(), escala = new THREE.Matrix4(), tmp = new THREE.Vector3();
const mochila = criarMochila(estado, () => painel, item => falar(item === 'lente' ? historia.estacoes[4]['sem lente'] : historia.estacoes[5]['sem chave']));
const criar = [criarEstacao1, criarEstacao2, criarEstacao3, criarEstacao4, criarEstacao5];
function selecionar(nome) {
  if (!/^(placa-[1-5]|verso)$/.test(nome)) return false;
  if (alvoAtual === nome) return true;
  calar(); $('#fala-espera').append(balao); painel?.limpar?.();
  if (quadroObj) raiz.remove(quadroObj);
  painel?.remove(); alvoAtual = nome; est.alvo = nome;
  const ctx = {estado, demo: !!DEMO, premiar: (item, origem) => mochila.premiar(item, origem), onGanhar: n => { est.eventos.push('concluiu-' + n); }};
  painel = nome === 'verso' ? criarVerso(ctx) : criar[Number(nome.slice(-1)) - 1](ctx);
  painel.querySelector('.fala-slot').append(balao); est.quadro = painel;
  if (DEMO) { $('#demo-palco').append(painel); redimensionarDemo(); }
  else {
    quadroObj = new CSS3DObject(painel); quadroObj.position.z = .01; quadroObj.scale.setScalar(alvoLargura / 600); raiz.add(quadroObj);
    painel.style.visibility = 'hidden'; ancora = criarAncora(); est.ancora = ancora; raiz.visible = false;
  }
  return true;
}
function montarCss() {
  cssScene = new THREE.Scene(); cssRenderer = new CSS3DRenderer({element: $('#css3d')}); cssRenderer.setSize(innerWidth, innerHeight);
  raiz = new THREE.Object3D(); raiz.visible = false; cssScene.add(raiz);
}
function redimensionarDemo() {
  if (!DEMO || !painel) return;
  const k = Math.min((innerWidth - 12) / 600, (innerHeight - 118) / 800);
  $('#demo-palco').style.width = 600 * k + 'px'; $('#demo-palco').style.height = 800 * k + 'px';
  painel.style.transform = `scale(${k})`; painel.style.transformOrigin = '0 0';
}
function receber(detail, found) {
  if (!/^(placa-[1-5]|verso)$/.test(detail.name)) return;
  if (!found && detail.name !== alvoAtual) return;
  alvoLargura = detail.scaledWidth || 1; selecionar(detail.name);
  bruto.position.set(detail.position.x, detail.position.y, detail.position.z); bruto.quaternion.set(detail.rotation.x, detail.rotation.y, detail.rotation.z, detail.rotation.w); bruto.scale.setScalar(detail.scale);
  if (found) { ancora.found(detail); est.eventos.push('found-' + detail.name); } else ancora.updated(detail);
  status('');
}
const leitorMod = {
  name: 'cb8w-leitor', onAttach({GLctx}) { gl = GLctx; },
  onRender() {
    if (alvoAtual !== 'verso' || !painel?.podeLer?.() || !ancora.visto || !gl) return;
    const agora = performance.now(); if (agora - ultimaLeitura < 240) return; ultimaLeitura = agora;
    const {camera} = XR8.Threejs.xrScene(), c = $('#camera'); bruto.updateMatrixWorld();
    M.copy(camera.projectionMatrix).multiply(camera.matrixWorldInverse).multiply(bruto.matrixWorld).multiply(escala.makeScale(alvoLargura, alvoLargura, alvoLargura));
    const fb = gl.getParameter(gl.FRAMEBUFFER_BINDING); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    try { painel.avaliar(lerChave(gl, M.elements, c.width, c.height)); } finally { gl.bindFramebuffer(gl.FRAMEBUFFER, fb); }
  },
};
const modulo = {
  name: 'casoblack',
  onStart() {
    const {camera} = XR8.Threejs.xrScene(); camera.position.set(0, 1.6, 0);
    XR8.XrController.updateCameraProjectionMatrix({origin: camera.position, facing: camera.quaternion}); status(historia.abertura[2]);
  },
  onCanvasSizeChange() { cssRenderer.setSize(innerWidth, innerHeight); },
  onVideoSizeChange({videoWidth, videoHeight}) { est.video = `${videoWidth}x${videoHeight}`; },
  onUpdate({processCpuResult}) { const r = processCpuResult?.reality; if (r) $('#limitado').hidden = r.trackingStatus !== 'LIMITED'; },
  onRender() {
    const agora = performance.now(), dt = Math.min(.1, (agora - (ultimo || agora)) / 1000); ultimo = agora;
    const p = ancora.passo(dt); if (!p || !quadroObj) return;
    raiz.position.set(...p.p); raiz.quaternion.set(...p.q); raiz.scale.setScalar(p.s); raiz.visible = true; quadroObj.scale.setScalar(alvoLargura / 600);
    const {camera} = XR8.Threejs.xrScene(); tmp.set(...p.p).applyMatrix4(camera.matrixWorldInverse);
    painel.style.visibility = tmp.z < -.05 ? 'visible' : 'hidden'; cssRenderer.render(cssScene, camera);
    if (Q.has('debug')) $('#debug').textContent = `${alvoAtual} · vídeo ${est.video} · canvas ${$('#camera').width}x${$('#camera').height}`;
  },
  listeners: [
    {event: 'reality.imagefound', process: ({detail}) => receber(detail, true)},
    {event: 'reality.imageupdated', process: ({detail}) => receber(detail, false)},
    {event: 'reality.imagelost', process: ({detail}) => { if (detail.name !== alvoAtual) return; ancora.lost(); est.eventos.push('lost-' + detail.name); status(historia.abertura[2]); }},
  ],
  onCameraStatusChange({status: s}) { if (s === 'requesting') status('Permita o acesso à câmera…'); if (['failed', 'denied'].includes(s)) erro('Sem acesso à câmera. Libere a câmera nas permissões do navegador e recarregue.'); },
  onException() { erro('A lupa travou. Recarregue a página.'); },
};
est.simular = (detail, tipo = 'found') => modulo.listeners.find(l => l.event === 'reality.image' + tipo).process({detail});
function erro(t) { $('#erro p').textContent = t; $('#erro').hidden = false; }
async function configurar() {
  const nomes = ['placa-1', 'placa-2', 'placa-3', 'placa-4', 'placa-5', 'verso-teste'];
  const alvos = await Promise.all(nomes.map(async nome => { const r = await fetch(`./alvos/${nome}.json`); if (!r.ok) throw Error(nome); const json = await r.json(); json.imagePath = new URL(`./alvos/${nome}_luminance.png`, location.href).href; return json; }));
  XR8.XrController.configure({imageTargetData: alvos, disableWorldTracking: false}); est.alvos = alvos.map(a => a.name);
}
async function abrir() {
  if (rodando) return;
  if (!XR8.XrDevice.isDeviceBrowserCompatible()) return erro('Este navegador não abre a lupa. Use o Chrome (Android) ou o Safari (iPhone).');
  rodando = true; $('#inicio').hidden = true;
  sequencia(historia.abertura.slice(0, 2), async () => {
    calar();
    try {
      await configurar();
      XR8.addCameraPipelineModules([XR8.FullWindowCanvas.pipelineModule(), XR8.GlTextureRenderer.pipelineModule(), leitorMod, XR8.Threejs.pipelineModule(), XR8.XrController.pipelineModule(), modulo]);
      XR8.run({canvas: $('#camera'), allowedDevices: XR8.XrConfig.device().MOBILE_AND_HEADSETS});
    } catch { erro('Não foi possível abrir a lupa. Recarregue a página.'); }
  });
}
$('#abrir').onclick = abrir;
addEventListener('resize', redimensionarDemo);
if (DEMO) {
  $('#inicio').hidden = true; $('#camera').hidden = true; $('#css3d').hidden = true; $('#credito').hidden = true; $('#demo-palco').hidden = false;
  document.body.classList.add('demo');
  if (DEMO === 'verso' || /^[1-5]$/.test(DEMO)) selecionar(DEMO === 'verso' ? 'verso' : 'placa-' + DEMO);
  else erro('Estação demo inválida. Use ?demo=1 até 5 ou ?demo=verso.');
  est.pronto = true;
} else {
  montarCss();
  const pronto = async () => { est.xr = true; try { await configurar(); est.configurado = true; $('#abrir').disabled = false; $('#abrir').textContent = 'Abrir lupa'; } catch (e) { est.configErro = String(e); erro('Não foi possível carregar as placas. Recarregue.'); } };
  window.XR8 ? pronto() : addEventListener('xrloaded', pronto, {once: true});
  const script = document.createElement('script'); script.src = './xr/xr.js'; script.async = true; script.dataset.preloadChunks = 'slam'; script.onerror = () => erro('Não foi possível carregar a lupa. Recarregue.'); document.head.append(script);
}
