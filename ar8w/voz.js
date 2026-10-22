// Mesmo contrato de voz.js: chave por texto normalizado; mídia ausente deixa só o balão.
const mapa = await fetch('./vozes.json').then(r => r.json()).catch(() => ({}));
const disponiveis = new Set(await fetch('./vozes-disponiveis.json').then(r => r.json()).catch(() => []));
const normalizar = t => String(t).replace(/<[^>]+>/g, '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
let audio;
export const Voz = {
  para() { if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); audio = null; } },
  tem(texto, quem = 'Lucas') {
    const prefixo = /gabi/i.test(quem) ? 'gabi|' : /bê/i.test(quem) ? 'be|' : /pipoca/i.test(quem) ? 'pipoca|' : '';
    const caminho = mapa[prefixo + normalizar(texto)] || mapa[normalizar(texto)];
    return caminho && disponiveis.has(caminho) ? caminho : '';
  },
  diz(texto, quem = 'Lucas') {
    this.para();
    const caminho = this.tem(texto, quem);
    if (!caminho) return;
    audio = new Audio(caminho); audio.onerror = () => {}; audio.play().catch(() => {});
  },
};
