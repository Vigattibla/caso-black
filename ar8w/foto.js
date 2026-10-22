/* Câmera de foto: abre direto na tela, sem perguntar. Com a câmera mágica ligada a foto sai do próprio vídeo AR
   (XR8.CanvasScreenshot); sem ela (demo, tela cheia por número) abre a câmera do celular; sem câmera, cai no seletor. */
let aberta = null;
const arLigada = () => !!window.XR8?.CanvasScreenshot && document.body.dataset.camera === 'ar';

function carimbar(fonte, legenda) {
  const w = fonte.videoWidth || fonte.naturalWidth || fonte.width, h = fonte.videoHeight || fonte.naturalHeight || fonte.height;
  const k = Math.min(1, 900 / Math.max(w, h)), c = document.createElement('canvas'), x = c.getContext('2d');
  c.width = Math.round(w * k); c.height = Math.round(h * k); x.drawImage(fonte, 0, 0, c.width, c.height);
  const f = Math.round(c.width * .09); x.fillStyle = '#111d'; x.fillRect(0, c.height - f, c.width, f);
  x.fillStyle = '#fdc72f'; x.font = `400 ${Math.round(f * .5)}px Anton, sans-serif`; x.textBaseline = 'middle'; x.fillText(legenda, f * .4, c.height - f / 2, c.width - f * .8);
  return c.toDataURL('image/jpeg', .8);
}
const carregar = src => new Promise((ok, falha) => { const i = new Image(); i.onload = () => ok(i); i.onerror = falha; i.src = src; });

// Resolve com o JPEG carimbado (já no álbum pelo chamador) ou null se pularem.
export function tirarFoto({titulo, legenda, frontal = false}) {
  if (aberta) return aberta;
  const el = document.createElement('section'); el.id = 'foto-camera'; const ar = arLigada();
  el.innerHTML = `<header><b>📸 ${titulo}</b><small>Junta a turma e aperta o botão</small></header><div class="fc-visor">${ar ? '' : '<video playsinline muted autoplay></video>'}<i></i><i></i><i></i><i></i></div>
    <div class="fc-acoes"><button class="fc-pular">Pular</button><button class="fc-disparo" aria-label="Tirar foto"></button><button class="fc-virar" ${ar ? 'hidden' : ''} aria-label="Virar câmera">🔄</button></div>
    <div class="fc-pronta" hidden><img alt=""><div><a class="fc-salvar" download="caso-black.jpg">⬇ Salvar no celular</a><button class="fc-denovo">Tirar outra</button><button class="fc-ok">Pronto ✓</button></div></div>
    <input type="file" accept="image/*" capture="${frontal ? 'user' : 'environment'}" hidden>`;
  document.body.append(el); document.body.classList.add('fotografando');
  const q = s => el.querySelector(s), video = q('video'); let stream = null, frente = frontal, foto = null;
  async function ligar() {
    if (ar) return; stream?.getTracks().forEach(t => t.stop());
    try { stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: frente ? 'user' : 'environment', width: {ideal: 1280}}, audio: false}); video.srcObject = stream; video.classList.toggle('espelho', frente); }
    catch (e) { q('input').click(); } // sem câmera: seletor do sistema
  }
  function mostrar(dado) { foto = dado; q('.fc-pronta img').src = dado; q('.fc-salvar').href = dado; q('.fc-pronta').hidden = false; navigator.vibrate?.(30); }
  aberta = new Promise(fim => {
    const fechar = () => { stream?.getTracks().forEach(t => t.stop()); el.remove(); document.body.classList.remove('fotografando'); aberta = null; fim(foto); };
    q('.fc-disparo').onclick = async () => {
      q('.fc-disparo').disabled = true;
      try {
        if (ar) mostrar(carimbar(await carregar('data:image/jpeg;base64,' + await XR8.CanvasScreenshot.takeScreenshot()), legenda));
        else if (video.videoWidth) mostrar(carimbar(video, legenda));
        else q('input').click();
      } catch (e) { q('input').click(); }
      q('.fc-disparo').disabled = false;
    };
    q('input').onchange = async e => { const a = e.target.files?.[0]; if (!a) return; const u = URL.createObjectURL(a); try { mostrar(carimbar(await carregar(u), legenda)); } finally { URL.revokeObjectURL(u); e.target.value = ''; } };
    q('.fc-virar').onclick = () => { frente = !frente; ligar(); };
    q('.fc-denovo').onclick = () => { foto = null; q('.fc-pronta').hidden = true; };
    q('.fc-ok').onclick = fechar; q('.fc-pular').onclick = () => { foto = null; fechar(); };
  });
  ligar();
  return aberta;
}
