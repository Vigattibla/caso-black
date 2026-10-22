/* Rastro do Pipoca: patinhas no chão (y=0 do SLAM) da folha Faro do Pipoca até a placa 4.
   Caminho salvo no referencial da placa, em larguras de placa: x à direita, z saindo da parede. */
const CHAVE = 'cb_rastro4b'; // b: o rastro agora sai da folha (o gravado antes saía da placa)
// Sem gravação (?gravar): reto pra frente da folha, ~15 larguras. Gravar no local o caminho até a placa 4.
const PADRAO = {pts: [[0, .8], [0, 8], [0, 15]]};
export const caminhoSalvo = () => { try { return JSON.parse(localStorage.getItem(CHAVE)) || PADRAO; } catch (e) { return PADRAO; } };
export const salvarCaminho = c => { try { localStorage.setItem(CHAVE, JSON.stringify(c)); } catch (e) {} };

function textura(THREE) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const oval = (cx, cy, rx, ry) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); x.stroke(); };
  x.fillStyle = '#fdc72f'; x.strokeStyle = '#111'; x.lineWidth = 6;
  oval(64, 80, 27, 22); [[37, 50], [54, 34], [74, 34], [91, 50]].forEach(([a, b]) => oval(a, b, 10, 13));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// Placa → mundo: base horizontal (direita e frente projetadas no chão), unidade = largura da placa.
function base(THREE, pose) {
  const q = new THREE.Quaternion(...pose.q), dir = new THREE.Vector3(1, 0, 0).applyQuaternion(q), fre = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
  dir.y = 0; fre.y = 0;
  if (fre.lengthSq() < .01) fre.crossVectors(dir, new THREE.Vector3(0, 1, 0)).negate(); // placa deitada: frente = perpendicular à direita
  dir.normalize(); fre.normalize();
  return {o: new THREE.Vector3(pose.p[0], 0, pose.p[2]), dir, fre, s: pose.s};
}
export function paraPlaca(THREE, pose, ponto) {
  const b = base(THREE, pose), d = new THREE.Vector3(ponto[0], 0, ponto[2]).sub(b.o);
  return [+(d.dot(b.dir) / b.s).toFixed(2), +(d.dot(b.fre) / b.s).toFixed(2)];
}

export function criarRastro(THREE) {
  const grupo = new THREE.Group(), tex = textura(THREE), geo = new THREE.PlaneGeometry(.3, .3).rotateX(-Math.PI / 2);
  let patas = [], mundoPts = [], t0 = 0, ligado = false; grupo.visible = false; grupo.renderOrder = 10;
  function limpar() { patas.forEach(m => { grupo.remove(m); m.material.dispose(); }); patas = []; }
  return {
    grupo, get ligado() { return ligado; },
    mostrar(pose, caminho = caminhoSalvo()) {
      limpar(); const b = base(THREE, pose);
      const mundo = caminho.pts.map(([x, z]) => b.o.clone().addScaledVector(b.dir, x * b.s).addScaledVector(b.fre, z * b.s));
      const passo = .35; let lado = 1; mundoPts = mundo;
      for (let i = 0; i < mundo.length - 1; i++) {
        const a = mundo[i], c = mundo[i + 1], seg = c.clone().sub(a), L = seg.length(); if (L < .01) continue;
        const u = seg.clone().normalize(), lateral = new THREE.Vector3(-u.z, 0, u.x), ang = Math.atan2(u.x, u.z);
        for (let d = i ? passo : 0; d < L; d += passo, lado = -lado) {
          const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({map: tex, transparent: true, opacity: 0, depthWrite: false, depthTest: false}));
          m.position.copy(a).addScaledVector(u, d).addScaledVector(lateral, .07 * lado); m.position.y = .005; m.rotation.y = ang + Math.PI; m.renderOrder = 10; m.frustumCulled = false;
          grupo.add(m); patas.push(m);
        }
      }
      t0 = performance.now(); ligado = grupo.visible = true;
      return mundo.map(p => [+p.x.toFixed(2), +p.z.toFixed(2)]);
    },
    esconder() { ligado = grupo.visible = false; limpar(); },
    // Patinhas acendem em sequência (andando) e ficam; uma onda clara repassa o caminho a cada volta.
    passo() {
      if (!ligado) return; const k = (performance.now() - t0) / 140, n = patas.length;
      patas.forEach((m, i) => { const onda = (k - i) % (n + 8); m.material.opacity = k < i ? 0 : onda >= 0 && onda < 3 ? 1 : .75; });
    },
    get total() { return patas.length; },
    // Guia na tela: próxima patinha à frente de quem anda (ou o fim) em relação à câmera, no chão.
    guia(camera) {
      if (!ligado || !patas.length) return null;
      const c = camera.position, d = m => Math.hypot(m.position.x - c.x, m.position.z - c.z);
      let perto = 0; patas.forEach((m, i) => { if (d(m) < d(patas[perto])) perto = i; });
      const alvo = patas[Math.min(patas.length - 1, perto + 3)].position, fim = mundoPts.at(-1);
      const fre = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); fre.y = 0;
      if (fre.lengthSq() < 1e-4) fre.set(0, 1, 0).applyQuaternion(camera.quaternion).setY(0); // celular apontado pro chão: topo da tela = frente
      const v = new THREE.Vector3(alvo.x - c.x, 0, alvo.z - c.z);
      const ang = Math.atan2(fre.x * v.z - fre.z * v.x, fre.x * v.x + fre.z * v.z);
      return {ang, falta: Math.hypot(fim.x - c.x, fim.z - c.z), n: patas.length};
    },
  };
}
