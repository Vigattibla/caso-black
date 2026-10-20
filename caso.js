/* Caso Black · ficha do investigador, carimbos virtuais, retrato falado e leitura da placa (ArUco).
   Depende de index.html (PISTAS, achadas, salvar, atualizar, liberar, toast, vibra, dois, $) e de dados.js. */
const PALAVRA = 'LOBBY', ARUCO0 = 300;   // placas: ArUco 4x4 ids 300..304 = estações 1..5

/* ---------- retrato falado: grade 30x21, 5 faixas de 6 colunas (uma por estação) ---------- */
const RETRATO = {
  linhas: [
    [[9,6],[9,2],[12,1],[15,2],[18,1],[21,2],[21,6]], [[9,4],[21,4]], [[5,7],[3,6],[27,6],[25,7],[5,7]],   // chapéu
    [[9,6],[10,8],[12,7],[14,8],[16,7],[18,8],[20,7],[21,6]],                                               // franja
    [[9,7],[8,10],[10,13],[15,14],[20,13],[22,10],[21,7]],                                                  // rosto
    [[8,9],[7,9],[7,11],[8,11]], [[22,9],[23,9],[23,11],[22,11]],                                           // orelhas
    [[11,9],[12,8],[13,9],[12,10],[11,9]], [[17,9],[18,8],[19,9],[18,10],[17,9]],                           // olhos
    [[12,11],[18,11],[17,12],[15,13],[13,12],[12,11]],                                                      // sorriso
    [[10,13],[4,15]], [[20,13],[26,15]],                                                                    // ombros
    [[1,15],[29,15],[29,21],[1,21],[1,15]],                                                                 // placa de fichamento
  ],
  letra: {L: [[[-1,16],[-1,20],[1,20]]], O: [[[-1,16],[1,16],[1,20],[-1,20],[-1,16]]],
          B: [[[-1,16],[-1,20],[0,20],[1,19],[0,18],[1,17],[0,16],[-1,16]], [[-1,18],[0,18]]],
          Y: [[[-1,16],[0,18],[1,16]], [[0,18],[0,20]]]},
};
const pts = l => l.map(p => p.join(',')).join(' ');
function retratoSVG({faixas = [0,1,2,3,4], letras = false, so = -1, cor = '#111'} = {}) {
  const x0 = so >= 0 ? so * 6 : 0, w = so >= 0 ? 6 : 30, pad = .6;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0 - pad} ${-pad} ${w + pad * 2} ${21 + pad * 2}" class="retrato">`;
  s += `<defs><clipPath id="cf${so}">${faixas.map(f => `<rect x="${f * 6}" y="-1" width="6" height="23"/>`).join('')}</clipPath></defs>`;
  for (let y = 0; y <= 21; y++) for (let x = x0; x <= x0 + w; x++) s += `<circle cx="${x}" cy="${y}" r=".09" fill="#0005"/>`;
  s += `<g clip-path="url(#cf${so})" fill="none" stroke="${cor}" stroke-width=".32" stroke-linecap="round" stroke-linejoin="round">`;
  RETRATO.linhas.forEach(l => s += `<polyline points="${pts(l)}"/>`);
  if (letras) [...PALAVRA].forEach((c, i) => RETRATO.letra[c].forEach(l => s += `<polyline points="${pts(l.map(([x, y]) => [x + 3 + i * 6, y]))}"/>`));
  else s += `<text x="15" y="19.4" text-anchor="middle" font-family="Anton" font-size="3.6" fill="#0006" stroke="none">? ? ? ? ?</text>`;
  s += '</g>';
  if (so < 0) for (let f = 1; f < 5; f++) s += `<line x1="${f * 6}" y1="0" x2="${f * 6}" y2="21" stroke="#0003" stroke-width=".08" stroke-dasharray=".3 .3"/>`;
  return s + '</svg>';
}

