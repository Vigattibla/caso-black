/* A coleta no verso nunca verifica a solução da estação. */
import * as THREE from 'three';
import {MOLDURA, BOLSO, centro, local, tam} from './layout.js';
import {adesivo} from './leitor.js';
export function criarColeta(folha) {
  const grupo = new THREE.Group(); grupo.visible = false; folha.add(grupo);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...tam(MOLDURA)), new THREE.MeshBasicMaterial({transparent: true, depthWrite: false, side: THREE.DoubleSide})); grupo.add(mesh);
  const origem = centro(MOLDURA), destino = local(BOLSO.u, BOLSO.v);
  let t = 0, rodando = false, fim;
  function em(s) {
    t = s; const k = Math.min(1, Math.max(0, s / 2)), p = k * k * (3 - 2 * k);
    mesh.position.set(origem[0] + (destino[0] - origem[0]) * p, origem[1] + (destino[1] - origem[1]) * p, .008 + .15 * Math.sin(Math.PI * k));
    mesh.rotation.z = -.12 * Math.sin(Math.PI * k); mesh.scale.setScalar(1 - .69 * p); mesh.material.opacity = 1;
  }
  return {grupo, em, get t() { return t; },
    iniciar(r, onFim) { const st = adesivo(r.traco); mesh.material.map?.dispose(); const tex = new THREE.CanvasTexture(st); tex.colorSpace = THREE.SRGBColorSpace; mesh.material.map = tex; mesh.material.needsUpdate = true; grupo.visible = true; t = 0; rodando = true; fim = onFim; em(0); return st; },
    passo(dt) { if (!rodando) return; em(t + dt); if (t >= 2) { rodando = false; fim?.(); } },
    esconder() { grupo.visible = false; rodando = false; },
  };
}
