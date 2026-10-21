/* Caso Black · protótipo 8th Wall: SLAM + alvo de imagem; quadro DOM (CSS3D) preso no mundo. */
import * as THREE from 'three';
import {CSS3DRenderer, CSS3DObject} from './vendor/CSS3DRenderer.js';
import {criarAncora} from './ancora.js';
import {criarEstacao1, CSS} from './estacao1.js';
window.THREE = THREE; // XR8.Threejs usa o THREE global

const $ = s => document.querySelector(s);
const status = t => { $('#status').textContent = t; $('#status').hidden = !t; };
document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`);

const ancora = criarAncora();
const DEBUG = /debug/.test(location.search); // ?debug mostra resolução do vídeo e do canvas
const PX = 600; // largura do quadro em px CSS
let alvoLargura = 1, alvoAltura = 4/3, cssScene, cssRenderer, raiz, quadroObj, ultimo = 0, rodando = false, visivel = null;
window.__ar8w = {ancora, eventos: []}; // inspeção nos testes

function montarCss() {
  cssScene = new THREE.Scene();
  cssRenderer = new CSS3DRenderer({element: $('#css3d')});
  cssRenderer.setSize(innerWidth, innerHeight);
  raiz = new THREE.Object3D();
  raiz.visible = false;
  const el = criarEstacao1({onGanhar: () => status('Estação 1 resolvida!')});
  quadroObj = new CSS3DObject(el);
  quadroObj.position.z = 0.01; // levemente à frente da placa
  raiz.add(quadroObj);
  cssScene.add(raiz);
  window.__ar8w.quadro = el;
}

function aplicarPose(p) {
  raiz.position.set(...p.p);
  raiz.quaternion.set(...p.q);
  raiz.scale.setScalar(p.s);
  quadroObj.scale.setScalar(alvoLargura / PX); // px → largura do alvo no mundo (antes de scale)
}

function mostrar(v) { // só muda o DOM quando o estado muda
  if (v === visivel) return;
  visivel = v;
  quadroObj.element.style.visibility = v ? 'visible' : 'hidden';
}

const tmp = new THREE.Vector3();
const modulo = {
  name: 'casoblack',
  onStart() {
    const {camera} = XR8.Threejs.xrScene();
    camera.position.set(0, 1.6, 0);
    XR8.XrController.updateCameraProjectionMatrix({origin: camera.position, facing: camera.quaternion});
    status('Aponte para a placa da Estação 1');
  },
  onCanvasSizeChange() { cssRenderer.setSize(innerWidth, innerHeight); },
  onVideoSizeChange({videoWidth, videoHeight}) { __ar8w.video = videoWidth + 'x' + videoHeight; },
  onUpdate({processCpuResult}) {
    const r = processCpuResult.reality;
    if (r) $('#limitado').hidden = r.trackingStatus !== 'LIMITED';
    if (DEBUG) { const c = $('#camera'); $('#debug').textContent = `vídeo ${__ar8w.video} · canvas ${c.width}x${c.height} · tela ${innerWidth}x${innerHeight}@${devicePixelRatio}`; }
  },
  onRender() {
    const agora = performance.now(), dt = Math.min(0.1, (agora - (ultimo || agora)) / 1000);
    ultimo = agora;
    const p = ancora.passo(dt);
    if (!p) return;
    aplicarPose(p);
    raiz.visible = true;
    const {camera} = XR8.Threejs.xrScene();
    // CSS3D não recorta o que está atrás da câmera: esconder para não aparecer espelhado.
    tmp.set(...p.p).applyMatrix4(camera.matrixWorldInverse);
    mostrar(tmp.z < -0.05);
    cssRenderer.render(cssScene, camera);
  },
  listeners: [
    {event: 'reality.imagefound', process: ({detail}) => {
      alvoLargura = detail.scaledWidth; alvoAltura = detail.scaledHeight;
      ancora.found(detail); __ar8w.eventos.push('found'); status('');
    }},
    {event: 'reality.imageupdated', process: ({detail}) => ancora.updated(detail)},
    {event: 'reality.imagelost', process: () => { ancora.lost(); __ar8w.eventos.push('lost'); }},
  ],
  onCameraStatusChange({status: s}) {
    if (s === 'requesting') status('Permita o acesso à câmera…');
    if (s === 'failed' || s === 'denied') erro('Sem acesso à câmera. Libere a câmera nas permissões do navegador e recarregue.');
  },
  onException(e) { console.error(e); erro('A lupa travou. Recarregue a página.'); },
};

function erro(t) { $('#erro p').textContent = t; $('#erro').hidden = false; }

async function configurar() {
  const json = await (await fetch('./alvos/placa-1.json')).json();
  json.imagePath = new URL('./alvos/placa-1_luminance.png', location.href).href;
  XR8.XrController.configure({imageTargetData: [json], disableWorldTracking: false});
}

async function abrir() {
  if (rodando) return;
  if (!XR8.XrDevice.isDeviceBrowserCompatible()) {
    const motivos = XR8.XrDevice.incompatibleReasons?.() || [];
    console.warn('incompatível', motivos);
    return erro('Este navegador não abre a lupa. Use o Chrome (Android) ou o Safari (iPhone).');
  }
  rodando = true;
  $('#inicio').hidden = true;
  await configurar();
  const canvas = $('#camera');
  XR8.addCameraPipelineModules([
    XR8.FullWindowCanvas.pipelineModule(), // canvas na resolução do vídeo (canvas grande = zoom da câmera)
    XR8.GlTextureRenderer.pipelineModule(),
    XR8.Threejs.pipelineModule(),
    XR8.XrController.pipelineModule(),
    modulo,
  ]);
  XR8.run({canvas, allowedDevices: XR8.XrConfig.device().MOBILE_AND_HEADSETS});
}

montarCss();

const pronto = () => {
  window.__ar8w.xr = true;
  configurar().then(() => { window.__ar8w.configurado = true; }, e => { console.error(e); window.__ar8w.configErro = String(e); });
  $('#abrir').disabled = false;
  $('#abrir').textContent = 'Abrir lupa';
};
window.XR8 ? pronto() : addEventListener('xrloaded', pronto);
$('#abrir').addEventListener('click', abrir);
window.__ar8w.simular = (detail, tipo = 'found') => modulo.listeners.find(l => l.event === 'reality.image' + tipo).process({detail});
