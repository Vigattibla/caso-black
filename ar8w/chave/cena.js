/* Na placa da estação, a chave do inventário ganha vida e vai à fechadura; certo abre, errado emperra.
   Tudo no espaço local da folha (largura 1, y pra cima, z saindo do papel = a mesa). Linha do tempo pura: em(t). */
import * as THREE from 'three';
import {IMG, local, tam, centro} from './layout.js';
import {CADEADO, FECHADURA, ORIGEM as MOLDURA, RETORNO as BOLSO} from './placa.js';
import {adesivo} from './leitor.js';

const BORDA = 7;
const S = 0.55; // escala da chave em voo
export const DUR = {certo: 5.9, errado: 5.0};
const fase = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const lerp = (a, b, k) => a + (b - a) * k;
const sai = k => 1 - (1 - k) ** 3, suave = k => k < .5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
const mola = k => { const c = 1.9; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };

const tex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const mat = (map, extra) => new THREE.MeshBasicMaterial({map, transparent: true, depthWrite: false, ...extra});
const tela = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const naFolha = r => ({c: centro(r), t: tam(r)});

function corPapel(papel) { return `rgb(${papel.join(',')})`; }

// Cadeado AR dividido em corpo + arco. (Arte final: o cliente entrega as duas camadas.)
function cadeadoPartes(img) {
  const A = {x0: 175, y0: 175, x1: 570, y1: 415}; // arco no png 812x797
  const corpo = tela(img.width, img.height), arco = tela(A.x1 - A.x0, A.y1 - A.y0);
  corpo.getContext('2d').drawImage(img, 0, 0);
  corpo.getContext('2d').clearRect(A.x0, A.y0, A.x1 - A.x0, A.y1 - A.y0);
  arco.getContext('2d').drawImage(img, -A.x0, -A.y0);
  const k = (CADEADO.x1 - CADEADO.x0) / img.width; // px png → px verso
  const r = {x0: CADEADO.x0 + A.x0 * k, y0: CADEADO.y0 + A.y0 * k, x1: CADEADO.x0 + A.x1 * k, y1: CADEADO.y0 + A.y1 * k};
  return {corpo, arco, arcoRet: r};
}

function cartaoPista(titulo, texto) {
  const c = tela(640, 400), x = c.getContext('2d');
  x.fillStyle = '#16140f'; x.fillRect(0, 0, 640, 400);
  x.fillStyle = '#fdc72f'; x.fillRect(0, 0, 640, 84);
  x.fillStyle = '#16140f'; x.font = '52px Anton, Impact, sans-serif'; x.fillText(titulo, 28, 64);
  x.fillStyle = '#fffdf6'; x.font = '600 34px Montserrat, sans-serif';
  const linhas = []; let l = '';
  for (const p of texto.split(' ')) { if (x.measureText(l + p).width > 580) { linhas.push(l); l = ''; } l += p + ' '; }
  linhas.push(l);
  linhas.forEach((s, i) => x.fillText(s.trim(), 28, 150 + i * 48));
  return c;
}

function sombra() {
  const c = tela(128, 64), x = c.getContext('2d'), g = x.createRadialGradient(64, 32, 2, 64, 32, 62);
  g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.setTransform(1, 0, 0, .5, 0, 16); x.fillStyle = g; x.fillRect(0, -32, 128, 128);
  return c;
}

function anel() {
  const c = tela(256, 256), x = c.getContext('2d');
  x.strokeStyle = '#fdc72f'; x.lineWidth = 14; x.beginPath(); x.arc(128, 128, 110, 0, Math.PI * 2); x.stroke();
  return c;
}

