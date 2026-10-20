/* Caso Black · vitrine da Lojinha (estação 04). Sem foto nem preço fixo (estoque varia):
   cada item é uma etiqueta de categoria com ícone. Edite LOJA à vontade. */
const IC = {
  brinquedo: '<circle cx="12" cy="13" r="7"/><path d="M5 13h14M12 6v14"/>',
  roupa: '<path d="M8 4l-4 3 2 4 2-1v10h8V10l2 1 2-4-4-3c-.5 1.5-2 2.5-4 2.5S8.5 5.5 8 4z"/>',
  lembranca: '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M4 13h16M12 9v11M12 9c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1"/>',
  doce: '<circle cx="12" cy="12" r="5"/><path d="M7 12l-4-3v6zM17 12l4-3v6z"/>',
  praia: '<path d="M12 3v18M4 10c0-4 4-7 8-7s8 3 8 7z"/>',
};
const LOJA = [
  {nome: 'Brinquedos', ic: 'brinquedo'},
  {nome: 'Roupas', ic: 'roupa'},
  {nome: 'Lembranças', ic: 'lembranca'},
  {nome: 'Doces', ic: 'doce'},
  {nome: 'Praia e piscina', ic: 'praia'},
];
const Vitrine = (() => {
  const el = document.getElementById('sLoja'), lista = document.getElementById('sLojaL');
  lista.innerHTML = LOJA.map(p => `<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">${IC[p.ic] || ''}</svg><b>${p.nome}</b><i>tem preço</i></li>`).join('');
  return {mostrar: on => { el.hidden = !on }};
})();
