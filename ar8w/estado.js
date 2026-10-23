import {historia} from './historia.js?v=25';
export const STORAGE = 'cb8w_v1';
// Rodada: trocar o valor zera o progresso de todos os aparelhos no próximo acesso.
const RODADA = '2026-10-22d';
try { if (localStorage.getItem('cb_rodada') !== RODADA) { ['cb8w_v1', 'cb_rastro4', 'cb-chave', 'cb_tv'].forEach(k => localStorage.removeItem(k)); localStorage.setItem('cb_rodada', RODADA); } } catch { /* sem armazenamento: nada a zerar */ }
const novo = () => ({versao: 1, concluidas: [], dentes: {}, itens: {lente: false, chave: null}, mao: null, provas: {}, final: false, fotos: [], fotosEstacoes: {}, rastro4: false});
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
      valor.rastro4 = valor.itens.lente && !valor.concluidas.includes(4) && salvo.rastro4 === true;
      valor.fotos = (Array.isArray(salvo.fotos) ? salvo.fotos : []).filter(fotoValida).slice(-8);
      for (const n of [1,2,3,4,5]) if (fotoValida(salvo.fotosEstacoes?.[n])) valor.fotosEstacoes[n] = salvo.fotosEstacoes[n];
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
    foto(img, estacao) { if (!fotoValida(img)) return false; valor.fotos = [...valor.fotos, img].slice(-8); if ([1,2,3,4,5].includes(estacao)) valor.fotosEstacoes[estacao] = img; return salvar(); },
    // Lupa mora na carta; tocada no verso, vai para a mão (bandeja da tela) até ser usada.
    pegar(item) { if (item !== 'lente' || !valor.itens.lente || valor.concluidas.includes(4)) return false; valor.mao = item; salvar(); return true; },
    soltar() { valor.mao = null; salvar(); },
    rastro() { if (!valor.itens.lente || valor.concluidas.includes(4)) return false; valor.rastro4 = true; salvar(); return true; },
    reset() { valor = novo(); salvar(); },
  };
}
