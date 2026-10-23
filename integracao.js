/* Liga o caderno, a ficha e o jogo AR sem mudar as regras das estações. */
(() => {
  function pintar() {
    if (typeof atualizar !== 'function') return;
    try { achadas = JSON.parse(localStorage.getItem('cb-achadas') || '[]'); } catch (_) {}
    atualizar(); if (typeof pintarFicha === 'function') pintarFicha(); window.Envelopes?.atualizar();
  }
  document.addEventListener('cb-ar-sincronizado', pintar);
  addEventListener('pageshow', () => Dados.integrarAR());
  addEventListener('storage', e => { if (e.key === 'cb8w_v1') Dados.integrarAR(); });
  Dados.integrarAR().then(() => { pintar(); if (new URLSearchParams(location.search).has('album')) irPara(2, false); });
  Dados.grupo().then(link => {
    const b = document.querySelector('#grupoVip'); if (!b) return;
    b.textContent = link ? 'Entrar no grupo VIP' : 'Receber as ofertas da Black';
    b.onclick = () => {
      if (link) return open(link, '_blank', 'noopener');
      pedirCadastro(async () => {
        await Dados.esvaziar();
        toast(Dados.pendentes() ? 'Ficha salva neste aparelho. Conecte-se à internet para confirmar o cadastro.' : 'Contato registrado! O Village pode enviar as novidades da Black por ele.');
      });
    };
  });
})();
