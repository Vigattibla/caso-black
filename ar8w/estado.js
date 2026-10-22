import {historia} from './historia.js';
export const STORAGE = 'cb8w_v1';
const novo = () => ({versao: 1, concluidas: [], dentes: {}, itens: {lente: false, chave: null}, provas: {}, final: false, fotos: []});
const fotoValida = f => typeof f === 'string' && /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(f);
export function criarEstado(storage) {
  try { storage ??= window.localStorage; } catch { /* privacidade/restrição do navegador */ }
  storage ??= {getItem() { return null; }, setItem() { throw Error('indisponível'); }};
  let valor = novo();
  try {
    const salvo = JSON.parse(storage.getItem(STORAGE));
    if (salvo?.versao === 1) {
      valor.concluidas = [...new Set((Array.isArray(salvo.concluidas) ? salvo.concluidas : []).filter(n => Number.isInteger(n) && n >= 1 && n <= 5))];
      // Reconstituir os prêmios da conclusão evita estados parciais/corrompidos.
      for (const n of valor.concluidas) {
        valor.provas[n] = historia.estacoes[n].prova || historia.estacoes[n].resultado;
        if (n < 5) valor.dentes[n] = 'CBBC'[n - 1];
      }
      valor.itens.lente = valor.concluidas.includes(1);
      valor.itens.chave = Object.keys(valor.dentes).length === 4 && salvo.itens?.chave?.codigo === 'CBBC' ? {codigo: 'CBBC', img: fotoValida(salvo.itens.chave.img) ? salvo.itens.chave.img : ''} : null;
      valor.final = valor.concluidas.includes(5) && !!salvo.final;
      valor.fotos = (Array.isArray(salvo.fotos) ? salvo.fotos : []).filter(fotoValida).slice(-5);
    }
  } catch { /* armazenamento indisponível: a sessão continua */ }
  const eventos = new EventTarget();
  function salvar() { let persistiu = true; try { storage.setItem(STORAGE, JSON.stringify(valor)); } catch { persistiu = false; } eventos.dispatchEvent(new Event('change')); return persistiu; }
  return {
    get valor() { return valor; }, eventos,
    concluir(n) {
      if (!historia.estacoes[n] || valor.concluidas.includes(n)) return false;
      if (n === 4 && !valor.itens.lente || n === 5 && !valor.itens.chave) return false;
      valor.concluidas.push(n); valor.provas[n] = historia.estacoes[n].prova || historia.estacoes[n].resultado;
      if (n < 5) valor.dentes[n] = 'CBBC'[n - 1];
      if (n === 1) valor.itens.lente = true;
      salvar(); return true;
    },
    podeLer() { return [1, 2, 3, 4].every(n => valor.dentes[n] === 'CBBC'[n - 1]); },
    guardarChave(codigo, img = '') { if (!this.podeLer() || codigo !== 'CBBC') return false; valor.itens.chave = {codigo, img}; salvar(); return true; },
    fechar() { if (!valor.concluidas.includes(5)) return false; valor.final = true; salvar(); return true; },
    foto(img) { if (!fotoValida(img)) return false; valor.fotos = [...valor.fotos, img].slice(-5); return salvar(); },
    reset() { valor = novo(); salvar(); },
  };
}
