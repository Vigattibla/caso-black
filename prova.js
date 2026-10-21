/* Caso Black · rodada de cada placa: pista física achada → foto da equipe com o molde da prova → álbum.
   Índices 0-based (0 Água · 1 Sabor · 2 Kids · 3 Lojinha · 4 Lobby). Artes resolvidas pelo helper Detetive. */
const Prova = (() => {
  const W = 1080, H = 1350, F = {x: 24, y: 24, w: 1032, h: 1212};   // molde 4:5 · janela da foto
  const AJ = {
    0: {nome: 'Lucas', cab: ['lucas'], lugar: 'ÁGUA'},
    1: {nome: 'Lucas', cab: ['lucas'], lugar: 'SABOR'},
    2: {nome: 'Gabi', cab: ['gabi'], lugar: 'KIDS'},
    3: {nome: 'Pipoca', cab: ['pipoca'], lugar: 'LOJINHA'},
    4: {nome: 'Turma', cab: ['lucas', 'gabi', 'pipoca'], lugar: 'LOBBY'}};
  const sprites = {}, prontas = Promise.all(['lucas', 'gabi', 'pipoca'].map(async n => { sprites[n] = await Detetive.carregar(n) }));

  document.head.insertAdjacentHTML('beforeend', `<style>
#prova{position:fixed;inset:0;z-index:90;background:#141210 radial-gradient(120% 70% at 50% 0,#2a231c,#141210 70%);color:#F4F1EA;display:none;flex-direction:column;align-items:center;padding:12px 16px calc(18px + env(safe-area-inset-bottom));overflow:auto;overflow-x:hidden}
#prova.on{display:flex}
#prova .tp{width:100%;max-width:420px;display:flex;align-items:center;gap:10px}
#prova .tp .k{font:700 10px "Courier Prime",monospace;letter-spacing:.18em;color:#FDC72F;flex:1}
#prova .x{width:40px;height:40px;border:0;background:none;color:#F4F1EA;font:700 22px/1 sans-serif}
#prova .ps{display:flex;gap:6px;width:100%;max-width:420px;margin:0 0 12px}
#prova .ps span{flex:1;font:700 9px "Courier Prime",monospace;letter-spacing:.14em;color:#F4F1EA55;padding-top:6px;border-top:3px solid #F4F1EA22;transition:.3s}
#prova .ps span.on{color:#FDC72F;border-color:#FDC72F}
#prova .ps span.ok{color:#F4F1EA99;border-color:#F4F1EA99}
#prova .aj{width:100%;max-width:420px;padding-top:84px;margin-bottom:8px}#prova .balao{position:relative;left:auto;bottom:auto;translate:none;width:100%}
#prova .fig{display:flex;align-items:flex-end;flex:none;animation:sobe .5s cubic-bezier(.2,1.4,.4,1) both}
#prova .fig img{max-height:118px;max-width:112px;width:auto;height:auto;filter:drop-shadow(0 6px 6px #0008)}
#prova .fig.g img{max-width:62px}#prova .fig.g img+img{margin-left:-10px}
#prova .bl{position:relative;background:#F4F1EA;color:#111;border-radius:16px;padding:10px 13px 11px;font:700 19px/1.15 Caveat,cursive;margin-bottom:26px;box-shadow:0 6px 18px #0007;animation:pop .35s cubic-bezier(.2,1.5,.4,1) both}
#prova .bl::before{content:"";position:absolute;left:-9px;bottom:10px;border:9px solid transparent;border-right-color:#F4F1EA;border-left:0}
#prova .bl b{display:block;font:400 12px Anton;letter-spacing:.1em;color:#C8102E;margin-bottom:2px}
@keyframes sobe{from{transform:translateY(40px);opacity:0}}
@keyframes pop{from{transform:scale(.8) translateY(8px);opacity:0}}

/* foto */
#prova .btn{margin-top:14px;width:100%;max-width:420px}
#prova .cam{position:relative;width:100%;max-width:420px}
#prova canvas{display:block;width:100%;height:auto;border-radius:4px;box-shadow:0 14px 40px #000a}
#prova .cnt{position:absolute;inset:0;display:grid;place-items:center;font:400 120px Anton;color:#FDC72F;text-shadow:0 4px 0 #111;pointer-events:none}
#prova .bar{display:flex;gap:10px;align-items:center;justify-content:center;width:100%;max-width:420px;margin-top:14px}
#prova .disp{width:74px;height:74px;border-radius:50%;border:5px solid #F4F1EA;background:#FDC72F;flex:none}
#prova .disp:active{transform:scale(.94)}
#prova .sec{flex:1;height:48px;border-radius:24px;border:1.5px solid #F4F1EA55;background:none;color:#F4F1EA;font:700 12px "Courier Prime",monospace;letter-spacing:.06em;display:grid;place-items:center;cursor:pointer}
#prova .sec input{display:none}
#prova .pul{margin-top:10px;background:none;border:0;color:#999;font:700 12px "Courier Prime",monospace;text-decoration:underline}
#prova [hidden]{display:none!important}
</style>`);
  document.body.insertAdjacentHTML('beforeend', `<div id="prova" aria-hidden="true">
  <div class="tp"><div class="k" id="pvK">PROVA 03</div><button class="x" id="pvX" aria-label="Fechar">✕</button></div>
  <div class="ps" id="pvPs"><span>1 · FOTO</span><span>2 · ÁLBUM</span></div>
  <div id="pvFoto">
    <div class="aj" id="pvAj"></div>
    <div class="cam"><canvas id="pvC" width="${W}" height="${H}"></canvas><div class="cnt" id="pvN"></div></div>
    <div class="bar" id="pvB1"><button class="sec" id="pvVira">VIRAR</button><button class="disp" id="pvDisp" aria-label="Tirar foto (3 segundos)"></button><label class="sec">GALERIA<input type="file" accept="image/*" id="pvArq"></label></div>
    <div class="bar" id="pvB2" hidden><button class="sec" id="pvDe">DE NOVO</button><button class="sec" id="pvSh">COMPARTILHAR</button></div>
    <button class="btn" id="pvGu" hidden>Guardar no álbum</button>
    <button class="pul" id="pvPul">pular a foto</button>
  </div></div>`);

  let est = -1, fim = null, fluxo = null, laco = 0, frente = true, foto = null, pedidoCam = 0;
  const q = s => document.querySelector(s), P = q('#prova'), ch = () => q('#pvCh');

  /* ---------- som e fala ---------- */
  let A = null;
  const tom = (f, d = .12, t = 'triangle', v = .16) => { try { A = A || new (window.AudioContext || window.webkitAudioContext)(); const n = A.currentTime, o = A.createOscillator(), g = A.createGain();
    o.type = t; o.frequency.value = f; g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(.001, n + d); o.connect(g).connect(A.destination); o.start(n); o.stop(n + d) } catch (_) {} };
  // fala do ajudante no mesmo balão do Bê (#balao), trazido pra dentro da prova
  const fala = (_, t, x) => { const b = q('#balao'); q('#pvAj').append(b); b.classList.remove('on'); void b.offsetWidth; beFala(x, t, {...AJ[est], fixo: true}) };
  const passo = n => q('#pvPs').querySelectorAll('span').forEach((s, i) => { s.className = i < n ? 'ok' : i === n ? 'on' : '' });

  /* ---------- molde da prova ---------- */
  function ajudantes(x) {   // sprites no canto de baixo à direita, pequenos
    const gs = AJ[est].cab.map(n => sprites[n]?.img).filter(g => g?.naturalWidth); if (!gs.length) return;
    const um = gs.length === 1, mh = um ? 230 : 170, mw = um ? 190 : 130; let dir = F.x + F.w - 12;
    [...gs].reverse().forEach(g => { const s = Math.min(mw / g.naturalWidth, mh / g.naturalHeight), w = g.naturalWidth * s, h = g.naturalHeight * s;
      x.drawImage(g, dir - w, F.y + F.h - h - 12, w, h); dir -= w * .74 });
  }
  function molde(x, src, sw, sh, espelho) {
    const a = AJ[est];
    x.fillStyle = '#FBF8F2'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#2a2622'; x.fillRect(F.x, F.y, F.w, F.h);
    if (src && sw) { const s = Math.max(F.w / sw, F.h / sh), w = sw * s, h = sh * s;
      x.save(); x.beginPath(); x.rect(F.x, F.y, F.w, F.h); x.clip();
      if (espelho) { x.translate(F.x * 2 + F.w, 0); x.scale(-1, 1) }
      x.drawImage(src, F.x + (F.w - w) / 2, F.y + Math.min(0, (F.h - h) * .3), w, h); x.restore() }   // corta mais embaixo: cabeça fica
    x.fillStyle = '#111'; x.textBaseline = 'alphabetic'; x.textAlign = 'left';
    x.font = '400 46px Anton'; const t1 = `PROVA ${dois(est + 1)} · ${a.lugar}`; x.fillText(t1, F.x + 4, H - 38);
    const w1 = x.measureText(t1).width; x.font = '700 22px "Courier Prime"'; x.fillStyle = '#777'; x.fillText('— CASO BLACK · VILLAGE RESORT', F.x + w1 + 22, H - 40);
    ajudantes(x);
  }
  const cv = () => q('#pvC'), cx = () => cv().getContext('2d');

  async function ligarCam() {
    pararCam(); foto = null; botoes(false);
    const pedido = pedidoCam;
    try { const recebido = await navigator.mediaDevices.getUserMedia({video: {facingMode: frente ? 'user' : 'environment', width: {ideal: 1280}}, audio: false});
      if (pedido !== pedidoCam) { recebido.getTracks().forEach(t => t.stop()); return }
      fluxo = recebido;
      const v = Object.assign(document.createElement('video'), {playsInline: true, muted: true}); v.srcObject = fluxo; await v.play();
      if (pedido !== pedidoCam) return;
      (function q2() { if (!fluxo || foto) return; molde(cx(), v, v.videoWidth, v.videoHeight, frente); laco = requestAnimationFrame(q2) })();
      ligarCam.v = v; q('#pvVira').hidden = false; q('#pvDisp').hidden = false;
    } catch (e) { if (pedido !== pedidoCam) return; pararCam(); molde(cx(), null); q('#pvVira').hidden = true; q('#pvDisp').hidden = true;
      fala('#pvBl2', 'SEM CÂMERA AQUI', 'Escolha uma foto da equipe na galeria.') }
  }
  function pararCam() { pedidoCam++; cancelAnimationFrame(laco); q('#pvN').textContent = ''; q('#pvDisp').disabled = false; if (fluxo) { fluxo.getTracks().forEach(t => t.stop()); fluxo = null } }
  function botoes(tem) { q('#pvB1').hidden = tem; q('#pvB2').hidden = !tem; q('#pvGu').hidden = !tem; passo(tem ? 1 : 0) }
  function congelar(src, sw, sh, esp) {   // guarda a foto crua (pro PDF/álbum) e mostra com molde
    const r = document.createElement('canvas'), k = Math.min(1, 900 / Math.max(sw, sh)); r.width = sw * k; r.height = sh * k;
    const rx = r.getContext('2d'); if (esp) { rx.translate(r.width, 0); rx.scale(-1, 1) } rx.drawImage(src, 0, 0, r.width, r.height);
    foto = r; pararCam(); molde(cx(), r, r.width, r.height, false); botoes(true); vibra(40); tom(1400, .05, 'square', .06);
    fala('#pvBl2', 'FICOU ÓTIMA!', 'Guardem no álbum do caso ou compartilhem com a família.');
  }
  q('#pvDisp').onclick = () => { const v = ligarCam.v; if (!fluxo || !v) return; let n = 3; const N = q('#pvN');
    q('#pvDisp').disabled = true; (function t() { if (!fluxo) return N.textContent = '';
      if (n) { N.textContent = n--; vibra(15); tom(700, .08); return setTimeout(t, 900) } N.textContent = ''; q('#pvDisp').disabled = false; congelar(v, v.videoWidth, v.videoHeight, frente) })() };
  q('#pvVira').onclick = () => { frente = !frente; ligarCam() };
  q('#pvArq').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; const i = new Image();
    i.onload = () => { congelar(i, i.width, i.height, false); URL.revokeObjectURL(i.src) }; i.src = URL.createObjectURL(f) };
  q('#pvDe').onclick = () => { fala('#pvBl2', 'MAIS UMA!', 'Todo mundo junto de novo.'); ligarCam() };
  q('#pvSh').onclick = () => cv().toBlob(async b => { const f = new File([b], `caso-black-prova-${dois(est + 1)}.jpg`, {type: 'image/jpeg'});
    try { if (navigator.canShare && navigator.canShare({files: [f]})) return await navigator.share({files: [f], text: 'A gente tá investigando o #CasoBlack no @villageresortmg!'}) } catch (e) { if (e.name === 'AbortError') return }
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = f.name; a.click() }, 'image/jpeg', .9);
  q('#pvGu').onclick = () => { if (!foto) return;
    try { localStorage.setItem(fotoKey(est + 1), foto.toDataURL('image/jpeg', .74)) } catch (_) { toast('Sem espaço pra guardar a foto.') }
    typeof pintarAlbum === 'function' && pintarAlbum(); toast('Foto guardada no álbum do caso!'); fechar(true) };
  q('#pvPul').onclick = () => fechar(true);
  q('#pvX').onclick = () => fechar(false);

  function passoFoto() { fala('#pvBl2', 'GUARDA ESSA PROVA', est === 4 ? 'Todo mundo na foto com a turma! Essa é a última do álbum.' : `Todo mundo na foto com ${est === 2 ? 'a' : 'o'} ${AJ[est].nome}! Ela vai pro álbum do caso.`);
    passo(0); P.scrollTop = 0; ligarCam() }

  function fechar(ok) { const b = q('#balao'); b.classList.remove('on'); document.body.append(b); pararCam(); P.classList.remove('on'); P.setAttribute('aria-hidden', 'true'); const f = fim; fim = null; if (ok && f) f() }
  async function abrir(i, depois) {
    est = i; fim = depois; foto = null; q('#pvK').textContent = `PROVA ${dois(i + 1)} · ${AJ[i].lugar}`;
    P.classList.add('on'); P.setAttribute('aria-hidden', 'false'); document.fonts && document.fonts.load('400 46px Anton');
    await prontas; if (est === i && P.classList.contains('on')) passoFoto();
  }
  return {tem: i => !!AJ[i], aj: i => AJ[i], abrir, foto: i => abrir(i, null)};
})();
/* chamado no lugar de marcar(): achou a pista, a equipe tira a foto no molde antes do carimbo */
function resolver(i, via) { if (Prova.tem(i) && !achadas.includes(i)) Prova.abrir(i, () => marcar(i, via)); else marcar(i, via) }
/* a folha pode ter pintado antes da turma carregar */
if (typeof pintarEstacoes === "function") { pintarEstacoes(); pintarAlbum() }