export function criarCena(folha, cadeadoImg, pista = {titulo: 'PISTA 1 LIBERADA', texto: 'Procure a placa onde a água nunca para de cair.'}) {
  const grupo = new THREE.Group(); grupo.visible = false; folha.add(grupo);
  const M = naFolha(MOLDURA);

  // Borracha: apaga o desenho no papel (cor do papel lida na câmera) para parecer que ele descolou.
  const borracha = new THREE.Mesh(new THREE.PlaneGeometry(...M.t), mat(null, {opacity: 0}));
  borracha.position.set(...M.c, 0.001); borracha.renderOrder = 1; grupo.add(borracha);

  const somb = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat(tex(sombra()), {opacity: 0}));
  somb.renderOrder = 2; grupo.add(somb);

  const chave = new THREE.Group(); chave.rotation.order = 'ZYX'; grupo.add(chave);
  const adesivoMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat(null, {side: THREE.DoubleSide}));
  adesivoMesh.renderOrder = 6; chave.add(adesivoMesh);

  // Cadeado inteiramente virtual, ancorado à placa da estação.
  const cad = cadeadoPartes(cadeadoImg), C = naFolha(CADEADO), AR = naFolha(cad.arcoRet);
  const cadGrupo = new THREE.Group(); cadGrupo.position.set(...C.c, 0.0015); cadGrupo.visible = false; grupo.add(cadGrupo);
  const fundo = new THREE.Mesh(new THREE.PlaneGeometry(...C.t), mat(null, {opacity: 0}));
  fundo.renderOrder = 3; cadGrupo.add(fundo);
  const corpo = new THREE.Mesh(new THREE.PlaneGeometry(...C.t), mat(tex(cad.corpo))); corpo.renderOrder = 4; cadGrupo.add(corpo);
  const pivo = new THREE.Group(); // gira pela perna esquerda do arco
  pivo.position.set(AR.c[0] - AR.t[0] / 2 - C.c[0], AR.c[1] - AR.t[1] / 2 - C.c[1], 0.0005); cadGrupo.add(pivo);
  const arco = new THREE.Mesh(new THREE.PlaneGeometry(...AR.t), mat(tex(cad.arco))); arco.position.set(AR.t[0] / 2, AR.t[1] / 2, 0); arco.renderOrder = 5; pivo.add(arco);

  const brilho = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat(tex(anel()), {opacity: 0, blending: THREE.AdditiveBlending}));
  brilho.renderOrder = 7; grupo.add(brilho);

  const cartao = new THREE.Group(); cartao.position.set(C.c[0] - 0.08, C.c[1] + 0.1, 0); cartao.rotation.x = Math.PI / 2; grupo.add(cartao);
  const cartaoMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.2125), mat(tex(cartaoPista(pista.titulo, pista.texto)), {side: THREE.DoubleSide}));
  cartaoMesh.position.y = 0.2125 / 2; cartaoMesh.renderOrder = 8; cartao.add(cartaoMesh); cartao.scale.setScalar(0.001);

  const kh = local(FECHADURA.u, FECHADURA.v), bolso = local(BOLSO.u, BOLSO.v);
  let w = 1, h = 1, certo = true, t = 0, rodando = false, fim = null, avisou = false;

  function preparar(leitura, ok) {
    const st = adesivo(leitura.traco, BORDA);
    adesivoMesh.material.map?.dispose(); adesivoMesh.material.map = tex(st); adesivoMesh.material.needsUpdate = true;
    w = M.t[0] * st.width / leitura.traco.width; h = M.t[1] * st.height / leitura.traco.height;
    adesivoMesh.scale.set(w, h, 1);
    const b = tela(leitura.traco.width, leitura.traco.height), bx = b.getContext('2d');
    bx.drawImage(leitura.traco, 0, 0); bx.globalCompositeOperation = 'source-in'; bx.fillStyle = corPapel(leitura.papel); bx.fillRect(0, 0, b.width, b.height);
    borracha.material.map?.dispose(); borracha.material.map = tex(b); borracha.material.needsUpdate = true;
    fundo.material.color.set(corPapel(leitura.papel));
    certo = ok; t = 0; avisou = false; grupo.visible = true; em(0);
    return st;
  }

  // Estado completo no instante t (sem acumular: dá para pular para qualquer ponto).
  function em(tt) {
    t = tt;
    const pIni = [...M.c], hs = h * S;
    const ponta = kh[0] - w * S * 0.42; // centro da chave com a ponta encostada na fechadura
    const lev = sai(fase(t, 0, 0.7)), pe = suave(fase(t, 0.7, 1.3)), giro = suave(fase(t, 1.0, 2.2)), deita = suave(fase(t, 2.2, 3.0));
    const empurra = suave(fase(t, 3.0, 3.3));
    let x = pIni[0], y = pIni[1], z = lerp(0.003, 0.07, lev), s = lerp(1, S, lev), rx = 0, rz = giro * Math.PI * 2, op = 1;
    z = lerp(z, hs / 2 + 0.015 + 0.012 * Math.sin(t * 7), pe * (1 - deita));
    rx = Math.PI / 2 * pe * (1 - deita);
    x = lerp(x, ponta - 0.03 + 0.03 * empurra, deita); y = lerp(y, kh[1], deita); z = lerp(z, 0.02, deita);
    borracha.material.opacity = 0; // Na placa a ferramenta vem do inventário, sem apagar papel.
    let arcoSobe = 0, cartaoK = 0, brilhoK = 0, treme = 0;
    if (certo) {
      const vira = suave(fase(t, 3.3, 3.8)), abre = mola(fase(t, 3.8, 4.4)), desvira = suave(fase(t, 4.4, 4.7)), voa = fase(t, 4.7, 5.6);
      rx = Math.max(rx, Math.PI / 2 * vira * (1 - desvira));
      arcoSobe = abre; cartaoK = mola(fase(t, 4.0, 4.8)); brilhoK = fase(t, 3.8, 4.6);
      if (voa > 0) {
        const k = suave(voa);
        x = lerp(ponta, bolso[0], k); y = lerp(kh[1], bolso[1], k); z = 0.02 + 0.22 * Math.sin(Math.PI * k) - 0.017 * k;
        s = lerp(S, 0.28, k); rz = -Math.PI * 2 * k; op = 1 - fase(t, 5.45, 5.65);
        brilhoK = Math.max(brilhoK, fase(t, 5.4, 5.9) > 0 ? 2 + fase(t, 5.4, 5.9) : 0);
      }
      borracha.material.opacity *= 1 - fase(t, 5.5, 5.9);
    } else {
      const trava = fase(t, 3.3, 4.0), cai = suave(fase(t, 4.0, 4.6));
      treme = trava > 0 && trava < 1 ? Math.sin(trava * 40) * (1 - trava) : 0;
      rx = Math.max(rx, 0.35 * Math.abs(treme));
      x -= 0.12 * cai; z = lerp(z, 0.004, cai); rz = 0.35 * cai + 0.06 * treme;
      op = 1 - fase(t, 4.6, 5.0); borracha.material.opacity *= op;
    }
    chave.position.set(x, y, z); chave.rotation.set(rx, 0, rz); chave.scale.setScalar(s);
    adesivoMesh.material.opacity = op;
    somb.position.set(x, y - (rx > 0.2 ? 0 : 0.01), 0.0012); somb.rotation.z = rz;
    somb.scale.set(w * s * (rx > 0.6 ? 0.95 : 1.05), (rx > 0.6 ? 0.06 : h * s * 0.9), 1);
    somb.material.opacity = Math.min(0.5, z * 6) * op;
    cadGrupo.visible = true;
    cadGrupo.position.x = C.c[0] + 0.006 * treme;
    pivo.position.z = 0.0005; arco.position.y = AR.t[1] / 2 + 0.035 * arcoSobe; pivo.rotation.z = 0.5 * arcoSobe;
    cartao.scale.setScalar(Math.max(0.001, cartaoK)); cartao.visible = cartaoK > 0;
    if (brilhoK > 2) { brilho.position.set(...bolso, 0.003); brilho.scale.setScalar(0.1 + 0.25 * (brilhoK - 2)); brilho.material.opacity = 1 - (brilhoK - 2); }
    else { brilho.position.set(...kh, 0.003); brilho.scale.setScalar(0.05 + 0.3 * brilhoK); brilho.material.opacity = brilhoK > 0 ? 1 - brilhoK : 0; }
  }

  return {
    grupo, preparar, em,
    iniciar(leitura, ok, onFim) { const st = preparar(leitura, ok); rodando = true; fim = onFim; return st; },
    passo(dt) {
      if (!rodando) return;
      em(t + dt);
      const d = certo ? DUR.certo : DUR.errado;
      if (t >= d && !avisou) { avisou = true; rodando = false; fim?.(certo); }
    },
    get t() { return t; }, get rodando() { return rodando; },
    esconder() { grupo.visible = false; rodando = false; },
    mostrarFechado() { em(0); grupo.visible = true; cadGrupo.visible = true; chave.visible = false; somb.visible = false; cartao.visible = false; brilho.visible = false; },
    usarChave(leitura, ok, onFim) { chave.visible = true; somb.visible = true; brilho.visible = true; const st = preparar(leitura, ok); rodando = true; fim = onFim; return st; },
    mostrarAberto() { cadGrupo.visible = true; arco.position.y = AR.t[1] / 2 + 0.035; pivo.rotation.z = 0.5; cartao.visible = true; cartao.scale.setScalar(1); },
  };
}
export {IMG};
