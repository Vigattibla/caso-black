/* Cutscene de abertura: tela cheia por cima de tudo, faixas de cinema, cenário do resort passando ao fundo,
   Cacá recortado na frente e uma frase por vez na faixa de baixo (tempo de cada frase proporcional ao tamanho). */
import {videoDoCaca, keyer, TESTE} from './investigador.js';
export const CSS_CUT = `
.cut{position:fixed;inset:0;z-index:40;background:#000;overflow:hidden;color:#fff}
.cut-bg{position:absolute;inset:-4%;background:center/cover no-repeat;opacity:0;transition:opacity .9s;filter:saturate(.75) brightness(.55) contrast(1.1)}
.cut-bg.on{opacity:1;animation:cutKen 9s linear both}
@keyframes cutKen{from{transform:scale(1.02) translate(1.5%,1%)}to{transform:scale(1.14) translate(-1.5%,-1%)}}
.cut-vin{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 42%,#0000 35%,#000d 100%);pointer-events:none}
.cut-vin::after{content:"";position:absolute;inset:0;background:url(../assets/ruido.webp);opacity:.25;animation:cutGrao .25s steps(2) infinite}
@keyframes cutGrao{50%{background-position:37px 61px}}
.cut canvas{position:absolute;left:50%;bottom:11vh;height:80vh;width:auto;aspect-ratio:9/16;transform:translateX(-50%);opacity:0}
.cut.fala canvas{animation:cutEntra .7s cubic-bezier(.2,1.4,.4,1) both}
@keyframes cutEntra{from{opacity:0;transform:translate(-50%,40%) rotate(-6deg)}to{opacity:1;transform:translate(-50%,0) rotate(0)}}
.cut-faixa{position:absolute;left:0;right:0;height:11vh;background:#000;z-index:2;transition:transform .6s cubic-bezier(.6,0,.2,1)}
.cut-faixa.cima{top:0;transform:translateY(-100%)}
.cut-faixa.baixo{bottom:0;transform:translateY(100%);display:flex;align-items:center;justify-content:center;padding:0 18px}
.cut.aberta .cut-faixa{transform:none}
.cut-leg{max-width:620px;text-align:center;font:700 clamp(15px,4.3vw,22px)/1.25 Montserrat,sans-serif;margin:0}
.cut-leg.troca{animation:cutLeg .35s ease-out}
@keyframes cutLeg{from{opacity:0;transform:translateY(8px)}}
.cut-leg b{color:#fdc72f;font-weight:800}
.cut-tit{position:absolute;inset:0;z-index:3;display:grid;place-content:center;text-align:center;pointer-events:none;transition:opacity .5s}
.cut-tit small{font:700 13px 'Courier Prime',monospace;letter-spacing:.35em;color:#fdc72f;display:block;margin-bottom:8px}
.cut-tit strong{font:400 clamp(44px,13vw,86px)/.95 Anton,sans-serif;text-transform:uppercase;letter-spacing:.02em;display:block;clip-path:inset(0 100% 0 0);animation:cutRevela .8s .3s cubic-bezier(.7,0,.2,1) forwards}
@keyframes cutRevela{to{clip-path:inset(0)}}
.cut-tit img{width:min(62vw,300px);margin:14px auto 0;opacity:0;animation:cutCarimbo .35s 1.1s cubic-bezier(.3,1.6,.5,1) forwards}
@keyframes cutCarimbo{from{opacity:0;transform:scale(2.4) rotate(-14deg)}to{opacity:1;transform:scale(1) rotate(-8deg)}}
.cut.fala .cut-tit{opacity:0}
.cut-cap{position:absolute;left:16px;top:calc(11vh + 12px);z-index:3;font:700 12px 'Courier Prime',monospace;letter-spacing:.2em;color:#fdc72f;background:#000a;padding:4px 8px;opacity:0;transition:opacity .4s}
.cut.fala .cut-cap{opacity:1}
.cut .inv-pular{position:absolute;right:14px;top:max(12px,calc(5.5vh - 18px));z-index:4;font:700 14px 'Courier Prime',monospace;letter-spacing:.1em;background:#000;color:#fdc72f;border:2px solid #fdc72f;padding:7px 11px;cursor:pointer}
.cut .inv-som{position:absolute;left:14px;top:max(12px,calc(5.5vh - 18px));z-index:4;font:700 14px Montserrat,sans-serif;background:#fdc72f;color:#111;border:0;padding:8px 12px;cursor:pointer}
.cut .inv-som[hidden]{display:none}
.cut .inv-teste{bottom:calc(11vh + 10px);z-index:3}
.cut.sai{transition:opacity .5s;opacity:0}`;
const CENAS = ['cena-crime.webp', 'locais/1.webp', 'locais/2.webp', 'locais/3.webp', 'locais/4.webp', 'locais/5.webp'];
const FALA_TESTE = ['Temos um caso sério: a <b>Black Friday</b> sumiu… e o Bê sumiu junto!'];
/* `falas`: uma frase por item, na ordem da fala (pode ter <b>destaque</b>). Resolve ao terminar ou pular. */
export async function cutscene(nome, falas) {
  const src = await videoDoCaca(nome); if (!src) return;
  if (TESTE) falas = FALA_TESTE;
  const box = document.createElement('div'); box.className = 'cut';
  box.innerHTML = CENAS.map(c => `<div class="cut-bg" style="background-image:url(../assets/${c})"></div>`).join('') +
    `<div class="cut-vin"></div><canvas></canvas><div class="cut-tit"><small>VILLAGE RESORT · 2026</small><strong>Caso<br>Black</strong><img src="../assets/cb-confidencial.png" alt=""></div>
    <span class="cut-cap">ARQUIVO 01 · O SUMIÇO</span><div class="cut-faixa cima"></div><div class="cut-faixa baixo"><p class="cut-leg"></p></div>
    <button class="inv-som" hidden>🔊 Ouvir</button><button class="inv-pular">PULAR ›</button>${TESTE ? '<span class="inv-teste">DUBLÊ DE TESTE</span>' : ''}`;
  const video = Object.assign(document.createElement('video'), {src, playsInline: true, preload: 'auto'}); video.setAttribute('playsinline', '');
  document.body.append(box);
  const fundos = [...box.querySelectorAll('.cut-bg')], leg = box.querySelector('.cut-leg');
  const desenhar = keyer(box.querySelector('canvas'), video, 1);
  // Frase i começa no peso acumulado (nº de letras) sobre a duração do vídeo.
  const pesos = falas.map(f => f.replace(/<[^>]+>/g, '').length + 12), total = pesos.reduce((a, b) => a + b, 0);
  const inicios = pesos.map((_, i) => pesos.slice(0, i).reduce((a, b) => a + b, 0) / total);
  const cena = i => fundos.forEach((f, j) => f.classList.toggle('on', j === i % fundos.length));
  cena(0); requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('aberta')));
  return new Promise(fim => {
    let quadro, acabou = false, atual = -1;
    const loop = () => {
      desenhar?.();
      const d = video.duration, t = video.currentTime;
      if (d && box.classList.contains('fala')) {
        let i = 0; while (i + 1 < falas.length && t / d >= inicios[i + 1]) i++;
        if (i !== atual) { atual = i; leg.innerHTML = falas[i]; leg.classList.remove('troca'); void leg.offsetWidth; leg.classList.add('troca'); if (i) cena(i); }
      }
      quadro = requestAnimationFrame(loop);
    };
    const sair = () => {
      if (acabou) return; acabou = true; video.pause(); box.classList.remove('aberta'); box.classList.add('sai');
      setTimeout(() => { cancelAnimationFrame(quadro); box.remove(); fim(); }, 550);
    };
    box.querySelector('.inv-pular').onclick = sair; video.onended = sair; video.onerror = sair;
    const som = box.querySelector('.inv-som'); som.onclick = () => { video.muted = false; som.hidden = true; };
    loop();
    // Cartela de título primeiro; depois o Cacá entra e fala.
    setTimeout(() => {
      if (acabou) return; box.classList.add('fala');
      video.play().catch(() => { video.muted = true; som.hidden = false; return video.play(); }).catch(sair);
    }, 2000);
  });
}
