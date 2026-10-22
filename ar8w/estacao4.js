import {criarPainel} from './painel.js';
import {falar, sequencia} from './fala.js';
// Fotos/itens da vitrine original; pares embaralhados, sem solução indicada no DOM.
const itens = [['Chapéu preto', 'chapeu'], ['Casquinha', 'casquinha'], ['Picolé', 'picole'], ['Café', 'cafe'], ['Taça', 'taca'], ['Cookie', 'cookie']];
export function criarEstacao4(ctx) {
  const p = criarPainel(4, ctx); let iniciou = false, primeiro, ocupado = false, pares = 0, timer;
  p.jogo.innerHTML = '<div class="lente-alvo" data-ferramenta="lente"><span class="pegadas-pipoca" hidden>🐾 🐾 🐾</span><button class="e1-rec usar-lente">USAR LUPA DA MOCHILA</button></div>';
  function usar(item) {
    if (item !== 'lente' || iniciou || p.venceu) return false;
    if (!ctx.estado.valor.itens.lente) { falar(p.texto['sem lente']); return false; }
    iniciou = true; p.q('.pegadas-pipoca').hidden = false; p.q('.usar-lente').hidden = true;
    sequencia([p.texto['lente usada'], p.texto.jogo], memoria); return true;
  }
  function memoria() {
    if (!p.el.isConnected) return;
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
  p.el.usarFerramenta = usar; p.el.limpar = () => clearTimeout(timer);
  p.q('.usar-lente').onclick = () => usar('lente');
  p.iniciar(); return p.el;
}
