/* Caso Black · vitrine da Lojinha (estação 04). Edite LOJA com os produtos reais:
   foto em assets/loja/<arquivo>.webp (quadrada, ~600px); preco '' esconde o preço.
   Sem foto, mostra um quadro tracejado com o nome. */
const LOJA = [
  {nome: 'Pelúcia do Bê',      preco: 'a confirmar', foto: ''},
  {nome: 'Caneca Village',     preco: 'a confirmar', foto: ''},
  {nome: 'Camiseta Turma do Bê', preco: 'a confirmar', foto: ''},
  {nome: 'Boné Village',       preco: 'a confirmar', foto: ''},
  {nome: 'Chaveiro',           preco: 'a confirmar', foto: ''},
];
const Vitrine = (() => {
  const el = document.getElementById('sLoja'), lista = document.getElementById('sLojaL');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  lista.innerHTML = LOJA.map(p => `<li>${p.foto
    ? `<img src="assets/loja/${esc(p.foto)}" alt="${esc(p.nome)}" loading="lazy">`
    : `<span class="sem">${esc(p.nome)}</span>`}<b>${esc(p.nome)}</b>${p.preco ? `<i>${esc(p.preco)}</i>` : ''}</li>`).join('');
  return {mostrar: on => { el.hidden = !on }};
})();
