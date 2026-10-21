/* Caso Black · envelopes selados. Valores comerciais e estoque são placeholders. */
const Envelopes = window.Envelopes = (() => {
  const CONFIG = {
    WHATS: '5531984760195', // Número com DDI/DDD; o link do grupo VIP também está pendente.
    segurar: 1200,
    niveis: [
      {id: 'bronze', nome: 'BRONZE', cor: '#b0703a', regra: {carimbos: 2}, titulo: 'Pacote Bronze', dias: 'A DEFINIR', diarias: 'A DEFINIR', dayUse: false, precoDe: 'A DEFINIR', precoPor: 'A DEFINIR', desconto: 'A DEFINIR', validade: 'A DEFINIR'},
      {id: 'prata', nome: 'PRATA', cor: '#aeb4bd', regra: {carimbos: 4}, titulo: 'Pacote Prata', dias: 'A DEFINIR', diarias: 'A DEFINIR', dayUse: false, precoDe: 'A DEFINIR', precoPor: 'A DEFINIR', desconto: 'A DEFINIR', validade: 'A DEFINIR'},
      {id: 'ouro', nome: 'OURO', cor: '#d4a017', regra: {carimbos: 5}, titulo: 'Pacote Ouro', dias: 'A DEFINIR', diarias: 'A DEFINIR', dayUse: false, precoDe: 'A DEFINIR', precoPor: 'A DEFINIR', desconto: 'A DEFINIR', validade: 'A DEFINIR'},
      {id: 'niobio', nome: 'NIÓBIO', cor: 'linear-gradient(120deg,#3a4fb8,#8a3ab8,#2fb8a8,#3a4fb8)', regra: {resolvido: true}, titulo: 'Pacote Nióbio', dias: 'A DEFINIR', diarias: 6, dayUse: false, precoDe: 'A DEFINIR', precoPor: 'R$ 3.___', desconto: 'A DEFINIR', validade: 'A DEFINIR', quantidade: 10, restantes: 10},
    ],
  };
  const LS = 'cb-envelopes', q = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const calmo = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ler = () => { try { const v = JSON.parse(localStorage.getItem(LS)); return new Set(Array.isArray(v) ? v.filter(id => CONFIG.niveis.some(n => n.id === id)) : []) } catch (_) { return new Set() } };
  let abertos = ler(), demoAbertos = new Set(), demo = false, foco = null, cancelar = null;
  const demoVip = () => location.hash === '#demo-vip-aberto' ? false : location.hash === '#demo-vip-ok' ? true : null;
  const carimbos = () => demoVip() === null ? [...new Set(Dados.carimbos().filter(n => Number.isInteger(n) && n >= 1 && n <= 5))] : demoVip() ? [1,2,3,4,5] : [1,2];
  const resolveu = () => demoVip() ?? (!!Dados.ficha()?.resolvido || Dados.carimbos().includes(6) || resolvido());
  const podeAbrir = n => (demo && demoVip() === null) || liberado(n);
  const liberado = (n, c = carimbos(), fim = resolveu()) => n.regra.resolvido ? fim : c.length >= n.regra.carimbos;
  const esgotado = n => n.quantidade !== undefined && Number(n.restantes) <= 0;
  const pendencia = n => n.regra.resolvido ? 'só para quem resolve o caso' : `faltam ${Math.max(0, n.regra.carimbos - carimbos().length)} provas`;
  const status = (n, livre = liberado(n), aberto = (/^#demo/.test(location.hash) ? demoAbertos : abertos).has(n.id)) => esgotado(n) ? 'ESGOTADO' : !livre ? pendencia(n) : aberto ? 'carta aberta' : 'segure o lacre';
  const perda = (n, livre) => !resolveu() && !livre && !esgotado(n) ? '<strong class="en-perda">VOCÊ ESTÁ PERDENDO ESTE DESCONTO</strong>' : '';
  const cadeado = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg>';

  document.head.insertAdjacentHTML('beforeend', `<style>
.envelopes-secao{width:100%;max-width:360px;margin:14px auto 4px;text-align:left;color:#f4f1ea;flex-shrink:0}
.envelopes-secao h3{font:400 20px/1.1 Anton,sans-serif;letter-spacing:.04em;color:#fdc72f;margin:0}
.envelopes-secao>p{font:700 9px/1.4 'Courier Prime',monospace;margin:4px 0 8px;color:#ccc}
.envelopes-resumo{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.envelopes-resumo button{display:flex;align-items:center;gap:7px;min-height:48px;padding:6px;text-align:left;border:1px solid #f4f1ea44;border-radius:3px;background:#ffffff08;color:#f4f1ea}
.envelopes-resumo b{display:block;font:400 13px/1 Anton,sans-serif;letter-spacing:.05em}
.envelopes-resumo small{display:block;margin-top:4px;font:700 8px/1.2 'Courier Prime',monospace}
.envelopes-mini{display:grid;place-items:center;flex:none;width:29px;height:29px;background:var(--lacre);border-radius:46%;box-shadow:inset 0 0 0 2px #0003,0 2px 3px #0005;color:#1a1a1a;font:400 14px Anton}
.envelopes-bloq .envelopes-mini{filter:grayscale(.8);opacity:.55}.envelopes-mini svg{width:16px;height:16px}
.f5 .fimW{overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;touch-action:pan-y;padding:0 4px 8px 0}.f5 .fimW>*{flex-shrink:0}.f5 #fimLupa{margin-top:12px}
#vip .miolo{overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y}#vip .miolo>*{flex-shrink:0}
#vip .envelopes-secao{margin-top:20px}#vip .envelopes-resumo{gap:10px}
#vip .envelopes-resumo button{align-items:flex-start;min-width:0;min-height:100px;padding:12px 10px}
#vip .envelopes-resumo button>span:last-child{min-width:0}#vip .envelopes-resumo b{font-size:18px}
#vip .envelopes-resumo small{font-size:10px;line-height:1.4}#vip .envelopes-mini{width:32px;height:32px}
.en-perda{display:block;margin:8px 0 4px;color:var(--verm);font:400 14px/1.25 Anton,sans-serif;letter-spacing:.03em}
#envelopes .en-perda{font-size:18px}
#kEnvelope[hidden]{display:none}#kEnvelope{margin:10px 0}
#envelopes{position:fixed;inset:0;z-index:100002;margin:0;width:100%;max-width:none;height:100%;max-height:none;border:0;padding:0;background:#15120f;color:#f4f1ea;overscroll-behavior:contain;touch-action:pan-y;overflow-y:auto}
#envelopes:not([open]){display:none}#envelopes::backdrop{background:#000c}
#envelopes .en-topo{position:sticky;top:0;z-index:12;display:flex;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top)) 18px 10px;background:#15120ff5;border-bottom:1px solid #ffffff30}
#envelopes .en-topo div{flex:1}#envelopes h2{font:400 26px/1.1 Anton,sans-serif;color:#fdc72f;letter-spacing:.04em}
#envelopes .en-topo p{font:700 10px/1.4 'Courier Prime',monospace;margin-top:5px}#envelopes .en-x{width:44px;height:44px;color:#f4f1ea;font:26px sans-serif}
#envelopes .en-lista{width:min(100%,430px);margin:auto;padding:22px 22px calc(36px + env(safe-area-inset-bottom));display:grid;gap:26px}
#envelopes .en-item{min-width:0;scroll-margin-top:110px}
#envelopes .en-etiqueta{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:8px;font:400 20px/1.2 Anton,sans-serif}
#envelopes .en-etiqueta small{font:700 10px 'Courier Prime',monospace;color:#fdc72f}
#envelopes .en-papel{position:relative;height:210px;isolation:isolate;perspective:700px;border-radius:4px;background:linear-gradient(150deg,#dbb47c,#b88546);box-shadow:0 12px 24px #0008,inset 0 0 0 1px #0003}
#envelopes .en-papel::after{content:'';position:absolute;inset:0;background-image:var(--noise);opacity:.22;pointer-events:none;z-index:6}
#envelopes .en-frente{position:absolute;inset:0;z-index:4;border-radius:4px;background:linear-gradient(30deg,#b78346,#d7ae75);clip-path:polygon(0 0,50% 55%,100% 0,100% 100%,0 100%);pointer-events:none}
#envelopes .en-aba{position:absolute;inset:0 0 auto;height:126px;background:linear-gradient(#e0bc86,#c09154);clip-path:polygon(0 0,100% 0,50% 100%);transform-origin:50% 0;z-index:5;filter:drop-shadow(0 2px 2px #0004);pointer-events:none}
#envelopes .en-lacre{position:absolute;z-index:7;left:50%;top:115px;margin:-47px 0 0 -47px;width:94px;height:94px;border-radius:50%;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;color:#1a1a1a}
#envelopes .en-cera,#envelopes .en-pedacos i{position:absolute;inset:9px;border-radius:43% 49% 44% 47%;background:var(--lacre);background-size:300% 300%;box-shadow:inset 0 0 0 4px #0002,inset 2px 4px 6px #fff5,0 5px 8px #0006;display:grid;place-items:center;font:400 28px Anton,sans-serif;pointer-events:none}
#envelopes .en-iridescente .en-cera{animation:en-iris 4s linear infinite}
#envelopes .en-lacre>svg{position:absolute;inset:0;width:94px;height:94px;transform:rotate(-90deg);pointer-events:none}
#envelopes .en-anel-base{fill:none;stroke:#1a1a1a55;stroke-width:4}#envelopes .en-anel{fill:none;stroke:#fdc72f;stroke-width:4;stroke-linecap:round;stroke-dasharray:277;stroke-dashoffset:277}
#envelopes .en-rachadura{position:absolute;inset:9px;z-index:1;background:#322213;clip-path:polygon(42% 0,55% 30%,43% 50%,62% 78%,53% 100%,57% 77%,37% 51%,49% 30%);opacity:0;pointer-events:none}
#envelopes .en-pedacos{position:absolute;inset:0;pointer-events:none;display:none}
#envelopes .en-pedacos i:nth-child(1){clip-path:polygon(0 0,48% 0,54% 30%,42% 52%,0 68%);--x:-60px;--y:-25px;--r:-45deg}
#envelopes .en-pedacos i:nth-child(2){clip-path:polygon(48% 0,100% 0,100% 60%,42% 52%,54% 30%);--x:65px;--y:-35px;--r:65deg}
#envelopes .en-pedacos i:nth-child(3){clip-path:polygon(0 68%,42% 52%,61% 77%,53% 100%,0 100%);--x:-48px;--y:65px;--r:-60deg}
#envelopes .en-pedacos i:nth-child(4){clip-path:polygon(42% 52%,100% 60%,100% 100%,53% 100%,61% 77%);--x:55px;--y:70px;--r:50deg}
#envelopes .en-carta{position:relative;z-index:2;margin:0 14px;background:#f4f1ea;color:#1a1a1a;padding:20px 18px;box-shadow:0 6px 14px #0005;visibility:hidden;opacity:0;transform:translateY(55px);overflow-wrap:anywhere}
#envelopes .en-carta small{font:700 10px 'Courier Prime',monospace;letter-spacing:.08em}#envelopes .en-carta h3{font:400 28px/1.1 Anton,sans-serif;margin:6px 0 10px}
#envelopes .en-carta p{font:700 12px/1.5 'Courier Prime',monospace;margin:5px 0}#envelopes .en-preco{border-block:1px dashed #1a1a1a55;padding:8px 0;margin:12px 0}
#envelopes .en-preco s{display:block;font:700 12px 'Courier Prime',monospace;color:#666}#envelopes .en-preco strong{display:block;font:400 32px/1.2 Anton,sans-serif;margin-top:4px}
#envelopes .en-carta .btn{width:100%;margin:14px 0 4px;text-decoration:none}
#envelopes .en-estado{text-align:center;font:700 11px/1.4 'Courier Prime',monospace;margin:12px 0 0;color:#ddd;min-height:31px}
#envelopes .en-bloqueado .en-cera{filter:grayscale(.8);opacity:.55;animation:none}#envelopes .en-cera svg{width:28px;height:28px}
#envelopes .en-lacre:disabled{cursor:default}#envelopes button:focus-visible,.envelopes-resumo button:focus-visible{outline:3px solid #fdc72f;outline-offset:3px}
#envelopes .en-aberto .en-papel{height:auto;padding:14px 0 24px}#envelopes .en-aberto .en-carta{visibility:visible;opacity:1;transform:none;z-index:8}
#envelopes .en-aberto .en-lacre,#envelopes .en-aberto .en-aba{visibility:hidden}
#envelopes .en-abrindo .en-papel{height:auto;min-height:210px;padding:14px 0 24px}
#envelopes .en-abrindo .en-cera{animation:en-quebra .45s both}#envelopes .en-abrindo .en-rachadura{animation:en-trinca .4s both}
#envelopes .en-abrindo .en-pedacos{display:block}#envelopes .en-abrindo .en-pedacos i{animation:en-pedaco .6s .2s both}
#envelopes .en-abrindo .en-aba{animation:en-abrir-aba .6s .35s both}#envelopes .en-abrindo .en-carta{visibility:visible;animation:en-carta .7s .65s both}
@keyframes en-iris{to{background-position:100% 50%}}
@keyframes en-trinca{0%{opacity:0}30%,85%{opacity:1}100%{opacity:0}}
@keyframes en-quebra{0%,45%{opacity:1}30%{transform:rotate(7deg)}65%,100%{opacity:0;transform:scale(1.08)}}
@keyframes en-pedaco{0%{opacity:0;transform:none}1%,25%{opacity:1}100%{opacity:0;transform:translate(var(--x),var(--y)) rotate(var(--r))}}
@keyframes en-abrir-aba{to{transform:rotateX(180deg);z-index:0}}
@keyframes en-carta{0%{opacity:0;transform:translateY(90px);z-index:2}45%{opacity:1;z-index:8}100%{opacity:1;transform:none;z-index:8}}
@media(prefers-reduced-motion:reduce){#envelopes *,#envelopes *::after{animation:none!important;transition:none!important}}
</style>`);
  document.body.insertAdjacentHTML('beforeend', `<dialog id="envelopes" aria-labelledby="enTitulo">
    <header class="en-topo"><div><h2 id="enTitulo">ENVELOPES SELADOS</h2><p id="enLegenda">BLACK FRIDAY · OFERTAS A REVELAR</p></div><button class="en-x" aria-label="Fechar envelopes">×</button></header>
    <div class="en-lista"></div></dialog>`);
  const painel = q('#envelopes');
  document.querySelectorAll('[data-envelopes]').forEach(el => {
    el.classList.add('envelopes-secao');
    el.innerHTML = '<h3>ENVELOPES SELADOS</h3><p>BLACK FRIDAY · OFERTAS A REVELAR</p><div class="envelopes-resumo"></div>';
    el.addEventListener('pointerdown', e => e.stopPropagation());
    el.addEventListener('click', e => { const b = e.target.closest('[data-envelope]'); if (b) abrir(b.dataset.envelope) });
  });
  function atualizar() {
    document.querySelectorAll('.envelopes-resumo').forEach(el => {
      el.innerHTML = CONFIG.niveis.map(n => { const livre = liberado(n); return `<button data-envelope="${n.id}" class="${livre ? '' : 'envelopes-bloq'}" style="--lacre:${esc(n.cor)}"><span class="envelopes-mini" aria-hidden="true">${livre ? n.nome[0] : cadeado}</span><span><b>${n.nome}</b>${el.closest('#vip') ? perda(n, livre) : ''}<small>${status(n)}</small></span></button>` }).join('');
    });
    if (q('#vip').classList.contains('on')) pintarVip();
    if (painel.open) montar();
  }
  function carta(n, semEstoque) {
    const desconto = typeof n.desconto === 'number' ? `${n.desconto}% DE DESCONTO` : n.desconto === 'A DEFINIR' ? 'DESCONTO: A DEFINIR' : n.desconto;
    return `<div class="en-carta" aria-hidden="true"><small>ENVELOPE ${n.nome} · CASO BLACK</small><h3>${esc(n.titulo)}</h3>
      <p>${n.dayUse ? 'DAY USE' : `${esc(n.diarias)} DIÁRIAS`} · ${esc(n.dias)}</p>
      <div class="en-preco"><s>DE ${esc(n.precoDe)}</s><strong>POR ${esc(n.precoPor)}</strong></div>
      <p>${esc(desconto)}</p><p>VALIDADE: ${esc(n.validade)}</p>
      ${n.quantidade !== undefined ? `<p>QUANTIDADE LIMITADA · ${esc(n.quantidade)} PACOTES<br>RESTAM ${esc(n.restantes)}</p>` : ''}
      <button class="btn en-garantir" ${semEstoque ? 'disabled' : ''}>${semEstoque ? 'ESGOTADO' : 'GARANTIR'}</button></div>`;
  }
  function montar() {
    cancelar?.();
    q('#enLegenda').textContent = demo ? 'DEMONSTRAÇÃO · NADA É SALVO' : 'BLACK FRIDAY · OFERTAS A REVELAR';
    painel.querySelector('.en-lista').innerHTML = CONFIG.niveis.map(n => {
      const livre = podeAbrir(n), sem = esgotado(n), aberto = livre && (demo ? demoAbertos : abertos).has(n.id);
      return `<article class="en-item ${!livre ? 'en-bloqueado' : ''} ${aberto ? 'en-aberto' : ''} ${n.id === 'niobio' ? 'en-iridescente' : ''}" data-id="${n.id}" style="--lacre:${esc(n.cor)}">
        <div class="en-etiqueta"><span>${n.nome}</span><small>${n.quantidade !== undefined ? sem ? 'ESGOTADO' : `LIMITADO · RESTAM ${esc(n.restantes)}` : 'ARQUIVO CONFIDENCIAL'}</small></div>
        <div class="en-papel">${carta(n, sem)}<div class="en-aba"></div><div class="en-frente"></div>
          <button class="en-lacre" aria-label="Segure por 1,2 segundo para abrir o envelope ${n.nome}" aria-describedby="en-status-${n.id}" ${!livre || sem || aberto ? 'disabled' : ''}>
            <span class="en-cera" aria-hidden="true">${!livre ? cadeado : n.nome[0]}</span><span class="en-rachadura"></span><span class="en-pedacos" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
            <svg viewBox="0 0 94 94" aria-hidden="true"><circle class="en-anel-base" cx="47" cy="47" r="44"/><circle class="en-anel" cx="47" cy="47" r="44"/></svg></button></div>
        <p class="en-estado" id="en-status-${n.id}" role="status">${perda(n, livre)}${status(n, livre, aberto)}${livre && !sem && !aberto ? ' · 1,2 s<br>ou segure Enter / Espaço' : ''}</p></article>`;
    }).join('');
    painel.querySelectorAll('.en-item').forEach(el => {
      const n = CONFIG.niveis.find(n => n.id === el.dataset.id), b = el.querySelector('.en-lacre');
      if (el.classList.contains('en-aberto')) el.querySelector('.en-carta').setAttribute('aria-hidden', 'false');
      ligar(el, b, n); el.querySelector('.en-garantir').onclick = () => garantir(n);
    });
  }
  function ligar(el, b, n) {
    let raf = 0, inicio = 0, origem = null, ponteiro = null;
    const anel = el.querySelector('.en-anel');
    const parar = () => { cancelAnimationFrame(raf); raf = 0; origem = null; ponteiro = null; anel.style.strokeDashoffset = '277'; if (cancelar === parar) cancelar = null };
    const iniciar = tipo => {
      if (b.disabled || origem || !podeAbrir(n) || esgotado(n)) return;
      cancelar?.(); origem = tipo; cancelar = parar; inicio = performance.now();
      const passo = agora => {
        if (!painel.open || document.hidden) return parar();
        const p = Math.min(1, (agora - inicio) / CONFIG.segurar); anel.style.strokeDashoffset = String(277 * (1 - p));
        if (p < 1) raf = requestAnimationFrame(passo);
        else { const teclado = origem !== 'ponteiro'; parar(); quebrar(el, b, n, teclado) }
      };
      raf = requestAnimationFrame(passo);
    };
    b.onpointerdown = e => { if (e.button !== 0 || !e.isPrimary) return; e.preventDefault(); iniciar('ponteiro'); if (origem) { ponteiro = e.pointerId; b.setPointerCapture(e.pointerId) } };
    b.onpointerup = b.onpointercancel = b.onlostpointercapture = e => { if (origem === 'ponteiro' && e.pointerId === ponteiro) parar() };
    b.onpointermove = e => { if (origem !== 'ponteiro' || e.pointerId !== ponteiro) return; const r = b.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) parar() };
    b.onkeydown = e => { if (e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); e.stopPropagation(); if (!e.repeat) iniciar(e.key) };
    b.onkeyup = e => { if (e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); if (origem === e.key) parar() };
    b.onblur = () => { if (origem) parar() }; b.oncontextmenu = e => e.preventDefault(); b.onclick = e => e.preventDefault();
  }
  function quebrar(el, b, n, teclado) {
    if (!podeAbrir(n) || esgotado(n)) return;
    const memoria = demo ? demoAbertos : abertos;
    if (memoria.has(n.id)) return;
    memoria.add(n.id); b.disabled = true;
    if (!demo) {
      try { const todos = ler(); todos.add(n.id); localStorage.setItem(LS, JSON.stringify([...todos])); abertos = todos } catch (_) {}
      // Evento local: ofertas ainda não têm tabela/contrato remoto na camada Dados.
      document.dispatchEvent(new CustomEvent('cb-envelope-aberto', {detail: {id: n.id, em: new Date().toISOString()}}));
    }
    try { navigator.vibrate?.(35) } catch (_) {}
    el.querySelector('.en-estado').textContent = 'carta aberta';
    const terminar = () => {
      el.classList.remove('en-abrindo'); el.classList.add('en-aberto'); el.querySelector('.en-carta').setAttribute('aria-hidden', 'false');
      if (teclado && painel.open && el.isConnected) { const carta = el.querySelector('.en-carta'); carta.tabIndex = -1; carta.focus({preventScroll: true}) }
    };
    if (calmo()) terminar(); else { el.classList.add('en-abrindo'); setTimeout(terminar, 1400) }
    document.querySelectorAll(`.envelopes-resumo [data-envelope="${n.id}"] small`).forEach(e => e.textContent = 'carta aberta');
  }
  function garantir(n) {
    if (esgotado(n) || (!demo && (!liberado(n) || !abertos.has(n.id)))) return;
    const avisar = texto => { q('#en-status-' + n.id).textContent = texto };
    if (demo) return avisar('Demonstração: nenhuma reserva é enviada.');
    const numero = CONFIG.WHATS.replace(/\D/g, '');
    if (!/^\d{10,15}$/.test(numero)) return avisar('WhatsApp de reservas: A DEFINIR.');
    const mensagem = `Olá! Conquistei o envelope ${n.nome} do Caso Black e quero garantir ${n.titulo}. ${n.dayUse ? 'Day use' : n.diarias + ' diárias'}, ${n.dias}. De ${n.precoDe} por ${n.precoPor}. Desconto: ${n.desconto}${typeof n.desconto === 'number' ? '%' : ''}. Validade: ${n.validade}.`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener');
  }
  function abrir(id, demonstracao = /^#demo/.test(location.hash)) {
    cancelar?.(); demo = demonstracao; foco = document.activeElement; montar();
    if (!painel.open) painel.showModal();
    const alvo = painel.querySelector(`[data-id="${id || CONFIG.niveis[0].id}"]`);
    requestAnimationFrame(() => { alvo?.scrollIntoView({block: 'start', behavior: 'instant'}); (alvo?.querySelector('.en-lacre:not(:disabled),.en-aberto .en-garantir:not(:disabled)') || painel.querySelector('.en-x')).focus({preventScroll: true}) });
  }
  function fechar() { cancelar?.(); painel.close(); if (foco?.isConnected) foco.focus({preventScroll: true}) }
  painel.querySelector('.en-x').onclick = fechar;
  painel.addEventListener('cancel', e => { e.preventDefault(); fechar() });
  painel.addEventListener('wheel', e => e.stopPropagation(), {passive: true}); painel.addEventListener('keydown', e => e.stopPropagation());
  q('#vip').addEventListener('wheel', e => e.stopPropagation(), {passive: true}); q('#vip').addEventListener('keydown', e => e.stopPropagation());
  addEventListener('blur', () => cancelar?.()); document.addEventListener('visibilitychange', () => { if (document.hidden) cancelar?.() });
  document.addEventListener('cb-carimbo', atualizar);
  addEventListener('storage', e => { if (e.key === LS) { abertos = ler(); atualizar() } });
  function aviso(n, novo) {
    const c = carimbos(), antes = c.filter(k => k !== n), fimAntes = n === 6 ? false : resolveu();
    const ganhos = novo ? CONFIG.niveis.filter(e => liberado(e, c, resolveu()) && !liberado(e, antes, fimAntes)) : [];
    const b = q('#kEnvelope'); b.hidden = !ganhos.length; b.textContent = ganhos.map(e => `Envelope ${e.nome} liberado!`).join(' ');
    b.onclick = () => { fechaOv('#carimbo'); pintarFicha(); abrir(ganhos[0].id) };
  }
  let ultimaRota = null;
  const rota = () => {
    const hash = location.hash, vip = hash === '#vip' || demoVip() !== null;
    window.DEMO = /^#demo/.test(hash);
    if (hash !== ultimaRota) { demoAbertos = new Set(); if (painel.open) fechar() }
    ultimaRota = hash;
    if (hash === '#demo-envelopes') abrir(null, true);
    else if (vip) { fechaFim(); irPara(3, false); liberar() }
    else q('#vip').classList.remove('on', 'go');
    atualizar();
  };
  addEventListener('hashchange', rota); atualizar(); queueMicrotask(rota);
  return {config: CONFIG, abrir, fechar, atualizar, aviso, resolvido: resolveu};
})();
