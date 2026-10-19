/* Caso Black · foto de detetive (fim do caso)
   Câmera frontal + MediaPipe Face Landmarker: chapéu na testa e óculos nos olhos, moldura por cima.
   Artes (PNG transparente) em assets/filtro/: chapeu.png, oculos.png, moldura.png (1080x1920, fonte moldura.svg).
   Com moldura, a câmera entra só no furo da folha (JANELA, girada como a folha).
   Sem arquivo, usa o desenho reserva. Sem rastreio (modelo não carregou), o chapéu fica fixo no topo. */
window.Filtro = (() => {
  const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  const MODELO = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
  const W = 1080, H = 1920, img = {};
  const JANELA = {cx: 539.35, cy: 755, w: 724, h: 824, ang: -2.5 * Math.PI / 180};   // furo de moldura.svg (+2 px por baixo da borda)
  let rosto = null, carregando = null, fluxo = null, laco = 0, ui = null, ultimo = null, suave = null;

  const carregaImg = n => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = `assets/filtro/${n}.png` });
  async function prepara() {
    if (carregando) return carregando;
    carregando = (async () => {
      [img.chapeu, img.oculos, img.moldura] = await Promise.all(['chapeu', 'oculos', 'moldura'].map(carregaImg));
      img.logo = await new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = 'assets/cb-logo.png' });
      try {
        const v = await import(MP + '/vision_bundle.mjs');
        const fs = await v.FilesetResolver.forVisionTasks(MP + '/wasm');
        rosto = await v.FaceLandmarker.createFromOptions(fs, {baseOptions: {modelAssetPath: MODELO, delegate: 'GPU'}, runningMode: 'VIDEO', numFaces: 3});
      } catch (e) { rosto = null }
    })();
    return carregando;
  }

  function monta() {
    document.body.insertAdjacentHTML('beforeend', `<div id="filtro" aria-hidden="true">
      <canvas id="fiC" width="${W}" height="${H}"></canvas><video id="fiV" playsinline muted style="display:none"></video>
      <img id="fiFoto" alt="Sua foto de detetive">
      <button class="x" id="fiX" aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="fiMsg" id="fiMsg">PREPARANDO O DISFARCE…</div>
      <div class="fiBar vivo"><button class="fiDisp" id="fiDisp" aria-label="Tirar foto"></button></div>
      <div class="fiBar pronta"><button class="btn alt" id="fiDe">Refazer</button><button class="btn brilho" id="fiShare">Compartilhar</button></div>
    </div>`);
    ui = $('#filtro');
    $('#fiX').onclick = fechar; $('#fiDisp').onclick = disparar; $('#fiDe').onclick = () => { ui.classList.remove('foto'); };
    $('#fiShare').onclick = compartilhar;
  }

  /* desenhos reserva (quando o PNG do layout ainda não existe) */
  function chapeuReserva(x, w) {
    const h = w * .62; x.save(); x.translate(-w / 2, -h);
    x.fillStyle = '#5b3d22'; x.beginPath(); x.ellipse(w / 2, h * .9, w / 2, h * .13, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(w * .2, h * .88); x.bezierCurveTo(w * .18, h * .2, w * .34, h * .02, w / 2, h * .12); x.bezierCurveTo(w * .66, h * .02, w * .82, h * .2, w * .8, h * .88); x.closePath(); x.fill();
    x.fillStyle = '#111'; x.fillRect(w * .2, h * .66, w * .6, h * .14);
    x.fillStyle = '#FDC72F'; x.font = `400 ${h * .1}px Anton`; x.textAlign = 'center'; x.fillText('CASO BLACK', w / 2, h * .77);
    x.restore();
  }
  function oculosReserva(x, w) {
    const r = w * .2; x.save(); x.lineWidth = w * .045; x.strokeStyle = '#111'; x.fillStyle = '#11111155';
    [-1, 1].forEach(s => { x.beginPath(); x.arc(s * w * .25, 0, r, 0, Math.PI * 2); x.fill(); x.stroke() });
    x.beginPath(); x.moveTo(-w * .05, -r * .2); x.quadraticCurveTo(0, -r * .5, w * .05, -r * .2); x.stroke(); x.restore();
  }
  function molduraReserva(x) {
    x.save(); x.lineWidth = 36; x.strokeStyle = '#FDC72F'; x.strokeRect(18, 18, W - 36, H - 36);
    x.fillStyle = '#111'; x.fillRect(0, H - 250, W, 250);
    x.fillStyle = '#FDC72F'; x.font = '400 92px Anton'; x.textAlign = 'center'; x.fillText('INVESTIGADOR OFICIAL', W / 2, H - 140);
    x.fillStyle = '#fff'; x.font = '700 34px "Courier Prime"'; x.fillText('CASO Nº 2026-BF · VILLAGE RESORT', W / 2, H - 80);
    if (img.logo) { const lw = 300, lh = lw * img.logo.height / img.logo.width; x.drawImage(img.logo, 60, 60, lw, lh) }
    x.restore();
  }

  function quadro() {
    if (!fluxo) return;
    const v = $('#fiV'), c = $('#fiC'), x = c.getContext('2d'), vw = v.videoWidth, vh = v.videoHeight;
    if (vw) {
      const J = img.moldura ? JANELA : {cx: W / 2, cy: H / 2, w: W, h: H, ang: 0};
      x.fillStyle = '#111'; x.fillRect(0, 0, W, H);
      x.save(); x.translate(J.cx, J.cy); x.rotate(J.ang); x.beginPath(); x.rect(-J.w / 2, -J.h / 2, J.w, J.h); x.clip(); x.translate(-J.w / 2, -J.h / 2);
      const s = Math.max(J.w / vw, J.h / vh), dw = vw * s, dh = vh * s, ox = (J.w - dw) / 2, oy = (J.h - dh) / 2;
      x.save(); x.translate(J.w, 0); x.scale(-1, 1); x.drawImage(v, ox, oy, dw, dh); x.restore();   // espelhado, como um espelho
      let faces = [];
      if (rosto) { try { faces = rosto.detectForVideo(v, performance.now()).faceLandmarks || [] } catch (e) {} }
      const P = (f, i) => [J.w - (ox + f[i].x * dw), oy + f[i].y * dh];
      if (!suave || suave.length !== faces.length) suave = faces.map(() => null);
      faces.forEach((f, n) => {
        const a = P(f, 33), b = P(f, 263), e = P(f, 234), d = P(f, 454), t = P(f, 10), m = P(f, 168);
        const [L, R] = a[0] < b[0] ? [a, b] : [b, a];   // olho da esquerda e da direita na tela
        const alvo = {ang: Math.atan2(R[1] - L[1], R[0] - L[0]), lw: Math.hypot(d[0] - e[0], d[1] - e[1]), ow: Math.hypot(b[0] - a[0], b[1] - a[1]), t, m};
        const g = suave[n] || (suave[n] = alvo), k = .45;
        ['ang', 'lw', 'ow'].forEach(p => g[p] += (alvo[p] - g[p]) * k);
        ['t', 'm'].forEach(p => g[p] = [g[p][0] + (alvo[p][0] - g[p][0]) * k, g[p][1] + (alvo[p][1] - g[p][1]) * k]);
        // óculos: largura ~1,5x a distância dos cantos dos olhos, centro no meio dos olhos
        x.save(); x.translate(g.m[0], g.m[1]); x.rotate(g.ang); const ow = g.ow * 1.5;
        if (img.oculos) x.drawImage(img.oculos, -ow / 2, -ow * img.oculos.height / img.oculos.width / 2, ow, ow * img.oculos.height / img.oculos.width); else oculosReserva(x, ow);
        x.restore();
        // chapéu: largura ~1,6x a do rosto, base um pouco abaixo do topo da testa
        x.save(); x.translate(g.t[0], g.t[1]); x.rotate(g.ang); x.translate(0, g.lw * .12); const cw = g.lw * 1.6;
        if (img.chapeu) { const ch = cw * img.chapeu.height / img.chapeu.width; x.drawImage(img.chapeu, -cw / 2, -ch, cw, ch) } else chapeuReserva(x, cw);
        x.restore();
      });
      if (!faces.length) { x.save(); x.translate(J.w / 2, J.h * .3); const cw = J.w * .62; if (img.chapeu) { const ch = cw * img.chapeu.height / img.chapeu.width; x.drawImage(img.chapeu, -cw / 2, -ch, cw, ch) } else chapeuReserva(x, cw); x.restore() }
      x.restore();
      $('#fiMsg').textContent = faces.length ? '' : rosto ? 'MOSTRE O ROSTO PRA CÂMERA' : 'ENCAIXE A CABEÇA NO CHAPÉU';
      if (img.moldura) x.drawImage(img.moldura, 0, 0, W, H); else molduraReserva(x);
    }
    laco = requestAnimationFrame(quadro);
  }

  async function abrir() {
    if (!ui) monta();
    ui.className = 'on'; ui.setAttribute('aria-hidden', 'false'); $('#fiMsg').textContent = 'PREPARANDO O DISFARCE…';
    try {
      fluxo = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'user', width: {ideal: 1280}, height: {ideal: 720}}, audio: false});
      const v = $('#fiV'); v.srcObject = fluxo; await v.play();
    } catch (e) { $('#fiMsg').textContent = 'SEM CÂMERA AQUI. PERMITA A CÂMERA E TENTE DE NOVO.'; return }
    prepara().then(() => { suave = null });
    cancelAnimationFrame(laco); quadro();
  }
  function fechar() {
    cancelAnimationFrame(laco); if (fluxo) { fluxo.getTracks().forEach(t => t.stop()); fluxo = null }
    if (ui) { ui.className = ''; ui.setAttribute('aria-hidden', 'true') }
  }
  function disparar() {
    vibra(30); ui.classList.add('flash'); setTimeout(() => ui.classList.remove('flash'), 300);
    $('#fiC').toBlob(b => { ultimo = b; const f = $('#fiFoto'); if (f.src) URL.revokeObjectURL(f.src); f.src = URL.createObjectURL(b); ui.classList.add('foto') }, 'image/jpeg', .92);
  }
  async function compartilhar() {
    if (!ultimo) return;
    const arq = new File([ultimo], 'caso-black-detetive.jpg', {type: 'image/jpeg'});
    try {
      if (navigator.canShare && navigator.canShare({files: [arq]})) return await navigator.share({files: [arq], title: 'Caso Black', text: 'Resolvi o Caso Black no Village Resort! #CasoBlack'});
    } catch (e) { if (e.name === 'AbortError') return }
    const a = document.createElement('a'); a.href = URL.createObjectURL(ultimo); a.download = arq.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Foto salva. Posta e marca o Village!');
  }
  return {abrir, fechar, prepara};
})();
