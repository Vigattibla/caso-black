/* Jogo único: quadro CSS3D no alvo; demo usa os mesmos painéis sem ligar câmera. */
import * as THREE from 'three';
import {CSS3DRenderer, CSS3DObject} from './vendor/CSS3DRenderer.js';
import {criarAncora} from './ancora.js';
import {criarEstacao1, CSS} from './estacao1.js';
import {criarEstacao2} from './estacao2.js';
import {criarEstacao3} from './estacao3.js?v=19';
import {criarEstacao4} from './estacao4.js?v=20';
import {criarRastro, caminhoSalvo, salvarCaminho, paraPlaca} from './rastro.js?v=20';
import {criarEstacao5} from './estacao5.js';
import {criarVerso} from './verso.js';
import {criarRetrato, lerRetrato} from './retrato.js?v=18';
import {criarEstado} from './estado.js?v=20';
import {criarMochila} from './mochila.js?v=17';
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
const mochila = criarMochila(estado, () => painel, item => falar(item === 'lente' ? estado.valor.itens.lente ? historia.lupa.naCarta : historia.estacoes[4]['sem lente'] : historia.estacoes[5]['sem chave']));
// Placas: quadro 2× maior que o papel; verso/frente ficam 1:1 porque a guia de leitura casa com o impresso.
// Pista escondida (A4) 1,2×: o jogo da memória cabe sobre a folha.
const ampliar = () => /^placa/.test(alvoAtual) ? 2 : alvoAtual === 'pista-4' ? 1.2 : 1;
// Rastro do Pipoca: patinhas em AR no chão, da placa 4 até a pista; pose4 = última pose vista da placa 4.
const rastro = criarRastro(THREE); let pose4 = null; est.rastro = rastro;
// ?pegadas: teste de montagem — mirou a placa 4, as patinhas já saem (sem lupa); a folha vai onde elas terminam.
const PEGADAS = Q.has('pegadas') && !DEMO; let pegadasVistas = false;
// ?gravar: mira a placa 4, anda até a folha escondida e mira ela — o caminho andado vira o rastro (salvo no aparelho).
const gravar = Q.has('gravar') && !DEMO ? (() => {
  const caixa = document.createElement('div'); caixa.id = 'calibrar';
  caixa.innerHTML = '<span class="g-st">1) Mire a placa 4</span><pre class="g-out" hidden></pre><div><button class="g-copia" hidden>📋 Copiar números</button><button onclick="location.reload()">↺ Recomeçar</button></div>';
  document.body.append(caixa);
  const st = t => { caixa.querySelector('.g-st').textContent = t; };
  let pts = [], fim = false;
  return {
    andar(camera) {
      if (fim || !pose4) return;
      const q = paraPlaca(THREE, pose4, camera.position.toArray()), u = pts.at(-1);
      if (Math.hypot(...q) < 1.5) { pts = []; st('2) Placa 4 ✓ — agora ande até a folha escondida'); return; } // ainda na placa: começa daqui
      if (!u || Math.hypot(q[0] - u[0], q[1] - u[1]) > 1.2) { pts.push(q); st(`Gravando caminho… ${pts.length} ponto(s) · mire a folha quando chegar`); }
    },
    pista(detail) {
      if (fim || !pose4) return false;
      fim = true; const c = {pts: [[0, .8], ...pts, paraPlaca(THREE, pose4, [detail.position.x, detail.position.y, detail.position.z])]};
      salvarCaminho(c); est.caminho = rastro.mostrar(pose4, c);
      st('Caminho gravado ✓ — as patinhas já estão no chão. Mande os números:');
      const out = caixa.querySelector('.g-out'), copia = caixa.querySelector('.g-copia');
      out.textContent = JSON.stringify(c); out.hidden = copia.hidden = false;
      copia.onclick = () => navigator.clipboard?.writeText(out.textContent).then(() => { copia.textContent = 'Copiado ✓'; });
      return true;
    },
  };
})() : null;
const ligarRastro = liga => { if (!liga) { rastro.esconder(); return true; } if (!pose4) return false; est.caminho = rastro.mostrar(pose4); return true; };
const criar = [criarEstacao1, criarEstacao2, criarEstacao3, criarEstacao4, criarEstacao5];
function selecionar(nome) {
  if (!/^(placa-[1-5]|pista-4|verso|frente)$/.test(nome)) return false;
  if (alvoAtual === nome) return true;
  calar(); $('#fala-espera').append(balao); painel?.limpar?.();
  fixar(false); if (quadroObj) raiz.remove(quadroObj);
  painel?.remove(); alvoAtual = nome; est.alvo = nome;
  if (nome === 'pista-4') rastro.esconder();
  const ctx = {estado, demo: !!DEMO, pista: nome === 'pista-4', rastro: DEMO ? undefined : ligarRastro, premiar: (item, origem) => mochila.premiar(item, origem), onGanhar: n => { est.eventos.push('concluiu-' + n); }};
  painel = nome === 'verso' ? criarVerso(ctx) : nome === 'frente' ? criarRetrato(ctx) : criar[Number(nome.slice(-1)) - 1](ctx);
  painel.querySelector('.fala-slot').append(balao); est.quadro = painel;
  if (DEMO) { $('#demo-palco').append(painel); redimensionarDemo(); }
  else {
    quadroObj = new CSS3DObject(painel); quadroObj.position.z = .01; quadroObj.scale.setScalar(alvoLargura * ampliar() / 600); raiz.add(quadroObj);
    painel.style.visibility = 'hidden'; ancora = criarAncora(); est.ancora = ancora; raiz.visible = false;
  }
  $('#fixar').hidden = DEMO || !/^(placa|pista)/.test(nome);
  return true;
}
// Resgate sem AR: o mesmo painel sai do alvo e fica preso na tela (criança que não alcança a placa).
let fixado = false;
function fixar(sim) {
  if (DEMO || !painel || sim === fixado) return;
  fixado = sim; document.body.classList.toggle('fixado', sim); $('#demo-palco').hidden = !sim; est.fixado = sim;
  $('#fixar').textContent = sim ? '📷 Voltar pra câmera' : '📌 Trazer pra tela';
  if (sim) { $('#demo-palco').append(painel); Object.assign(painel.style, {display: '', visibility: 'visible'}); status(''); redimensionarDemo(); }
  else { Object.assign(painel.style, {transform: '', transformOrigin: '', visibility: 'hidden'}); } // CSS3D devolve o painel ao alvo no próximo render
}
function montarCss() {
  cssScene = new THREE.Scene(); cssRenderer = new CSS3DRenderer({element: $('#css3d')}); cssRenderer.setSize(innerWidth, innerHeight);
  raiz = new THREE.Object3D(); raiz.visible = false; cssScene.add(raiz);
}
function redimensionarDemo() {
  if ((!DEMO && !fixado) || !painel) return;
  const alto = painel.offsetHeight || 800, k = Math.min((innerWidth - 12) / 600, (innerHeight - 118) / alto);
  $('#demo-palco').style.width = 600 * k + 'px'; $('#demo-palco').style.height = alto * k + 'px';
  painel.style.transform = `scale(${k})`; painel.style.transformOrigin = '0 0';
}
// Trava: outro alvo só assume se o atual sumiu há um tempo (evita trocar de tela no meio do jogo).
let rastreando = false, perdidoEm = 0;
const TROCA_MS = 2500;
function receber(detail, found) {
  if (CALIBRAR) calibrar.ver(detail);
  if (gravar && detail.name === 'pista-4' && (gravar.pista(detail) || rastro.ligado)) return; // gravando: a folha só fecha o caminho
  if (!/^(placa-[1-5]|pista-4|verso|frente)$/.test(detail.name)) return;
  if (detail.name !== alvoAtual) {
    if (!found) return;
    // Achar a folha no fim do rastro assume na hora, mesmo com a placa ainda à vista.
    if (alvoAtual && !(detail.name === 'pista-4' && rastro.ligado) && (rastreando || performance.now() - perdidoEm < TROCA_MS)) return;
  }
  rastreando = true; if (found && detail.name === alvoAtual) fixar(false);
  alvoLargura = detail.scaledWidth || 1; selecionar(detail.name);
  bruto.position.set(detail.position.x, detail.position.y, detail.position.z); bruto.quaternion.set(detail.rotation.x, detail.rotation.y, detail.rotation.z, detail.rotation.w); bruto.scale.setScalar(detail.scale);
  if (found) { ancora.found(detail); est.eventos.push('found-' + detail.name); } else ancora.updated(detail);
  status('');
}
const leitorMod = {
  name: 'cb8w-leitor', onAttach({GLctx}) { gl = GLctx; },
  onRender() {
    if (!['verso', 'frente'].includes(alvoAtual) || !painel?.podeLer?.() || !ancora.visto || !gl) return;
    const agora = performance.now(); if (agora - ultimaLeitura < 240) return; ultimaLeitura = agora;
    const {camera} = XR8.Threejs.xrScene(), c = $('#camera'); bruto.updateMatrixWorld();
    M.copy(camera.projectionMatrix).multiply(camera.matrixWorldInverse).multiply(bruto.matrixWorld).multiply(escala.makeScale(alvoLargura, alvoLargura, alvoLargura));
    const fb = gl.getParameter(gl.FRAMEBUFFER_BINDING); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    try { painel.avaliar((alvoAtual === 'verso' ? lerChave : lerRetrato)(gl, M.elements, c.width, c.height)); } finally { gl.bindFramebuffer(gl.FRAMEBUFFER, fb); }
  },
};
const modulo = {
  name: 'casoblack',
  onStart() {
    const {camera, scene} = XR8.Threejs.xrScene(); camera.position.set(0, 1.6, 0); scene.add(rastro.grupo);
    XR8.XrController.updateCameraProjectionMatrix({origin: camera.position, facing: camera.quaternion}); status(historia.abertura[2]); $('#mirar').hidden = false;
    if (pendente) { selecionar('placa-' + pendente); fixar(true); pendente = null; }
  },
  onCanvasSizeChange() { cssRenderer.setSize(innerWidth, innerHeight); },
  onVideoSizeChange({videoWidth, videoHeight}) { est.video = `${videoWidth}x${videoHeight}`; },
  onUpdate({processCpuResult}) { const r = processCpuResult?.reality; if (r) $('#limitado').hidden = r.trackingStatus !== 'LIMITED'; },
  onRender() {
    const agora = performance.now(), dt = Math.min(.1, (agora - (ultimo || agora)) / 1000); ultimo = agora;
    const p = ancora.passo(dt); rastro.passo();
    if (p && alvoAtual === 'placa-4' && rastreando) pose4 = {p: [...p.p], q: [...p.q], s: p.s * alvoLargura};
    if (PEGADAS && pose4 && !pegadasVistas) { pegadasVistas = true; ligarRastro(true); }
    gravar?.andar(XR8.Threejs.xrScene().camera);
    if (!p || !quadroObj || fixado) return;
    raiz.position.set(...p.p); raiz.quaternion.set(...p.q); raiz.scale.setScalar(p.s); raiz.visible = true; quadroObj.scale.setScalar(alvoLargura * ampliar() / 600);
    const {camera} = XR8.Threejs.xrScene(); tmp.set(...p.p).applyMatrix4(camera.matrixWorldInverse);
    painel.style.visibility = tmp.z < -.05 ? 'visible' : 'hidden'; cssRenderer.render(cssScene, camera);
    if (Q.has('debug')) $('#debug').textContent = `${alvoAtual} · vídeo ${est.video} · canvas ${$('#camera').width}x${$('#camera').height}`;
  },
  listeners: [
    {event: 'reality.imagefound', process: ({detail}) => receber(detail, true)},
    {event: 'reality.imageupdated', process: ({detail}) => receber(detail, false)},
    {event: 'reality.imagelost', process: ({detail}) => { if (detail.name !== alvoAtual) return; rastreando = false; perdidoEm = performance.now(); ancora.lost(); est.eventos.push('lost-' + detail.name); if (rastro.ligado) status('Siga as patinhas no chão 🐾'); else if (/^(placa|pista)/.test(alvoAtual)) fixar(true); else status(historia.abertura[2]); }},
  ],
  onCameraStatusChange({status: s}) { if (s === 'requesting') status('Permita o acesso à câmera…'); if (['failed', 'denied'].includes(s)) erro('Sem acesso à câmera. Libere a câmera nas permissões do navegador e recarregue.'); },
  onException() { erro('A câmera travou. Recarregue a página.'); },
};
// ?calibrar: medir o caminho no local. Mira a placa 4, marca pontos andando, mira a pista; salva neste aparelho.
const CALIBRAR = Q.has('calibrar') && !DEMO;
const calibrar = (() => {
  if (!CALIBRAR) return null;
  const caixa = document.createElement('div'); caixa.id = 'calibrar';
  caixa.innerHTML = '<span class="cal-st">1) Mire a placa 4</span><div><button data-c="ponto">📍 Ponto aqui</button><button data-c="desfaz">↩︎ Desfazer</button><button data-c="salvar">💾 Salvar</button><button data-c="ver">🐾 Ver</button><button data-c="curto">Sala (curto)</button><button data-c="padrao">Padrão</button></div><pre class="cal-out"></pre>';
  document.body.append(caixa);
  let pts = [], pista = null;
  const st = t => { caixa.querySelector('.cal-st').textContent = t; }, out = t => { caixa.querySelector('.cal-out').textContent = t; };
  const resumo = () => st(`${pose4 ? 'Placa 4 ✓' : '1) Mire a placa 4'} · ${pts.length} ponto(s) · ${pista ? 'pista ✓' : 'pista ✗'}`);
  const final = () => [[0, .8], ...pts, ...(pista ? [paraPlaca(THREE, pose4, pista)] : [])];
  const mostrar = c => { if (!pose4) return st('Mire a placa 4 antes'); est.caminho = rastro.mostrar(pose4, c); out(JSON.stringify(c)); };
  caixa.onclick = e => {
    const c = e.target.closest('[data-c]')?.dataset.c; if (!c) return;
    if (c === 'curto' || c === 'padrao') { const k = {pts: c === 'curto' ? [[0, 1], [1.5, 2], [3, 2]] : [[0, 1.5], [3, 3], [6, 3]]}; salvarCaminho(k); mostrar(k); return; }
    if (!pose4) return st('Mire a placa 4 antes');
    if (c === 'ponto') { const {camera} = XR8.Threejs.xrScene(); pts.push(paraPlaca(THREE, pose4, camera.position.toArray())); navigator.vibrate?.(20); }
    if (c === 'desfaz') pts.pop();
    if (c === 'ver' || c === 'salvar') { const k = {pts: final()}; if (k.pts.length < 2) return st('Marque ao menos um ponto'); mostrar(k); if (c === 'salvar') { salvarCaminho(k); st('Salvo neste aparelho ✓ · mande os números'); return; } }
    resumo();
  };
  out('Atual: ' + JSON.stringify(caminhoSalvo()));
  return {ver(d) { if (d.name === 'pista-4') pista = [d.position.x, d.position.y, d.position.z]; setTimeout(resumo); }};
})();
est.simular = (detail, tipo = 'found') => modulo.listeners.find(l => l.event === 'reality.image' + tipo).process({detail});
function erro(t) { $('#erro p').textContent = t; $('#erro').hidden = false; }
async function configurar() {
  const nomes = ['placa-1', 'placa-2', 'placa-3', 'placa-4', 'placa-5', 'pista-4', 'verso-teste', 'frente'];
  const alvos = await Promise.all(nomes.map(async nome => { const r = await fetch(`./alvos/${nome}.json`, {cache: 'no-cache'}); if (!r.ok) throw Error(nome); const json = await r.json(); json.imagePath = new URL(`./alvos/${nome}_luminance.png?v=${json.updated}`, location.href).href; return json; }));
  XR8.XrController.configure({imageTargetData: alvos, disableWorldTracking: false}); est.alvos = alvos.map(a => a.name);
}
async function abrir() {
  if (rodando) return;
  if (!XR8.XrDevice.isDeviceBrowserCompatible()) return erro('Este navegador não abre a câmera mágica. Use o Chrome (Android) ou o Safari (iPhone).');
  rodando = true; $('#inicio').hidden = true;
  sequencia(historia.abertura.slice(0, 2), async () => {
    calar();
    try {
      await configurar();
      XR8.addCameraPipelineModules([XR8.FullWindowCanvas.pipelineModule(), XR8.GlTextureRenderer.pipelineModule(), leitorMod, XR8.Threejs.pipelineModule(), XR8.XrController.pipelineModule(), modulo]);
      XR8.run({canvas: $('#camera'), allowedDevices: XR8.XrConfig.device().MOBILE_AND_HEADSETS});
    } catch { erro('Não foi possível abrir a câmera. Recarregue a página.'); }
  });
}
$('#abrir').onclick = abrir;
$('#fixar').onclick = () => fixar(!fixado);
// Número impresso na base da placa abre a estação direto; a câmera liga junto porque a carta (verso/frente) só se lê com ela.
let pendente = null;
const escolha = $('#estacoes');
document.querySelectorAll('.sem-mira').forEach(b => b.onclick = () => { escolha.hidden = false; });
escolha.onclick = e => {
  const n = e.target.closest('[data-estacao]')?.dataset.estacao;
  if (e.target.closest('.fechar') || n) escolha.hidden = true;
  if (!n) return;
  if (!DEMO && !rodando && est.configurado && XR8.XrDevice.isDeviceBrowserCompatible()) { pendente = n; abrir(); return; }
  $('#inicio').hidden = true; rastreando = false; perdidoEm = performance.now();
  selecionar('placa-' + n); fixar(true); est.eventos.push('codigo-' + n);
};
est.estacao = n => escolha.querySelector(`[data-estacao="${n}"]`).click();
addEventListener('resize', redimensionarDemo);
if (DEMO) {
  $('#inicio').hidden = true; $('#camera').hidden = true; $('#css3d').hidden = true; $('#credito').hidden = true; $('#demo-palco').hidden = false;
  document.body.classList.add('demo');
  if (['verso', 'frente', 'pista-4'].includes(DEMO) || /^[1-5]$/.test(DEMO)) selecionar(/^[1-5]$/.test(DEMO) ? 'placa-' + DEMO : DEMO);
  else erro('Estação demo inválida. Use ?demo=1 até 5, pista-4, verso ou frente.');
  est.pronto = true;
} else {
  montarCss();
  const pronto = async () => { est.xr = true; try { await configurar(); est.configurado = true; $('#abrir').disabled = false; $('#abrir').textContent = 'Abrir câmera mágica'; } catch (e) { est.configErro = String(e); erro('Não foi possível carregar as placas. Recarregue.'); } };
  window.XR8 ? pronto() : addEventListener('xrloaded', pronto, {once: true});
  const script = document.createElement('script'); script.src = './xr/xr.js'; script.async = true; script.dataset.preloadChunks = 'slam'; script.onerror = () => erro('Não foi possível carregar a câmera mágica. Recarregue.'); document.head.append(script);
}