/* ---------- carimbo (SVG com tinta gasta) ---------- */
const NOMES = ['ÁGUA', 'SABOR', 'KIDS', 'NATUREZA', 'LOBBY'];
function carimboSVG(n, id = 'c' + n) {   // n = 1..5 ou 6 (resolvido)
  const fim = n === 6, cor = fim ? '#c8102e' : '#1d3f8f';
  const topo = fim ? 'VILLAGE RESORT · CASO 2026-BF' : `ESTAÇÃO 0${n} · CASO 2026-BF`, base = fim ? 'DEPTO. DE INVESTIGAÇÃO' : 'VILLAGE RESORT · DEPTO. INVESTIGAÇÃO';
  return `<svg viewBox="0 0 120 120" class="selo" aria-hidden="true"><defs>
    <filter id="g${id}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${n * 7}"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.2 1.5"/><feComposite in="SourceGraphic" operator="in"/></filter>
    <path id="a${id}" d="M60 60m-43 0a43 43 0 1 1 86 0a43 43 0 1 1-86 0"/></defs>
    <g filter="url(#g${id})" fill="${cor}" stroke="${cor}">
    <circle cx="60" cy="60" r="55" fill="none" stroke-width="4"/><circle cx="60" cy="60" r="34" fill="none" stroke-width="1.6"/>
    <text font-family="Courier Prime,monospace" font-weight="700" font-size="9.4" letter-spacing="1.1" stroke="none"><textPath href="#a${id}" startOffset="2%">${topo} · ${base} ·</textPath></text>
    ${fim ? `<g transform="rotate(-14 60 60)"><rect x="6" y="46" width="108" height="28" fill="#f6efe0" stroke-width="3"/><text x="60" y="58" text-anchor="middle" font-family="Anton" font-size="11" stroke="none">CASO</text><text x="60" y="71" text-anchor="middle" font-family="Anton" font-size="12.5" stroke="none">RESOLVIDO</text></g>`
      : `<text x="60" y="56" text-anchor="middle" font-family="Anton" font-size="27" stroke="none">0${n}</text><text x="60" y="75" text-anchor="middle" font-family="Anton" font-size="${NOMES[n - 1].length > 5 ? 10 : 12.5}" letter-spacing=".5" stroke="none">${NOMES[n - 1]}</text>`}
    </g></svg>`;
}

/* ---------- som: baque do carimbo (WebAudio, sem arquivo) ---------- */
let AC = null;
function baque(fim) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const t = AC.currentTime;
    const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .18);
    g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .3); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + .32);
    const b = AC.createBuffer(1, AC.sampleRate * .12, AC.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const r = AC.createBufferSource(), rg = AC.createGain(); r.buffer = b; rg.gain.value = .5; r.connect(rg).connect(AC.destination); r.start(t);
    if (fim) [523, 659, 784, 1047].forEach((f, i) => { const s = AC.createOscillator(), sg = AC.createGain(); s.type = 'triangle'; s.frequency.value = f;
      sg.gain.setValueAtTime(0, t + .35 + i * .11); sg.gain.linearRampToValueAtTime(.18, t + .37 + i * .11); sg.gain.exponentialRampToValueAtTime(.001, t + .9 + i * .11);
      s.connect(sg).connect(AC.destination); s.start(t + .35 + i * .11); s.stop(t + 1 + i * .11) });
  } catch (e) {}
}

/* ---------- overlays ---------- */
document.body.insertAdjacentHTML('beforeend', `
<div id="cad" class="ov" aria-hidden="true"><div class="ovc papel">
  <div class="k">VILLAGE RESORT · DEPTO. DE INVESTIGAÇÃO</div>
  <h3>Abra sua ficha de investigador</h3>
  <p class="mono">Cada placa que você achar no resort vira um <b>carimbo</b> na sua ficha. Com os 5, você descobre de quem é a digital na sua carta e entra no <b>grupo VIP da Black</b>.</p>
  <label for="cNome">NOME DO INVESTIGADOR</label><input id="cNome" maxlength="60" autocomplete="name" placeholder="como te chamamos?">
  <label for="cCont">E-MAIL OU WHATSAPP</label><input id="cCont" maxlength="120" autocomplete="email" inputmode="email" placeholder="voce@email.com ou (31) 9...">
  <label class="lgpd"><input type="checkbox" id="cLgpd"><span>Aceito que o Village Resort use esses dados para me avisar do Caso Black e das ofertas da Black Friday. Posso pedir pra sair quando quiser (LGPD).</span></label>
  <div class="erro" id="cErro"></div>
  <button class="btn" id="cOk">Abrir minha ficha</button>
</div></div>
<div id="carimbo" class="ov" aria-hidden="true"><div class="ovc papel">
  <div class="k" id="kK">ESTAÇÃO 01</div>
  <div class="slotC" id="kSlot"></div>
  <h3 id="kTit">Carimbo conquistado!</h3>
  <div id="kFrag"></div>
  <p class="mono" id="kTxt"></p>
  <label class="btn alt" id="kFoto">Foto da equipe aqui<input type="file" accept="image/*" capture="user"></label>
  <button class="btn" id="kOk">Continuar</button>
</div></div>
<div id="ficha" class="ov" aria-hidden="true"><div class="ovc papel">
  <button class="fechar" id="fX" aria-label="Fechar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  <div class="k">FICHA DO INVESTIGADOR</div>
  <h3 id="fNome">—</h3>
  <div class="sub mono" id="fProg">0/5 carimbos</div>
  <div class="cgrade" id="fGrade"></div>
  <div class="k" style="margin-top:12px">RETRATO MISTERIOSO</div>
  <div class="rf" id="fRet"></div>
  <p class="mono pq">Copie cada pedaço no verso da carta. Juntos, revelam a palavra da última prova.</p>
  <div class="campo"><input id="fPal" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="PALAVRA"><button class="btn" id="fOk">Conferir</button></div>
  <div class="erro" id="fErro"></div>
</div></div>`);

