/* Caso Black · rodada de cada placa: puzzle → foto da equipe com o molde da prova → álbum.
   Índices 0-based (0 Água · 1 Sabor · 2 Kids · 3 Natureza · 4 Lobby). Sprites provisórios (vêm do Turma do Bê 2D.ai). */
const Prova = (() => {
  const W = 1080, H = 1350, F = {x: 44, y: 44, w: 992, h: 1116};   // molde 4:5 · janela da foto
  const LU = 'assets/lucas.webp', GA = 'assets/gabi.webp', PI = 'assets/pipoca.webp', BE = 'assets/be-cabeca.png';
  const AJ = {
    0: {nome: 'Lucas', imgs: [LU], lugar: 'ÁGUA'},
    1: {nome: 'Lucas', imgs: [LU], lugar: 'SABOR'},
    2: {nome: 'Gabi', imgs: [GA], lugar: 'KIDS'},
    3: {nome: 'Pipoca', imgs: [PI], lugar: 'NATUREZA'},
    4: {nome: 'Turma', imgs: [LU, GA, PI], lugar: 'LOBBY'}};
  const imgs = {}; const img = u => imgs[u] || (imgs[u] = Object.assign(new Image(), {src: u}));
  [LU, GA, PI, BE].forEach(img);

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
#prova .aj{display:flex;align-items:flex-end;gap:8px;width:100%;max-width:420px;min-height:112px}
#prova .fig{display:flex;align-items:flex-end;flex:none;animation:sobe .5s cubic-bezier(.2,1.4,.4,1) both}
#prova .fig img{max-height:118px;max-width:112px;width:auto;height:auto;filter:drop-shadow(0 6px 6px #0008)}
#prova .fig.g img{max-width:62px}#prova .fig.g img+img{margin-left:-10px}
#prova .fig.feliz{animation:pula .5s}
#prova .bl{position:relative;background:#F4F1EA;color:#111;border-radius:16px;padding:10px 13px 11px;font:700 19px/1.15 Caveat,cursive;margin-bottom:26px;box-shadow:0 6px 18px #0007;animation:pop .35s cubic-bezier(.2,1.5,.4,1) both}
#prova .bl::before{content:"";position:absolute;left:-9px;bottom:10px;border:9px solid transparent;border-right-color:#F4F1EA;border-left:0}
#prova .bl b{display:block;font:400 12px Anton;letter-spacing:.1em;color:#C8102E;margin-bottom:2px}
#prova .ch{position:relative;width:100%;max-width:420px;margin-top:4px;border-radius:14px;overflow:hidden;touch-action:manipulation;box-shadow:0 14px 34px #000a,inset 0 0 0 3px #111;-webkit-user-select:none;user-select:none}
#prova .ch.erra{animation:trem .35s}
#prova .ex{width:100%;max-width:420px}
#prova .dc{font:13px/1.4 "Courier Prime",monospace;color:#c9c2b4;max-width:420px;width:100%;margin:10px 0 0;min-height:20px}
#prova .btn{margin-top:14px;width:100%;max-width:420px}
#prova .btn.vai{animation:chama 1.2s ease-in-out infinite}
@keyframes sobe{from{transform:translateY(40px);opacity:0}}
@keyframes pop{from{transform:scale(.8) translateY(8px);opacity:0}}
@keyframes pula{40%{transform:translateY(-16px) rotate(-4deg)}70%{transform:translateY(0) rotate(2deg)}}
@keyframes trem{25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}
@keyframes chama{50%{transform:scale(1.03);box-shadow:0 0 0 6px #FDC72F33}}
@keyframes estrela{from{transform:scale(0) rotate(-30deg);opacity:0}60%{transform:scale(1.25)}to{transform:scale(1)}}
#prova .cf{position:fixed;width:9px;height:14px;z-index:95;pointer-events:none;border-radius:2px;animation:voa 1.1s cubic-bezier(.15,.7,.4,1) forwards}
@keyframes voa{to{transform:translate(var(--dx),var(--dy)) rotate(var(--r));opacity:0}}

/* Kids · caixa de areia */
#prova .ch.kids{aspect-ratio:1;background:#ecd6a6 radial-gradient(#d6b97f 1.3px,transparent 1.6px) 0 0/13px 13px;box-shadow:0 14px 34px #000a,inset 0 0 0 3px #111,inset 0 0 0 12px #b9813f,inset 0 0 0 14px #111}
#prova .kids .deco{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
#prova .kids .trilha{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
#prova .kids .trilha polyline{fill:none;stroke:#C8102E;stroke-width:1.1;stroke-dasharray:2.4 2;stroke-linecap:round}
#prova .pe{position:absolute;transform:translate(-50%,-50%) rotate(var(--r));border:0;background:none;padding:6px;color:#6b4f35;transition:color .2s,transform .2s}
#prova .pe svg{display:block;width:100%;height:auto;filter:drop-shadow(0 2px 0 #fff6)}
#prova .pe:active{transform:translate(-50%,-50%) rotate(var(--r)) scale(.92)}
#prova .pe.ok{color:#FDC72F}#prova .pe.ok svg{filter:drop-shadow(0 2px 0 #111) drop-shadow(0 0 1px #111)}
#prova .pe i{position:absolute;left:50%;top:58%;width:26px;height:26px;margin:-13px;border-radius:50%;background:#111;color:#FDC72F;display:grid;place-items:center;transform:rotate(calc(-1 * var(--r)));font:400 15px/1 Anton;font-style:normal;animation:estrela .3s both}
#prova .pe i:empty{display:none}

/* Água · jogo da memória na piscina */
#prova .ch.agua{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:14px;perspective:700px;
  background:#2c9fc9 linear-gradient(#ffffff26 2px,transparent 2px) 0 0/100% 30px,#2c9fc9 linear-gradient(90deg,#ffffff26 2px,transparent 2px) 0 0/30px 100%}
#prova .ch.agua::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(60% 30% at 30% 20%,#ffffff30,transparent 70%),radial-gradient(50% 25% at 75% 75%,#ffffff22,transparent 70%)}
#prova .mc{position:relative;aspect-ratio:3/4;border:0;padding:0;background:none;transform-style:preserve-3d;transition:transform .45s cubic-bezier(.3,1.3,.5,1)}
#prova .mc.v,#prova .mc.par{transform:rotateY(180deg)}
#prova .mc>span{position:absolute;inset:0;border-radius:9px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:grid;place-items:center;box-shadow:0 3px 0 #111,inset 0 0 0 2.5px #111}
#prova .mc .cv{background:#FDC72F;font:400 22px Anton;color:#111}
#prova .mc .cv svg{width:60%}
#prova .mc .fr{background:#F4F1EA;transform:rotateY(180deg)}
#prova .mc .fr svg{width:78%}
#prova .mc.par .fr{background:#fff3c4;box-shadow:0 3px 0 #111,inset 0 0 0 2.5px #111,inset 0 0 0 6px #FDC72F}

/* Sabor · toalha xadrez e bilhete da receita */
#prova .ch.sabor{padding:12px;background-color:#f7f2e8;background-image:linear-gradient(90deg,#c8102e40 50%,transparent 50%),linear-gradient(#c8102e40 50%,transparent 50%);background-size:34px 34px}
#prova .nota{background:#F4F1EA;color:#111;padding:12px 14px 10px;border-radius:3px;box-shadow:0 6px 14px #0005;transform:rotate(-1.2deg);position:relative;margin:4px 4px 14px}
#prova .nota::before{content:"";position:absolute;top:-8px;left:50%;width:84px;height:20px;margin-left:-42px;background:#efe6b0d9;transform:rotate(3deg)}
#prova .nota h4{margin:0 0 6px;font:400 13px Anton;letter-spacing:.12em;color:#C8102E}
#prova .nota ol{margin:0;padding:0;list-style:none;font:700 18px/1.2 Caveat,cursive}
#prova .nota li{display:flex;gap:7px;align-items:baseline;padding:2px 0;transition:.3s}
#prova .nota li::before{content:"";flex:none;width:13px;height:13px;border:2px solid #111;border-radius:3px;transform:translateY(2px)}
#prova .nota li.ok{color:#888;text-decoration:line-through #C8102E 2px}
#prova .nota li.ok::before{background:#FDC72F;box-shadow:inset 0 0 0 2px #F4F1EA}
#prova .pratos{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
#prova .pr{aspect-ratio:1;border:0;padding:0;border-radius:50%;background:radial-gradient(circle,#fff 52%,#e9e4da 54%,#fff 64%);box-shadow:0 4px 0 #111,inset 0 0 0 2.5px #111;display:grid;place-items:center;transition:transform .2s}
#prova .pr svg{width:70%;transition:transform .3s}
#prova .pr:active{transform:scale(.94)}
#prova .pr.ok{background:radial-gradient(circle,#fff3c4 52%,#FDC72F 54%,#fff3c4 64%)}
#prova .pr.ok svg{transform:scale(1.12) rotate(-8deg)}
#prova .pr.erra{animation:trem .3s}

/* Natureza · cena de achar objetos */
#prova .ch.natu{aspect-ratio:1;background:#bfe3cf}
#prova .natu svg{display:block;width:100%;height:100%}
#prova .natu .hd{cursor:pointer}
#prova .natu .ach circle.anel{animation:anel .5s both}
@keyframes anel{from{r:0;opacity:0}}
#prova .lista{display:flex;gap:6px;margin-top:12px}
#prova .lista span{flex:1;aspect-ratio:1;border-radius:10px;background:#F4F1EA14;border:1.5px dashed #F4F1EA44;display:grid;place-items:center;transition:.3s}
#prova .lista span svg{width:70%;filter:grayscale(1) brightness(.5);opacity:.6;transition:.3s}
#prova .lista span.ok{background:#F4F1EA;border:1.5px solid #FDC72F}
#prova .lista span.ok svg{filter:none;opacity:1;animation:estrela .4s both}

/* Lobby · cofre */
#prova .ch.lobby{padding:16px;background:#2b2d31 radial-gradient(130% 90% at 30% 0,#4a4d53,#1d1e21)}
#prova .cofre{position:relative;border-radius:12px;padding:18px 14px 16px;background:linear-gradient(145deg,#6b6f76,#3b3e43);box-shadow:inset 0 0 0 3px #111,inset 0 2px 0 5px #ffffff22,0 8px 0 #111;transform-origin:left center;transition:transform .9s cubic-bezier(.5,0,.3,1.2)}
#prova .cofre .rb{position:absolute;width:10px;height:10px;border-radius:50%;background:#2b2d31;box-shadow:inset 0 0 0 2px #111,inset 1px 1px 0 3px #ffffff33}
#prova .cofre .lz{position:absolute;top:12px;right:14px;width:12px;height:12px;border-radius:50%;background:#7a1010;box-shadow:inset 0 0 0 2px #111;transition:.2s}
#prova .cofre .lz.vm{background:#ff3b3b;box-shadow:inset 0 0 0 2px #111,0 0 12px #ff3b3b}
#prova .cofre .lz.vd{background:#4cff6a;box-shadow:inset 0 0 0 2px #111,0 0 12px #4cff6a}
#prova .cofre h4{margin:0 0 12px;text-align:center;font:700 10px "Courier Prime",monospace;letter-spacing:.3em;color:#e9e6df99}
#prova .dis{display:flex;gap:8px;justify-content:center}
#prova .di{flex:1;max-width:66px;display:flex;flex-direction:column;align-items:center;gap:4px}
#prova .di button{width:100%;height:30px;border:0;border-radius:6px;background:#1d1e21;color:#FDC72F;font:700 14px/1 sans-serif;box-shadow:inset 0 0 0 2px #111}
#prova .di button:active{transform:scale(.94)}
#prova .di .nn{width:100%;height:58px;border-radius:8px;background:#F4F1EA;color:#111;display:grid;place-items:center;font:400 40px/1 Anton;box-shadow:inset 0 0 0 3px #111,inset 0 6px 8px #0003}
#prova .di small{font:700 9px "Courier Prime",monospace;color:#e9e6dfaa}
#prova .abre{display:block;margin:14px auto 0;padding:12px 26px;border:0;border-radius:30px;background:#FDC72F;color:#111;font:400 16px Anton;letter-spacing:.12em;box-shadow:0 4px 0 #111,inset 0 0 0 2.5px #111}
#prova .abre:active{transform:translateY(3px);box-shadow:0 1px 0 #111,inset 0 0 0 2.5px #111}
#prova .miolo{position:absolute;inset:16px;border-radius:12px;background:#121315;box-shadow:inset 0 10px 30px #000;display:grid;place-items:center;text-align:center;padding:16px}
#prova .miolo .bh{background:#F4F1EA;color:#111;padding:14px 16px;transform:rotate(-3deg);box-shadow:0 0 30px #FDC72F66;font:700 21px/1.15 Caveat,cursive;max-width:240px}
#prova .miolo .bh b{display:block;font:400 12px Anton;letter-spacing:.12em;color:#C8102E}
#prova .ch.lobby.aberto .cofre{transform:perspective(900px) rotateY(-104deg)}
#prova .pistas{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:6px}
#prova .pistas li{display:flex;align-items:center;gap:10px;background:#F4F1EA0f;border-radius:10px;padding:6px 10px 6px 6px;font:13px/1.3 "Courier Prime",monospace;color:#e6e0d4}
#prova .pistas img{width:38px;height:38px;flex:none;border-radius:50%;object-fit:cover;object-position:50% 8%;background:#F4F1EA;box-shadow:0 0 0 2px #FDC72F}
#prova .pistas b{font:400 18px Anton;color:#FDC72F;flex:none;width:14px}

/* foto */
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
  <div class="ps" id="pvPs"><span>1 · DESAFIO</span><span>2 · FOTO</span><span>3 · ÁLBUM</span></div>
  <div id="pvPuz">
    <div class="aj"><div class="fig" id="pvAj"></div><div class="bl" id="pvBl"></div></div>
    <div class="ch" id="pvCh"></div>
    <div class="ex" id="pvEx"></div>
    <p class="dc" id="pvDc"></p>
    <button class="btn" id="pvOk" hidden>Agora, foto da equipe! 📸</button>
  </div>
  <div id="pvFoto" hidden>
    <div class="aj"><div class="fig" id="pvAj2"></div><div class="bl" id="pvBl2"></div></div>
    <div class="cam"><canvas id="pvC" width="${W}" height="${H}"></canvas><div class="cnt" id="pvN"></div></div>
    <div class="bar" id="pvB1"><button class="sec" id="pvVira">VIRAR</button><button class="disp" id="pvDisp" aria-label="Tirar foto (3 segundos)"></button><label class="sec">GALERIA<input type="file" accept="image/*" id="pvArq"></label></div>
    <div class="bar" id="pvB2" hidden><button class="sec" id="pvDe">DE NOVO</button><button class="sec" id="pvSh">COMPARTILHAR</button></div>
    <button class="btn" id="pvGu" hidden>Guardar no álbum</button>
    <button class="pul" id="pvPul">pular a foto</button>
  </div></div>`);

  let est = -1, fim = null, fluxo = null, laco = 0, frente = true, foto = null;
  const q = s => document.querySelector(s), P = q('#prova'), ch = () => q('#pvCh');
  const mistura = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]] } return a };

  /* ---------- som, festa e fala ---------- */
  let A = null;
  const tom = (f, d = .12, t = 'triangle', v = .16) => { try { A = A || new (window.AudioContext || window.webkitAudioContext)(); const n = A.currentTime, o = A.createOscillator(), g = A.createGain();
    o.type = t; o.frequency.value = f; g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(.001, n + d); o.connect(g).connect(A.destination); o.start(n); o.stop(n + d) } catch (_) {} };
  const acerto = (k = 0) => { tom(660 * Math.pow(1.122, k), .12); vibra(20) };
  const errou = () => { tom(160, .22, 'square', .08); vibra([20, 30, 20]); const c = ch(); c.classList.remove('erra'); void c.offsetWidth; c.classList.add('erra') };
  function festa() {
    const r = ch().getBoundingClientRect(), cores = ['#FDC72F', '#C8102E', '#F4F1EA', '#1d3f8f', '#2c9fc9'];
    for (let i = 0; i < 34; i++) { const s = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 170;
      s.className = 'cf'; s.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;background:${cores[i % 5]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 60}px;--r:${Math.random() * 720 - 360}deg;animation-delay:${Math.random() * .08}s`;
      P.appendChild(s); setTimeout(() => s.remove(), 1300) }
  }
  const fala = (id, t, x) => { const b = q(id); b.innerHTML = `<b>${t}</b>${x}`; b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '' };
  const figura = id => { const a = AJ[est], f = q(id); f.className = 'fig' + (a.imgs.length > 1 ? ' g' : ''); f.innerHTML = a.imgs.map(u => `<img src="${u}" alt="">`).join('') };
  const dica = t => q('#pvDc').innerHTML = t;
  function ganhou(t, x) {
    setTimeout(() => { fala('#pvBl', t, x); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tom(f, .2), i * 110)); vibra([40, 30, 80]); festa();
      const f = q('#pvAj'); f.classList.remove('feliz'); void f.offsetWidth; f.classList.add('feliz');
      dica(''); const ok = q('#pvOk'); ok.hidden = false; ok.classList.add('vai') }, 380);
  }
  const passo = n => q('#pvPs').querySelectorAll('span').forEach((s, i) => { s.className = i < n ? 'ok' : i === n ? 'on' : '' });

  /* ---------- 03 Kids · Gabi: pegadas da menor pra maior ---------- */
  const PE = '<svg viewBox="0 0 40 64" fill="currentColor"><ellipse cx="20" cy="41" rx="12" ry="17"/><ellipse cx="20" cy="47" rx="6" ry="5" fill="#0002"/><circle cx="8" cy="14" r="4.2"/><circle cx="15.5" cy="8" r="4.6"/><circle cx="24" cy="7" r="4.6"/><circle cx="32" cy="12" r="4.2"/></svg>';
  function puzKids() {
    fala('#pvBl', 'GABI ACHOU UM RASTRO', 'Pegadas na areia do parquinho! Toque da <u>menor</u> pra <u>maior</u> pra seguir o caminho.');
    dica('Toque na menor pegada.');
    const tam = mistura([42, 54, 66, 78, 92]), pos = mistura([[26, 26], [72, 24], [50, 52], [26, 76], [74, 74]]);
    const ordem = tam.map((t, k) => ({t, k})).sort((a, b) => a.t - b.t).map(o => o.k); let prox = 0;
    const c = ch(); c.className = 'ch kids';
    c.innerHTML = `<svg class="deco" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <g fill="none" stroke="#b08a52" stroke-width=".6" opacity=".55"><path d="M8 40c10-3 18 2 26-1M60 12c8 2 14-1 22 1M58 90c10-2 18 2 30 0M10 62c6 1 10-2 16 0"/></g>
      <g transform="translate(86 14)" opacity=".8"><path d="M-6 0h12l-2 7h-8z" fill="#C8102E" stroke="#111" stroke-width=".6"/><path d="M-4 0c0-4 8-4 8 0" fill="none" stroke="#111" stroke-width=".6"/></g>
      <g transform="translate(14 88)" opacity=".85"><circle r="4.5" fill="#2c9fc9" stroke="#111" stroke-width=".6"/><path d="M-4.4 0h8.8M0-4.4c2 3 2 6 0 8.8" fill="none" stroke="#F4F1EA" stroke-width=".7"/></g></svg>
      <svg class="trilha" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points=""/></svg>` +
      tam.map((t, k) => `<button class="pe" data-k="${k}" style="left:${pos[k][0]}%;top:${pos[k][1]}%;width:${t}px;--r:${(k * 47 % 60) - 30}deg" aria-label="Pegada">${PE}<i></i></button>`).join('');
    const linha = c.querySelector('.trilha polyline'), feitas = [];
    c.querySelectorAll('.pe').forEach(b => b.onclick = () => {
      if (prox >= 5 || b.classList.contains('ok')) return;
      if (+b.dataset.k !== ordem[prox]) { errou(); c.querySelectorAll('.pe').forEach(e => { e.classList.remove('ok'); e.querySelector('i').textContent = '' });
        prox = 0; feitas.length = 0; linha.setAttribute('points', ''); return dica('Opa, essa não! Recomeça pela <b>menor</b>.') }
      b.classList.add('ok'); b.querySelector('i').textContent = ++prox; acerto(prox);
      feitas.push(pos[+b.dataset.k].join(',')); linha.setAttribute('points', feitas.join(' '));
      dica(prox < 5 ? `Boa! Agora a <b>${prox + 1}ª</b>.` : '');
      if (prox === 5) ganhou('RASTRO SEGUIDO!', 'As pegadas crescem… alguém passou correndo por aqui. Pista do Kids encontrada!');
    });
  }

  /* ---------- 01 Água · Lucas: jogo da memória da piscina ---------- */
  const s64 = (g, vb = '-32 -32 64 64') => `<svg viewBox="${vb}" aria-hidden="true">${g}</svg>`, K = 'stroke="#111" stroke-width="2.5"';
  const PISCINA = {
    boia: `<circle r="22" fill="#C8102E" ${K}/><circle r="16" fill="none" stroke="#fff" stroke-width="10" stroke-dasharray="12.57 12.57"/><circle r="22" fill="none" ${K}/><circle r="10" fill="#F4F1EA" ${K}/>`,
    pato: `<path d="M-22 2c0 14 10 20 22 20s22-6 22-18c-8 3-14 2-18-3l-6 1z" fill="#FDC72F" ${K} stroke-linejoin="round"/><circle cx="-6" cy="-9" r="11" fill="#FDC72F" ${K}/><path d="M-16 -10l-11 3 11 4z" fill="#f08a24" stroke="#111" stroke-width="2" stroke-linejoin="round"/><circle cx="-8" cy="-12" r="2.2"/><path d="M4 8c4 3 9 3 12 0" fill="none" stroke="#c99a1a" stroke-width="2.5" stroke-linecap="round"/>`,
    oculos: `<path d="M-28 -2h56" stroke="#1d3f8f" stroke-width="5" stroke-linecap="round"/><rect x="-23" y="-11" width="19" height="17" rx="8" fill="#7fd0ec" ${K}/><rect x="4" y="-11" width="19" height="17" rx="8" fill="#7fd0ec" ${K}/><path d="M-4 -2h8" ${K}/><path d="M-18 -6l5 0M9 -6l5 0" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`,
    picole: `<rect x="-3.5" y="8" width="7" height="20" rx="3.5" fill="#d9a066" ${K}/><rect x="-13" y="-26" width="26" height="38" rx="12" fill="#f08a24" ${K}/><path d="M-13 -6h26" stroke="#FDC72F" stroke-width="6"/><rect x="-13" y="-26" width="26" height="38" rx="12" fill="none" ${K}/><path d="M-7 -18v6" stroke="#fff9" stroke-width="3" stroke-linecap="round"/>`,
    sol: `<g stroke="#f08a24" stroke-width="4" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M0 -18V-27" transform="rotate(${a})"/>`).join('')}</g><circle r="13" fill="#FDC72F" ${K}/><path d="M-5 2q5 5 10 0" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round"/><circle cx="-5" cy="-3" r="1.8"/><circle cx="5" cy="-3" r="1.8"/>`,
    chinelo: `<g transform="rotate(-18)"><rect x="-11" y="-26" width="22" height="52" rx="11" fill="#1d3f8f" ${K}/><rect x="-7" y="-21" width="14" height="42" rx="7" fill="#2c9fc9"/><path d="M-11 -4L0 -15 11 -4" fill="none" stroke="#FDC72F" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/><circle cy="-15" r="2.5" fill="#111"/></g>`};
  const LUPA = s64('<circle cx="-4" cy="-4" r="13" fill="#F4F1EA" stroke="#111" stroke-width="5"/><path d="M6 6l14 14" stroke="#111" stroke-width="7" stroke-linecap="round"/>');
  function puzAgua() {
    fala('#pvBl', 'LUCAS VIU ALGO NA ÁGUA', 'O Bê bagunçou as coisas da piscina! Ache os <u>6 pares</u> virando duas cartas por vez.');
    const c = ch(); c.className = 'ch agua'; let abertas = [], pares = 0, jogadas = 0, trava = false;
    c.innerHTML = mistura([...Object.keys(PISCINA), ...Object.keys(PISCINA)]).map(k => `<button class="mc" data-k="${k}" aria-label="Carta"><span class="cv">${LUPA}</span><span class="fr">${s64(PISCINA[k])}</span></button>`).join('');
    const conta = () => dica(`Pares: <b>${pares}/6</b> · jogadas: ${jogadas}`); conta();
    c.querySelectorAll('.mc').forEach(b => b.onclick = () => {
      if (trava || b.classList.contains('v') || b.classList.contains('par')) return;
      b.classList.add('v'); tom(520, .06, 'sine', .1); abertas.push(b);
      if (abertas.length < 2) return;
      jogadas++; const [a, z] = abertas; abertas = [];
      if (a.dataset.k === z.dataset.k) { setTimeout(() => { a.classList.add('par'); z.classList.add('par'); a.classList.remove('v'); z.classList.remove('v'); acerto(++pares); conta();
        if (pares === 6) ganhou('TUDO NO LUGAR!', `${jogadas} jogadas! No fundo da piscina, o Lucas achou a pista da Água.`) }, 300) }
      else { trava = true; setTimeout(() => { a.classList.remove('v'); z.classList.remove('v'); trava = false; tom(240, .1, 'sine', .08) }, 850); conta() }
    });
  }

  /* ---------- 02 Sabor · Lucas: receita secreta ---------- */
  const COMIDA = {
    tomate: `<circle cy="4" r="20" fill="#e2392b" ${K}/><ellipse cx="-8" cy="-3" rx="4" ry="6.5" fill="#fff7" transform="rotate(25 -8 -3)"/><path d="M0 -15l-9 -5 4 7-9 2 10 1 4 6 3-6 10-1-9-2 4-7z" fill="#3f8a3c" stroke="#111" stroke-width="1.8" stroke-linejoin="round"/>`,
    milho: `<path d="M0 -27c10 0 13 14 13 25S7 24 0 24s-13-15-13-26S-10-27 0-27z" fill="#FDC72F" ${K}/><path d="M-9 -14h18M-12 -6h24M-12 2h24M-11 10h22M-5 -24v40M5 -24v40" stroke="#c99a1a" stroke-width="1.6"/><path d="M0 28c-14-3-22-15-21-30 6 9 11 16 21 22z" fill="#5aa04a" stroke="#111" stroke-width="2" stroke-linejoin="round"/><path d="M0 28c14-3 22-15 21-30-6 9-11 16-21 22z" fill="#3f8a3c" stroke="#111" stroke-width="2" stroke-linejoin="round"/>`,
    cenoura: `<path d="M1 -12c-6-9-13-11-15-8 4 2 9 5 12 8M1 -12c0-10 2-16 7-18-2 5-3 11-4 18M1 -12c6-6 13-8 15-5-4 2-9 4-12 6" fill="#3f8a3c" stroke="#111" stroke-width="2" stroke-linejoin="round"/><path d="M-11 -12H13L2 29z" fill="#f08a24" ${K} stroke-linejoin="round"/><path d="M-5 -3h6M-2 7h6M-1 16h4" stroke="#b35a10" stroke-width="2.2" stroke-linecap="round"/>`,
    queijo: `<path d="M-25 18V2L22 -15l4 4V18z" fill="#FDC72F" ${K} stroke-linejoin="round"/><path d="M-25 2L26 -11" stroke="#111" stroke-width="2"/><circle cx="-10" cy="10" r="4.5" fill="#e0a91a"/><circle cx="6" cy="5" r="3" fill="#e0a91a"/><circle cx="15" cy="12" r="4" fill="#e0a91a"/><circle cx="-18" cy="6" r="2" fill="#e0a91a"/>`,
    morango: `<path d="M0 26C-14 16-22 4-20-6c2-8 10-10 20-6 10-4 18-2 20 6 2 10-6 22-20 32z" fill="#e2392b" ${K}/><g fill="#FDC72F">${[[-9, 2], [0, 9], [9, 2], [-4, 16], [4, 16], [0, -3], [-12, -6], [12, -6]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.4" ry="2.2"/>`).join('')}</g><path d="M-12-12l7 5 5-6 5 6 7-5-5-5-7 3-7-3z" fill="#3f8a3c" stroke="#111" stroke-width="2" stroke-linejoin="round"/>`,
    banana: `<path d="M-24 -12c3 28 31 36 47 18 2-3 0-6-3-5-14 10-33 3-38-15z" fill="#FDC72F" ${K} stroke-linejoin="round"/><path d="M-16 -2c6 10 16 14 28 12" fill="none" stroke="#c99a1a" stroke-width="2"/><path d="M-24-12l-3-6 6 2z" fill="#5a3d17" stroke="#111" stroke-width="2" stroke-linejoin="round"/>`,
    pao: `<path d="M-25 10c-4-18 10-27 25-27s29 9 25 27c-1 6-6 9-25 9s-24-3-25-9z" fill="#d9a066" ${K}/><path d="M-13-7l6 10M0-10l6 10M13-7l5 9" stroke="#a5672d" stroke-width="3.5" stroke-linecap="round"/>`,
    ovo: `<path d="M0 -25c12 0 19 18 19 29S10 25 0 25-19 15-19 4-12-25 0-25z" fill="#fffdf6" ${K}/><ellipse cx="-7" cy="-8" rx="3.5" ry="7" fill="#fff" transform="rotate(20 -7 -8)"/><path d="M10 6c0 8-5 12-10 13" fill="none" stroke="#e9e1cf" stroke-width="3" stroke-linecap="round"/>`};
  const RECEITA = [['tomate', 'Vermelho, vai na salada e <u>não</u> é morango'], ['milho', 'Amarelinho, nasce numa espiga'],
    ['cenoura', 'Laranja, o coelho adora'], ['queijo', 'Feito de leite, cheio de buraquinhos']];
  function puzSabor() {
    fala('#pvBl', 'LUCAS ACHOU UMA RECEITA', 'O Bê deixou o lanche secreto pela metade! Leiam as charadas e toquem nos <u>4 ingredientes</u>.');
    const c = ch(); c.className = 'ch sabor'; let n = 0;
    c.innerHTML = `<div class="nota"><h4>RECEITA SECRETA DO BÊ</h4><ol>${RECEITA.map(([k, t]) => `<li data-k="${k}">${t}</li>`).join('')}</ol></div>
      <div class="pratos">${mistura(Object.keys(COMIDA)).map(k => `<button class="pr" data-k="${k}" aria-label="${k}">${s64(COMIDA[k])}</button>`).join('')}</div>`;
    dica('Ingredientes: <b>0/4</b>');
    c.querySelectorAll('.pr').forEach(b => b.onclick = () => {
      if (b.classList.contains('ok') || n >= 4) return;
      const li = c.querySelector(`li[data-k="${b.dataset.k}"]`);
      if (!li) { b.classList.remove('erra'); void b.offsetWidth; b.classList.add('erra'); tom(160, .2, 'square', .08); vibra([20, 30, 20]); return dica(`Hmm, ${b.getAttribute('aria-label')} não está no bilhete. Ingredientes: <b>${n}/4</b>`) }
      b.classList.add('ok'); li.classList.add('ok'); acerto(++n); dica(`Ingredientes: <b>${n}/4</b>`);
      if (n === 4) ganhou('RECEITA COMPLETA!', 'Tomate, milho, cenoura e queijo… o Bê tá preparando um banquete! Pista do Sabor encontrada.');
    });
  }

  /* ---------- 04 Natureza · Pipoca: o que o Bê deixou cair ---------- */
  const OBJ = {
    chapeu: `<ellipse cy="8" rx="22" ry="5.5" fill="#222" ${K}/><path d="M-12 8c0-13 4-18 12-18s12 5 12 18z" fill="#222" ${K}/><path d="M-12 3h24" stroke="#FDC72F" stroke-width="4"/>`,
    oculos: `<path d="M-2 -1h4M-16 -3l-7-4M16 -3l7-4" stroke="#111" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="-9" r="7.5" fill="#333" ${K}/><circle cx="9" r="7.5" fill="#333" ${K}/><path d="M-12 -3l3-2M6 -3l3-2" stroke="#fff8" stroke-width="2" stroke-linecap="round"/>`,
    osso: `<g fill="#fffdf6" ${K}><circle cx="-14" cy="-5" r="5.5"/><circle cx="-14" cy="5" r="5.5"/><circle cx="14" cy="-5" r="5.5"/><circle cx="14" cy="5" r="5.5"/></g><rect x="-14" y="-4" width="28" height="8" fill="#fffdf6"/><path d="M-12 -4h24M-12 4h24" stroke="#111" stroke-width="2.5"/>`,
    lupa: `<path d="M5 5l12 12" stroke="#7a4f2a" stroke-width="6" stroke-linecap="round"/><circle cx="-3" cy="-3" r="10" fill="#bfe3f2" stroke="#111" stroke-width="3.5"/><path d="M-8 -6a6 6 0 0 1 4-4" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    bilhete: `<g transform="rotate(-12)"><rect x="-14" y="-10" width="28" height="20" fill="#F4F1EA" ${K}/><path d="M-9 -4h18M-9 1h18M-9 6h11" stroke="#C8102E" stroke-width="1.8"/></g>`};
  const ONDE = {chapeu: [92, 92, .62], oculos: [214, 291, .62], osso: [292, 352, .7], lupa: [150, 246, .62], bilhete: [342, 238, .62]};
  function cena() {
    const arb = (x, y, cs) => cs.map(([dx, dy, r, c]) => `<circle cx="${x + dx}" cy="${y + dy}" r="${r}" fill="${c}"/>`).join('');
    const flor = (x, y, c) => `<g transform="translate(${x} ${y})"><path d="M0 0v10" stroke="#2f6b2a" stroke-width="2"/>${[0, 72, 144, 216, 288].map(a => `<circle cx="0" cy="-4" r="3.2" fill="${c}" transform="rotate(${a})"/>`).join('')}<circle r="2.4" fill="#FDC72F"/></g>`;
    return `<defs><linearGradient id="cu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6f0"/><stop offset="1" stop-color="#e6f3d9"/></linearGradient></defs>
      <rect width="400" height="400" fill="url(#cu)"/>
      <path d="M0 175C60 140 120 150 180 165s130-30 220-5V400H0z" fill="#9fcf8f"/>
      <path d="M0 195C80 180 160 200 240 190s120-10 160 0V400H0z" fill="#79b85a"/>
      <path d="M150 400C170 320 220 260 280 210" stroke="#d9c08f" stroke-width="40" fill="none" stroke-linecap="round" opacity=".7"/>
      <ellipse cx="236" cy="214" rx="62" ry="15" fill="#5fb7d8" stroke="#3a8fb3" stroke-width="2"/>
      <rect x="44" y="96" width="26" height="170" rx="8" fill="#7a4f2a" stroke="#111" stroke-width="2"/>
      ${arb(57, 86, [[-36, 24, 40, '#3f8a3c'], [34, 26, 40, '#3f8a3c'], [0, 0, 52, '#4f9e45'], [-20, -14, 26, '#5aae4c'], [26, -10, 22, '#5aae4c']])}
      <rect x="326" y="128" width="22" height="130" rx="7" fill="#7a4f2a" stroke="#111" stroke-width="2"/>
      ${arb(337, 118, [[-28, 18, 34, '#3f8a3c'], [28, 20, 34, '#3f8a3c'], [0, 0, 44, '#4f9e45'], [12, -16, 20, '#5aae4c']])}
      <ellipse cx="214" cy="300" rx="44" ry="26" fill="#9aa0a6" stroke="#111" stroke-width="2"/><path d="M186 292c10-10 30-12 44-6" stroke="#c4c9cd" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${flor(120, 300, '#C8102E')}${flor(250, 360, '#F4F1EA')}${flor(30, 250, '#FDC72F')}${flor(380, 300, '#C8102E')}${flor(178, 214, '#F4F1EA')}`;
  }
  const MATO = `${[[86, 336, 42, '#2f7a35'], [136, 352, 38, '#3f8a3c'], [44, 366, 38, '#3f8a3c'], [318, 310, 34, '#2f7a35'], [362, 326, 38, '#3f8a3c']].map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('')}
      <g stroke="#2f6b2a" stroke-width="3" stroke-linecap="round" fill="none"><path d="M276 366l4-14M284 368l2-16M292 368l-1-14M300 366l-3-13M160 254l3-12M168 256l0-14M176 254l-3-12"/></g>`;
  function puzNatureza() {
    fala('#pvBl', 'AU AU! PIPOCA FAREJOU', 'O Bê deixou cair <u>5 coisas</u> na trilha. Toquem em cada uma que encontrarem!');
    const c = ch(); c.className = 'ch natu'; let n = 0;
    const itens = Object.keys(OBJ).map(k => { const [x, y, s] = ONDE[k]; return `<g class="hd" data-k="${k}"><g transform="translate(${x} ${y}) scale(${s})">${OBJ[k]}</g><circle cx="${x}" cy="${y}" r="26" fill="#fff0"/></g>` }).join('');
    c.innerHTML = `<svg viewBox="0 0 400 400" aria-label="Trilha">${cena()}${itens}${MATO}<g id="pvAn"></g></svg>`;
    q('#pvEx').innerHTML = `<div class="lista">${Object.keys(OBJ).map(k => `<span data-k="${k}">${s64(OBJ[k])}</span>`).join('')}</div>`;
    dica('Encontrados: <b>0/5</b> · a dica tá ali embaixo.');
    c.querySelector('svg').addEventListener('click', e => {
      const g = e.target.closest('.hd'); if (!g) return tom(200, .08, 'sine', .06);
      if (g.classList.contains('ach')) return;
      const [x, y] = ONDE[g.dataset.k]; g.classList.add('ach');
      q('#pvAn').insertAdjacentHTML('beforeend', `<circle class="anel" cx="${x}" cy="${y}" r="24" fill="none" stroke="#FDC72F" stroke-width="5"/><circle cx="${x}" cy="${y}" r="24" fill="none" stroke="#111" stroke-width="1.5"/>`);
      q(`#pvEx span[data-k="${g.dataset.k}"]`).classList.add('ok'); acerto(++n); dica(`Encontrados: <b>${n}/5</b>`);
      if (n === 5) ganhou('FARO DE DETETIVE!', 'Chapéu, óculos, lupa, bilhete… e um osso pro Pipoca! Pista da Natureza encontrada.');
    });
  }

  /* ---------- 05 Lobby · turma toda: o cofre ---------- */
  const PISTAS = [[PI, 'Quantas patas tem o Pipoca?', 4], [LU, 'Quantas lentes têm os óculos do Lucas?', 2],
    [GA, 'Quantas letras tem o nome GABI?', 4], [BE, 'Quantos amigos estão procurando o Bê?', 3]];
  function puzLobby() {
    fala('#pvBl', 'A TURMA ACHOU UM COFRE', 'Cada um deu uma pista do código. Respondam as 4 perguntas e girem os números!');
    const c = ch(); c.className = 'ch lobby'; const v = [0, 0, 0, 0];
    c.innerHTML = `<div class="miolo"><div class="bh"><b>BILHETE DO BÊ</b>Tô preparando uma surpresa daquelas… continuem me procurando!</div></div>
      <div class="cofre"><i class="rb" style="left:10px;top:10px"></i><i class="rb" style="right:10px;bottom:10px"></i><i class="rb" style="left:10px;bottom:10px"></i><i class="lz" id="pvLz"></i>
      <h4>COFRE DO LOBBY</h4><div class="dis">${v.map((_, i) => `<div class="di"><small>${i + 1}</small><button data-i="${i}" data-d="1" aria-label="Mais">▲</button><div class="nn">0</div><button data-i="${i}" data-d="-1" aria-label="Menos">▼</button></div>`).join('')}</div>
      <button class="abre" id="pvAbre">ABRIR</button></div>`;
    q('#pvEx').innerHTML = `<ol class="pistas">${PISTAS.map(([im, t], i) => `<li><b>${i + 1}</b><img src="${im}" alt="">${t}</li>`).join('')}</ol>`;
    dica('');
    c.querySelectorAll('.di button').forEach(b => b.onclick = () => { const i = +b.dataset.i; v[i] = (v[i] + +b.dataset.d + 10) % 10;
      const nn = b.parentNode.querySelector('.nn'); nn.textContent = v[i]; tom(900 + v[i] * 40, .03, 'square', .05); vibra(8) });
    q('#pvAbre').onclick = () => { const lz = q('#pvLz');
      if (v.every((d, i) => d === PISTAS[i][2])) { lz.className = 'lz vd'; tom(300, .25, 'sawtooth', .06); setTimeout(() => c.classList.add('aberto'), 250);
        ganhou('COFRE ABERTO!', 'Tinha um bilhete do Bê lá dentro! Pista do Lobby encontrada.') }
      else { lz.className = 'lz vm'; errou(); setTimeout(() => lz.className = 'lz', 600); dica('Código errado. Confiram as respostas com a família!') } };
  }
  const PUZ = {0: puzAgua, 1: puzSabor, 2: puzKids, 3: puzNatureza, 4: puzLobby};

  /* ---------- molde da prova ---------- */
  function ajudantes(x) {   // sprites no canto de baixo à direita, pequenos
    const gs = AJ[est].imgs.map(img).filter(g => g.complete && g.naturalWidth); if (!gs.length) return;
    const um = gs.length === 1, mh = um ? 400 : 250, mw = um ? 320 : 210; let dir = W - 10;
    [...gs].reverse().forEach(g => { const s = Math.min(mw / g.naturalWidth, mh / g.naturalHeight), w = g.naturalWidth * s, h = g.naturalHeight * s;
      x.drawImage(g, dir - w, H - h - 8, w, h); dir -= w * .72 });
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
    x.font = '400 50px Anton'; x.fillText(`PROVA ${dois(est + 1)} · ${a.lugar}`, F.x + 12, H - 66);
    x.font = '700 24px "Courier Prime"'; x.fillStyle = '#555'; x.fillText('CASO BLACK · VILLAGE RESORT', F.x + 14, H - 30);
    ajudantes(x);
  }
  const cv = () => q('#pvC'), cx = () => cv().getContext('2d');

  async function ligarCam() {
    pararCam(); foto = null; botoes(false);
    try { fluxo = await navigator.mediaDevices.getUserMedia({video: {facingMode: frente ? 'user' : 'environment', width: {ideal: 1280}}, audio: false});
      const v = Object.assign(document.createElement('video'), {playsInline: true, muted: true}); v.srcObject = fluxo; await v.play();
      (function q2() { if (!fluxo || foto) return; molde(cx(), v, v.videoWidth, v.videoHeight, frente); laco = requestAnimationFrame(q2) })();
      ligarCam.v = v; q('#pvVira').hidden = false; q('#pvDisp').hidden = false;
    } catch (e) { molde(cx(), null); q('#pvVira').hidden = true; q('#pvDisp').hidden = true;
      fala('#pvBl2', 'SEM CÂMERA AQUI', 'Escolha uma foto da equipe na galeria.') }
  }
  function pararCam() { cancelAnimationFrame(laco); if (fluxo) { fluxo.getTracks().forEach(t => t.stop()); fluxo = null } }
  function botoes(tem) { q('#pvB1').hidden = tem; q('#pvB2').hidden = !tem; q('#pvGu').hidden = !tem; if (tem) passo(2) }
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

  function passoFoto() { fala('#pvBl2', 'GUARDA ESSA PROVA', `Todo mundo na foto${est === 4 ? ' com a turma' : ' com ' + (est === 3 ? 'o ' : est === 2 ? 'a ' : 'o ') + AJ[est].nome}! Ela vai pro álbum do caso.`);
    q('#pvPuz').hidden = true; q('#pvFoto').hidden = false; figura('#pvAj2'); passo(1); P.scrollTop = 0; ligarCam() }
  q('#pvOk').onclick = passoFoto;

  function fechar(ok) { pararCam(); P.classList.remove('on'); P.setAttribute('aria-hidden', 'true'); const f = fim; fim = null; if (ok && f) f() }
  function abrir(i, depois) {
    est = i; fim = depois; foto = null; q('#pvK').textContent = `PROVA ${dois(i + 1)} · ${AJ[i].lugar}`;
    figura('#pvAj'); const ok = q('#pvOk'); ok.hidden = true; ok.classList.remove('vai'); q('#pvPuz').hidden = false; q('#pvFoto').hidden = true; q('#pvEx').innerHTML = '';
    passo(0); PUZ[i](); P.classList.add('on'); P.setAttribute('aria-hidden', 'false'); P.scrollTop = 0;
    document.fonts && document.fonts.load('400 50px Anton');
  }
  return {tem: i => !!PUZ[i], abrir, foto: i => { est = i; fim = null; P.classList.add('on'); passoFoto() }};
})();
/* chamado no lugar de marcar(): estação com puzzle passa pela rodada antes do carimbo */
function resolver(i, via) { if (Prova.tem(i) && !achadas.includes(i)) Prova.abrir(i, () => marcar(i, via)); else marcar(i, via) }
