/* Caso Black · rodada de cada placa: puzzle → foto da equipe com o molde da prova → álbum.
   Estação sem puzzle aqui segue direto pro carimbo. Índices 0-based (2 = Kids). */
const Prova = (() => {
  const W = 1080, H = 1350, F = {x: 44, y: 44, w: 992, h: 1116};   // molde 4:5 · janela da foto
  const AJ = {2: {nome: 'Gabi', img: 'assets/gabi.webp', lugar: 'KIDS'}};
  const imgs = {}; const img = u => imgs[u] || (imgs[u] = Object.assign(new Image(), {src: u}));
  Object.values(AJ).forEach(a => img(a.img));

  document.head.insertAdjacentHTML('beforeend', `<style>
#prova{position:fixed;inset:0;z-index:90;background:#141210;color:#F4F1EA;display:none;flex-direction:column;align-items:center;padding:14px 16px calc(16px + env(safe-area-inset-bottom));overflow:auto}
#prova.on{display:flex}
#prova .tp{width:100%;max-width:420px;display:flex;align-items:center;gap:10px;margin-bottom:6px}
#prova .tp .k{font:700 10px "Courier Prime",monospace;letter-spacing:.18em;color:#FDC72F;flex:1}
#prova .x{width:40px;height:40px;border:0;background:none;color:#F4F1EA;font:700 22px/1 sans-serif}
#prova .aj{display:flex;align-items:flex-end;gap:10px;width:100%;max-width:420px}
#prova .aj img{width:96px;flex:none}
#prova .bl{background:#F4F1EA;color:#111;border-radius:14px 14px 14px 2px;padding:10px 12px;font:700 19px/1.15 Caveat,cursive;margin-bottom:22px}
#prova .bl b{display:block;font:400 12px Anton;letter-spacing:.1em;color:#C8102E}
#prova .ch{position:relative;width:100%;max-width:420px;aspect-ratio:1;margin-top:10px;border-radius:12px;overflow:hidden;
  background:#e9dcc0 radial-gradient(#d8c59f 1.2px,transparent 1.4px) 0 0/14px 14px;touch-action:manipulation}
#prova .pe{position:absolute;transform:translate(-50%,-50%) rotate(var(--r));border:0;background:none;padding:6px;color:#5b4632;transition:color .2s}
#prova .pe svg{display:block;width:100%;height:auto}
#prova .pe.ok{color:#FDC72F;filter:drop-shadow(0 2px 0 #111)}
#prova .pe i{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(calc(-1 * var(--r)));font:400 20px Anton;color:#111;font-style:normal}
#prova .ch.erra{animation:trem .35s}
@keyframes trem{25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}
#prova .dc{font:13px/1.4 "Courier Prime",monospace;color:#bbb;max-width:420px;width:100%;margin:10px 0 0;min-height:36px}
#prova .btn{margin-top:12px;width:100%;max-width:420px}
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
  <div id="pvPuz">
    <div class="aj"><img id="pvAj" alt=""><div class="bl" id="pvBl"></div></div>
    <div class="ch" id="pvCh"></div>
    <p class="dc" id="pvDc"></p>
    <button class="btn" id="pvOk" hidden>Agora, foto da equipe!</button>
  </div>
  <div id="pvFoto" hidden>
    <div class="aj"><img id="pvAj2" alt=""><div class="bl" id="pvBl2"><b>GUARDA ESSA PROVA</b>Todo mundo na foto! Ela vai pro álbum do caso.</div></div>
    <div class="cam"><canvas id="pvC" width="${W}" height="${H}"></canvas><div class="cnt" id="pvN"></div></div>
    <div class="bar" id="pvB1"><button class="sec" id="pvVira">VIRAR</button><button class="disp" id="pvDisp" aria-label="Tirar foto (3 segundos)"></button><label class="sec">GALERIA<input type="file" accept="image/*" id="pvArq"></label></div>
    <div class="bar" id="pvB2" hidden><button class="sec" id="pvDe">DE NOVO</button><button class="sec" id="pvSh">COMPARTILHAR</button></div>
    <button class="btn" id="pvGu" hidden>Guardar no álbum</button>
    <button class="pul" id="pvPul">pular a foto</button>
  </div></div>`);

  let est = -1, fim = null, fluxo = null, laco = 0, frente = true, foto = null, ordem = [], prox = 0;
  const q = s => document.querySelector(s), P = q('#prova');

  /* ---------- puzzle Kids: pegadas da menor pra maior ---------- */
  const PE = '<svg viewBox="0 0 40 64" fill="currentColor"><ellipse cx="20" cy="40" rx="12" ry="17"/><circle cx="8" cy="14" r="4.2"/><circle cx="15.5" cy="8" r="4.6"/><circle cx="24" cy="7" r="4.6"/><circle cx="32" cy="12" r="4.2"/></svg>';
  function puzKids() {
    q('#pvBl').innerHTML = '<b>GABI ACHOU UM RASTRO</b>Pegadas no parquinho! Toque da <u>menor</u> pra <u>maior</u> pra seguir o caminho.';
    q('#pvDc').textContent = 'Toque na menor pegada.';
    const tam = [44, 56, 68, 80, 94].sort(() => Math.random() - .5), pos = [[24, 24], [72, 22], [48, 52], [22, 76], [76, 74]].sort(() => Math.random() - .5);
    ordem = tam.map((t, k) => ({t, k})).sort((a, b) => a.t - b.t).map(o => o.k); prox = 0;
    const ch = q('#pvCh');
    ch.innerHTML = tam.map((t, k) => `<button class="pe" data-k="${k}" style="left:${pos[k][0]}%;top:${pos[k][1]}%;width:${t}px;--r:${(k * 47 % 60) - 30}deg" aria-label="Pegada">${PE}<i></i></button>`).join('');
    ch.querySelectorAll('.pe').forEach(b => b.onclick = () => {
      if (prox >= 5 || b.classList.contains('ok')) return;
      if (+b.dataset.k !== ordem[prox]) {
        ch.classList.remove('erra'); void ch.offsetWidth; ch.classList.add('erra'); vibra([20, 30, 20]);
        ch.querySelectorAll('.pe').forEach(e => { e.classList.remove('ok'); e.querySelector('i').textContent = '' }); prox = 0;
        q('#pvDc').textContent = 'Opa, essa não. Recomeça pela menor!'; return }
      b.classList.add('ok'); b.querySelector('i').textContent = ++prox; vibra(25);
      q('#pvDc').textContent = prox < 5 ? `Boa! Agora a ${prox + 1}ª.` : '';
      if (prox === 5) setTimeout(() => {
        q('#pvBl').innerHTML = '<b>RASTRO SEGUIDO!</b>As pegadas crescem… alguém passou correndo por aqui. Pista do Kids encontrada!';
        q('#pvOk').hidden = false; vibra([40, 30, 80]) }, 350);
    });
  }
  const PUZ = {2: puzKids};

  /* ---------- molde da prova ---------- */
  function molde(x, src, sw, sh, espelho) {
    const a = AJ[est];
    x.fillStyle = '#FBF8F2'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#2a2622'; x.fillRect(F.x, F.y, F.w, F.h);
    if (src && sw) { const s = Math.max(F.w / sw, F.h / sh), w = sw * s, h = sh * s;
      x.save(); x.beginPath(); x.rect(F.x, F.y, F.w, F.h); x.clip();
      if (espelho) { x.translate(F.x * 2 + F.w, 0); x.scale(-1, 1) }
      x.drawImage(src, F.x + (F.w - w) / 2, F.y + Math.min(0, (F.h - h) * .3), w, h); x.restore() }   // corta mais embaixo: cabeça fica
    x.fillStyle = '#111'; x.textBaseline = 'alphabetic';
    x.font = '400 50px Anton'; x.fillText(`PROVA ${dois(est + 1)} · ${a.lugar}`, F.x + 12, H - 66);
    x.font = '700 24px "Courier Prime"'; x.fillStyle = '#555'; x.fillText('CASO BLACK · VILLAGE RESORT', F.x + 14, H - 30);
    const g = img(a.img); if (g.complete && g.naturalWidth) { const gw = 330, gh = gw * g.naturalHeight / g.naturalWidth; x.drawImage(g, W - gw - 8, H - gh - 6, gw, gh) }
  }
  const cv = () => q('#pvC'), cx = () => cv().getContext('2d');

  async function ligarCam() {
    pararCam(); foto = null; botoes(false);
    try { fluxo = await navigator.mediaDevices.getUserMedia({video: {facingMode: frente ? 'user' : 'environment', width: {ideal: 1280}}, audio: false});
      const v = Object.assign(document.createElement('video'), {playsInline: true, muted: true}); v.srcObject = fluxo; await v.play();
      (function q2() { if (!fluxo || foto) return; molde(cx(), v, v.videoWidth, v.videoHeight, frente); laco = requestAnimationFrame(q2) })();
      ligarCam.v = v; q('#pvVira').hidden = false; q('#pvDisp').hidden = false;
    } catch (e) { molde(cx(), null); q('#pvVira').hidden = true; q('#pvDisp').hidden = true;
      q('#pvBl2').innerHTML = '<b>SEM CÂMERA AQUI</b>Escolha uma foto da equipe na galeria.' }
  }
  function pararCam() { cancelAnimationFrame(laco); if (fluxo) { fluxo.getTracks().forEach(t => t.stop()); fluxo = null } }
  function botoes(tem) { q('#pvB1').hidden = tem; q('#pvB2').hidden = !tem; q('#pvGu').hidden = !tem }
  function congelar(src, sw, sh, esp) {   // guarda a foto crua (pro PDF/álbum) e mostra com molde
    const r = document.createElement('canvas'), k = Math.min(1, 900 / Math.max(sw, sh)); r.width = sw * k; r.height = sh * k;
    const rx = r.getContext('2d'); if (esp) { rx.translate(r.width, 0); rx.scale(-1, 1) } rx.drawImage(src, 0, 0, r.width, r.height);
    foto = r; pararCam(); molde(cx(), r, r.width, r.height, false); botoes(true); vibra(40);
  }
  q('#pvDisp').onclick = () => { const v = ligarCam.v; if (!fluxo || !v) return; let n = 3; const N = q('#pvN');
    q('#pvDisp').disabled = true; (function t() { if (!fluxo) return N.textContent = '';
      if (n) { N.textContent = n--; vibra(15); return setTimeout(t, 900) } N.textContent = ''; q('#pvDisp').disabled = false; congelar(v, v.videoWidth, v.videoHeight, frente) })() };
  q('#pvVira').onclick = () => { frente = !frente; ligarCam() };
  q('#pvArq').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; const i = new Image();
    i.onload = () => { congelar(i, i.width, i.height, false); URL.revokeObjectURL(i.src) }; i.src = URL.createObjectURL(f) };
  q('#pvDe').onclick = ligarCam;
  q('#pvSh').onclick = () => cv().toBlob(async b => { const f = new File([b], `caso-black-prova-${dois(est + 1)}.jpg`, {type: 'image/jpeg'});
    try { if (navigator.canShare && navigator.canShare({files: [f]})) return await navigator.share({files: [f], text: 'A gente tá investigando o #CasoBlack no @villageresortmg!'}) } catch (e) { if (e.name === 'AbortError') return }
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = f.name; a.click() }, 'image/jpeg', .9);
  q('#pvGu').onclick = () => { if (!foto) return;
    try { localStorage.setItem(fotoKey(est + 1), foto.toDataURL('image/jpeg', .74)) } catch (_) { toast('Sem espaço pra guardar a foto.') }
    typeof pintarAlbum === 'function' && pintarAlbum(); toast('Foto guardada no álbum do caso!'); fechar(true) };
  q('#pvPul').onclick = () => fechar(true);
  q('#pvX').onclick = () => fechar(false);

  function passoFoto() { q('#pvBl2').innerHTML = '<b>GUARDA ESSA PROVA</b>Todo mundo na foto! Ela vai pro álbum do caso.'; q('#pvPuz').hidden = true; q('#pvFoto').hidden = false; q('#pvAj2').src = AJ[est].img; ligarCam() }
  q('#pvOk').onclick = passoFoto;

  function fechar(ok) { pararCam(); P.classList.remove('on'); P.setAttribute('aria-hidden', 'true'); const f = fim; fim = null; if (ok && f) f() }
  function abrir(i, depois) {
    est = i; fim = depois; foto = null; q('#pvK').textContent = `PROVA ${dois(i + 1)} · ${AJ[i].lugar}`;
    q('#pvAj').src = AJ[i].img; q('#pvOk').hidden = true; q('#pvPuz').hidden = false; q('#pvFoto').hidden = true;
    PUZ[i](); P.classList.add('on'); P.setAttribute('aria-hidden', 'false');
    document.fonts && document.fonts.load('400 50px Anton');
  }
  return {tem: i => !!PUZ[i], abrir, foto: i => { est = i; fim = null; P.classList.add('on'); passoFoto() }};
})();
/* chamado no lugar de marcar(): estação com puzzle passa pela rodada antes do carimbo */
function resolver(i, via) { if (Prova.tem(i) && !achadas.includes(i)) Prova.abrir(i, () => marcar(i, via)); else marcar(i, via) }