const abreOv = id => { const o = $(id); o.classList.add('on'); o.setAttribute('aria-hidden', 'false') };
const fechaOv = id => { const o = $(id); o.classList.remove('on'); o.setAttribute('aria-hidden', 'true') };

/* cadastro */
let depoisCad = null;
function pedirCadastro(fn) { if (Dados.ficha()) return fn && fn(); depoisCad = fn; abreOv('#cad'); setTimeout(() => $('#cNome').focus(), 350) }
$('#cOk').onclick = async () => {
  const nome = $('#cNome').value.trim(), cont = $('#cCont').value.trim(), dig = cont.replace(/\D/g, '');
  const err = t => { $('#cErro').textContent = t; vibra([20, 30, 20]) };
  if (nome.length < 2) return err('Diga seu nome, investigador.');
  if (!(/^\S+@\S+\.\S+$/.test(cont) || (!cont.includes('@') && dig.length >= 10 && dig.length <= 13))) return err('Use um e-mail ou WhatsApp com DDD.');
  if (!$('#cLgpd').checked) return err('Marque o aceite para abrir a ficha.');
  $('#cOk').disabled = true;
  await Dados.entrar({nome, contato: cont.includes('@') ? cont.toLowerCase() : dig, lgpd: true});
  // pistas já registradas antes do cadastro viram carimbos
  for (const i of achadas) await Dados.carimbar(i + 1, 'antes-cadastro');
  $('#cOk').disabled = false; fechaOv('#cad'); pintarFicha();
  toast(`Ficha aberta, ${nome.split(' ')[0]}. Ache as placas!`);
  const f = depoisCad; depoisCad = null; f && f();
};

/* carimbo conquistado */
let filaCar = [];
function mostrarCarimbo(n, novo) {
  const fim = n === 6, i = n - 1;
  $('#kK').textContent = fim ? 'CASO 2026-BF' : 'ESTAÇÃO ' + dois(n);
  $('#kTit').textContent = fim ? 'Caso resolvido!' : novo ? 'Carimbo conquistado!' : 'Carimbo já estava na ficha';
  $('#kSlot').innerHTML = carimboSVG(n, 'k' + n);
  $('#kFrag').innerHTML = fim ? '' : `<div class="frag"><div class="nq">QUADRO ${dois(n)}</div>${retratoSVG({faixas: [i], letras: true, so: i})}</div>`;
  const falta = 5 - Dados.carimbos().filter(x => x <= 5).length;
  $('#kTxt').innerHTML = fim ? `A digital na carta era do <b>Bê</b>! Você está no <b>grupo VIP da Black</b>.`
    : `Copie o desenho no <b>quadro ${dois(n)}</b> do verso da carta, ponto por ponto.` + (falta ? ` Faltam <b>${falta}</b>.` : ` <b>Retrato completo!</b> Leia a palavra e digite na folha 04.`);
  $('#kFoto').hidden = fim || (typeof fotoDe === 'function' && !!fotoDe(n)); $('#kFoto').dataset.n = n;
  $('#carimbo').classList.toggle('fim', fim);
  abreOv('#carimbo'); const s = $('#kSlot'); s.classList.remove('bate'); void s.offsetWidth; s.classList.add('bate');
  setTimeout(() => { baque(fim); vibra(fim ? [60, 40, 60, 40, 160] : [70]) }, 330);
}
$('#kOk').onclick = () => { fechaOv('#carimbo'); pintarFicha(); if ($('#carimbo').classList.contains('fim')) return setTimeout(liberar, 250);
  if (Dados.carimbos().filter(x => x <= 5).length >= 5 && typeof irPara === 'function') setTimeout(() => { irPara(N - 1); beDica() }, 350);
  else if (window.proxima) setTimeout(proxima, 450) };

$('#kFoto input').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f && window.salvarFoto) salvarFoto(+$('#kFoto').dataset.n, f) };

/* chamado pelo registrar() do index: estação 1..5 */
async function carimbarEstacao(i, via) {
  if (!Dados.ficha()) return pedirCadastro(() => carimbarEstacao(i, via));
  const novo = await Dados.carimbar(i + 1, via); mostrarCarimbo(i + 1, novo);
}

