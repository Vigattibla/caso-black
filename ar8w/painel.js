import {historia} from './historia.js';
import {falar, sequencia} from './fala.js';
const locais = ['Piscina', 'Restaurante', 'Espaço Kids', 'Cafeteria', 'Recepção'];
const titulos = ['Pegadas molhadas', 'Comanda sem nome', 'Câmera do Kids', 'O faro do Pipoca', 'Linha do tempo'];
export function criarPainel(n, {estado, onGanhar = () => {}, premiar = () => {}}) {
  const texto = historia.estacoes[n], quem = n === 3 ? 'Gabi' : 'Lucas';
  const el = document.createElement('section'); el.className = `e1 estacao estacao-${n}`; el.dataset.estacao = n;
  el.setAttribute('aria-label', `Estação ${n} · ${locais[n - 1]}`);
  el.innerHTML = `<header class="e1-rec e1-ficha"><i class="e1-tacha"></i><img src="${n === 5 ? './alvos/recepcao.webp' : `../assets/locais/${n}.webp`}" alt=""><small>ESTAÇÃO ${n} · ${locais[n - 1]}</small><h2>${titulos[n - 1]}</h2></header><div class="e1-jogo"></div><button class="e1-dica">PRECISA DE DICA?</button><div class="fala-slot"></div><div class="e1-fim" hidden><div class="e1-rec e1-carimbo"><i class="e1-tacha"></i><div class="e1-st">PROVA ENCONTRADA</div><p class="prova"></p><p class="dente"></p><button class="e1-segue">Continuar</button></div></div>`;
  const q = s => el.querySelector(s); let venceu = false;
  q('.e1-dica').onclick = () => falar(texto.dica, n === 4 ? 'Pipoca' : quem);
  function resultado(avisar) {
    venceu = true; el.dataset.concluida = 'true'; q('.e1-fim').hidden = false;
    q('.prova').textContent = texto.prova || texto.resultado; q('.dente').textContent = texto.dente || '';
    q('.e1-segue').onclick = () => { q('.e1-fim').hidden = true; };
    sequencia([texto.resultado, ...(avisar ? [texto.lente, texto.dente] : [texto.dente])].filter(Boolean).map(t => ({texto: t, quem})));
    if (avisar) { premiar(n === 1 ? 'lente' : 'dente', el); onGanhar(n); }
  }
  return {
    el, q, jogo: q('.e1-jogo'), texto, quem,
    get venceu() { return venceu; },
    iniciar() { if (estado.valor.concluidas.includes(n)) resultado(false); else falar(texto.fala, quem); },
    erro(alvo) { alvo?.classList.remove('e1-treme'); void alvo?.offsetWidth; alvo?.classList.add('e1-treme'); falar(texto.erro, n === 4 ? 'Pipoca' : quem); },
    ganhar() { if (venceu || !estado.concluir(n)) return; resultado(true); navigator.vibrate?.(40); },
  };
}
