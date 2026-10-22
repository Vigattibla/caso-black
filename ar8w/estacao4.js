import {criarPainel} from './painel.js?v=23';
import {falar, sequencia} from './fala.js';
import {historia} from './historia.js?v=23';
// Fotos/itens da vitrine original; pares embaralhados, sem solução indicada no DOM.
const itens = [['Chapéu preto', 'chapeu'], ['Casquinha', 'casquinha'], ['Picolé', 'picole'], ['Café', 'cafe'], ['Taça', 'taca'], ['Cookie', 'cookie']];
export function criarEstacao4(ctx) {
  const p = criarPainel(4, ctx); let iniciou = false, primeiro, ocupado = false, pares = 0, timer, socorro;
  p.jogo.innerHTML = '<div class="lente-alvo" data-ferramenta="lente"><span class="pegadas-pipoca" hidden>🐾 🐾 🐾</span><button class="e1-rec usar-lente">ARRASTE A LUPA PRA CÁ</button></div>';
  function usar(item) {
    if (item !== 'lente' || iniciou || p.venceu) return false;
    if (!ctx.estado.valor.itens.lente) { falar(p.texto['sem lente']); return false; }
    iniciou = true; p.q('.pegadas-pipoca').hidden = false; p.q('.usar-lente').hidden = true;
    // Na folha do faro: o Pipoca leva até a placa 4 (rastro AR no chão). Sem rastro (demo) o jogo abre aqui.
    if (!ctx.pista || ctx.demo || !ctx.estado.rastro()) sequencia([p.texto['lente usada'], p.texto.jogo], memoria);
    else sequencia([p.texto['lente usada']], seguir);
    return true;
  }
  function seguir() {
    if (!p.el.isConnected || p.venceu) return;
    const ligou = ctx.rastro?.(true);
    p.q('.lente-alvo').innerHTML = `<div class="rastro-aviso"><span class="pegadas-pipoca">🐾</span><b>SIGA AS PATINHAS NO CHÃO</b><small>Elas levam até a placa da Estação 4 · Cafeteria</small>${ctx.demo ? '<button class="e1-rec usar-lente achei">🐾 Achei a placa (teste)</button>' : ''}<button class="e1-rec nao-sigo" hidden>Não achei a placa</button></div>`;
    // Atalho só depois de procurar um bom tempo: o jogo é chegar andando até a placa.
    clearTimeout(socorro); socorro = setTimeout(() => { const b = p.el.isConnected && p.q('.nao-sigo'); if (b) b.hidden = false; }, ctx.demo ? 0 : 180000);
    p.q('.nao-sigo').onclick = () => { ctx.rastro?.(false); falar(p.texto.jogo, 'Pipoca'); memoria(); };
    if (ctx.demo) p.q('.achei').onclick = () => { ctx.rastro?.(false); falar(p.texto.achou, 'Pipoca'); memoria(); };
    falar(ligou === false ? p.texto['rastro dica'] : p.texto.rastro, 'Pipoca');
  }
  function memoria(agora) {
    if (!agora && !p.el.isConnected) return; // sequência de falas terminou depois de trocar de placa
    const ordem = [2, 0, 4, 1, 5, 3, 4, 2, 3, 0, 1, 5];
    // Fisher-Yates: o novo encontro com a placa não repete a posição dos pares.
    for (let i = ordem.length - 1; i; i--) { const j = Math.floor(Math.random() * (i + 1)); [ordem[i], ordem[j]] = [ordem[j], ordem[i]]; }
    p.jogo.innerHTML = `<div class="memoria">${ordem.map((id, i) => `<button class="e1-rec carta" data-carta="${i}" aria-label="Carta ${i + 1}" aria-pressed="false"><b>?</b><span hidden><img src="../assets/balcao/${itens[id][1]}.webp" alt="${itens[id][0]}">${itens[id][0]}</span></button>`).join('')}</div>`;
    const virar = (b, v) => { b.querySelector('b').hidden = v; b.querySelector('span').hidden = !v; b.setAttribute('aria-pressed', String(v)); };
    p.jogo.onclick = e => {
      const b = e.target.closest('[data-carta]'); if (!b || ocupado || b.disabled || b === primeiro || p.venceu) return;
      virar(b, true); if (!primeiro) { primeiro = b; return; }
      const a = primeiro; primeiro = null;
      if (ordem[+a.dataset.carta] === ordem[+b.dataset.carta]) { a.disabled = b.disabled = true; a.classList.add('e1-ok'); b.classList.add('e1-ok'); if (++pares === 6) p.ganhar(); }
      else { ocupado = true; p.erro(b); timer = setTimeout(() => { virar(a, false); virar(b, false); ocupado = false; }, 800); }
    };
  }
  p.el.usarFerramenta = usar; p.el.limpar = () => { clearTimeout(timer); clearTimeout(socorro); };
  p.q('.usar-lente').onclick = () => usar('lente');
  const v = ctx.estado.valor;
  if (v.concluidas.includes(4)) p.iniciar();
  else if (!ctx.pista && v.rastro4) { iniciou = true; falar(p.texto.achou, 'Pipoca'); memoria(true); } // chegou à placa 4 pelo rastro: sem repetir o vídeo
  else if (v.rastro4) { iniciou = true; p.q('.usar-lente').hidden = true; seguir(); } // voltou à folha no meio do caminho
  else if (!ctx.pista && !ctx.demo) { iniciou = true; p.q('.lente-alvo').innerHTML = '<div class="rastro-aviso"><span class="pegadas-pipoca">🐾</span><b>O PIPOCA ESTÁ FAREJANDO</b><small>Ache a folha FARO DO PIPOCA, use a lupa nela e siga as patinhas até aqui</small></div>'; falar(p.texto['pista cedo'] ?? p.texto['rastro dica'], 'Pipoca'); } // placa achada antes do faro
  else p.iniciar();
  return p.el;
}