/* ficha */
function pintarFicha() {
  const f = Dados.ficha(), c = Dados.carimbos();
  $('#fNome').textContent = f ? f.nome : '—';
  const n = c.filter(x => x <= 5).length; $('#fProg').textContent = `${n}/5 carimbos${f && f.resolvido ? ' · CASO RESOLVIDO' : ''}`;
  $('#fGrade').innerHTML = [1, 2, 3, 4, 5, 6].map(k => `<button class="cel ${c.includes(k) ? 'tem' : ''} ${k === 6 ? 'f6' : ''}" data-k="${k}" aria-label="${k === 6 ? 'Caso resolvido' : 'Estação ' + k}">${c.includes(k) ? carimboSVG(k, 'f' + k) : `<span>${k === 6 ? '★' : dois(k)}</span>`}</button>`).join('');
  $('#fRet').innerHTML = retratoSVG({faixas: c.filter(x => x <= 5).map(x => x - 1)});
  let pal = false; try { pal = localStorage.getItem('cb-palavra') === '1' } catch (e) {}
  $('#fPal').parentNode.style.display = f && (f.resolvido || pal) ? 'none' : '';
  $$('#fGrade .cel.tem').forEach(b => b.onclick = () => { fechaOv('#ficha'); mostrarCarimbo(+b.dataset.k, false) });
  $$('#slots i').forEach((e, i) => e.classList.toggle('car', c.includes(i + 1)));
  const r2 = $('#retrato2'); if (r2) { const fx = [...new Set([...c.filter(x => x <= 5).map(x => x - 1), ...achadas])];
    r2.innerHTML = retratoSVG({faixas: fx, letras: fx.length >= 5}); $('#retrato2t').textContent = fx.length >= 5 ? 'retrato completo' : `retrato ${fx.length}/5`; }
  typeof pintarChave === 'function' && pintarChave();
}
function abrirFicha() { pedirCadastro(() => { pintarFicha(); abreOv('#ficha') }) }
$('#fX').onclick = () => fechaOv('#ficha');
$('#ficha').addEventListener('click', e => { if (e.target.id === 'ficha') fechaOv('#ficha') });
$('#fOk').onclick = async () => {
  const v = $('#fPal').value.trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s/g, '');
  if (v !== PALAVRA) { $('#fErro').textContent = v ? 'Não é essa. Junte os 5 quadros e leia a palavra que aparece.' : ''; vibra([20, 30, 20]); return }
  $('#fErro').textContent = ''; conferePalavra(v); fechaOv('#ficha');
  if (Dados.carimbos().filter(x => x <= 5).length < 5) return beFala('Palavra certa! Agora falta completar os carimbos da chave.', 'PALAVRA CERTA');
  irPara(N - 1); setTimeout(() => beFala('Provas completas! Vira sua carta, abre a luneta e aponta pro selo do arquivo.', 'ÚLTIMA PROVA'), 700);
};
$('#fPal').addEventListener('keydown', e => { if (e.key === 'Enter') $('#fOk').click() });
$('.prog').addEventListener('click', abrirFicha); $('.prog').style.cursor = 'pointer';

/* ---------- leitura da placa pela luneta ---------- */
const Placa = (() => {
  let det = null; const cv = document.createElement('canvas'), cx = cv.getContext('2d', {willReadFrequently: true});
  return {
    ler(video) {   // retorna índice da estação (0..4) ou -1
      if (!window.AR) return -1;
      det = det || new AR.Detector({dictionaryName: 'ARUCO_4X4_1000', maxHammingDistance: 0});
      const vw = video.videoWidth || video.width, vh = video.videoHeight || video.height; if (!vw) return -1;
      const f = Math.min(1, 720 / Math.max(vw, vh)); cv.width = Math.round(vw * f); cv.height = Math.round(vh * f);
      cx.drawImage(video, 0, 0, cv.width, cv.height);
      for (const m of det.detect(cx.getImageData(0, 0, cv.width, cv.height))) if (m.id >= ARUCO0 && m.id < ARUCO0 + 5) return m.id - ARUCO0;
      return -1;
    },
    lerTudo(video) {   // todos os marcadores do caso: [{id, corners:[{x,y}] em pixels do vídeo}]
      if (!window.AR) return [];
      det = det || new AR.Detector({dictionaryName: 'ARUCO_4X4_1000', maxHammingDistance: 0});
      const vw = video.videoWidth || video.width, vh = video.videoHeight || video.height; if (!vw) return [];
      const f = Math.min(1, 720 / Math.max(vw, vh)); cv.width = Math.round(vw * f); cv.height = Math.round(vh * f);
      cx.drawImage(video, 0, 0, cv.width, cv.height);
      return det.detect(cx.getImageData(0, 0, cv.width, cv.height)).filter(m => m.id >= ARUCO0 && m.id <= ARUCO0 + 5)
        .map(m => ({id: m.id, corners: m.corners.map(p => ({x: p.x / f, y: p.y / f}))}));
    },
    svg: id => { det = det || new AR.Detector({dictionaryName: 'ARUCO_4X4_1000', maxHammingDistance: 0}); return det.dictionary.generateSVG(id) },
  };
})();

pintarFicha();
