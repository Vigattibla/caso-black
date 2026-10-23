/* Vídeo do Cacá (fundo verde) por cima do quadro, antes da fala da estação. Sem MP4 no manifest, resolve na hora. */
const TESTE = new URLSearchParams(location.search).has('cacateste');
let manifesto;
const lista = () => manifesto || (manifesto = fetch('../assets/v/manifest.json', {cache: 'no-cache'}).then(r => r.ok ? r.json() : {}).catch(() => ({})));
export async function videoDoCaca(nome) {
  if (TESTE) return '../assets/v/teste-caca.mp4';
  const {estacoes = []} = await lista(); return estacoes.includes(nome) ? `../assets/v/${nome}` : null;
}
export const CSS_INV = `
.inv{position:absolute;inset:0;z-index:8;background:linear-gradient(#0000 40%,#000a);display:flex;justify-content:center;align-items:flex-end;overflow:hidden}
.inv canvas{height:100%;width:auto;aspect-ratio:9/16;display:block}
.inv-leg{position:absolute;left:24px;right:24px;bottom:22px;background:#111e;color:#fff;font:600 19px/1.3 Montserrat,sans-serif;padding:10px 14px;border-left:6px solid #fdc72f}
.inv-leg:empty{display:none}
.inv .inv-pular{position:absolute;right:16px;top:16px;font:700 15px 'Courier Prime',monospace;letter-spacing:.1em;background:#111;color:#fdc72f;border:2px solid #fdc72f;padding:8px 12px;cursor:pointer}
.inv .inv-som{position:absolute;left:16px;top:16px;font:700 15px Montserrat,sans-serif;background:#fdc72f;color:#111;border:0;padding:8px 12px;cursor:pointer}
.inv-som[hidden]{display:none}
.inv-teste{position:absolute;left:16px;bottom:96px;font:700 12px 'Courier Prime',monospace;color:#fff;background:#c8102e;padding:3px 8px;letter-spacing:.1em}`;
const VS = 'attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0,1);}';
// Chave pela dominância do verde, com despill para não sobrar borda verde no cabelo.
const FS = `precision mediump float;varying vec2 uv;uniform sampler2D t;void main(){vec3 c=texture2D(t,uv).rgb;float m=max(c.r,c.b);float k=c.g-m;
float a=1.-smoothstep(.06,.2,k);c.g=min(c.g,m+.02);gl_FragColor=vec4(c*a,a);}`;
function keyer(canvas, video) {
  const gl = canvas.getContext('webgl', {premultipliedAlpha: true, alpha: true}); if (!gl) return null;
  const sh = (tp, src) => { const s = gl.createShader(tp); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  return () => {
    if (video.readyState < 2) return;
    const w = video.videoWidth >> 1, h = video.videoHeight >> 1; // meia resolução basta dentro do quadro
    if (canvas.width !== w) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
}
/* Toca no quadro `el`; resolve ao terminar ou pular. `legenda` é a fala-guia mostrada enquanto ele fala. */
export async function tocarCaca(el, nome, legenda = '') {
  const src = await videoDoCaca(nome); if (!src) return;
  const box = document.createElement('div'); box.className = 'inv';
  box.innerHTML = `<canvas></canvas><p class="inv-leg"></p><button class="inv-som" hidden>🔊 Ouvir</button><button class="inv-pular">PULAR ›</button>${TESTE ? '<span class="inv-teste">DUBLÊ DE TESTE</span>' : ''}`;
  const video = Object.assign(document.createElement('video'), {src, playsInline: true, preload: 'auto'}); video.setAttribute('playsinline', '');
  el.append(box); box.querySelector('.inv-leg').textContent = legenda;
  const desenhar = keyer(box.querySelector('canvas'), video);
  return new Promise(fim => {
    let quadro, acabou = false;
    const loop = () => { desenhar?.(); box.dataset.quadros = (+box.dataset.quadros || 0) + 1; quadro = requestAnimationFrame(loop); }; // rVFC não dispara em vídeo fora do DOM
    const sair = () => { if (acabou) return; acabou = true; video.pause(); cancelAnimationFrame(quadro); box.remove(); fim(); };
    box.querySelector('.inv-pular').onclick = sair; video.onended = sair; video.onerror = sair;
    const som = box.querySelector('.inv-som'); som.onclick = () => { video.muted = false; som.hidden = true; };
    video.play().catch(() => { video.muted = true; som.hidden = false; return video.play(); }).catch(sair);
    loop();
  });
}
