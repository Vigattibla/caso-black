import {Voz} from './voz.js';
const balao = document.querySelector('#balao');
let fila = [], fim, atual;
export function calar() { fila = []; fim = null; atual = null; Voz.para(); balao.hidden = true; }
export function falar(texto, quem = 'Lucas') { sequencia([{texto, quem}]); }
export function sequencia(falas, depois) {
  fila = falas.map(f => typeof f === 'string' ? {texto: f, quem: 'Lucas'} : f); fim = depois;
  proxima();
}
function proxima() {
  const fala = fila.shift();
  if (!fala) { const cb = fim; fim = null; balao.querySelector('#fala-proxima').hidden = true; cb?.(); return; }
  balao.hidden = false;
  balao.querySelector('#beNome').textContent = fala.quem;
  balao.querySelector('#beTx').textContent = fala.texto;
  balao.querySelector('#beRetrato').hidden = fala.quem !== 'Bê';
  balao.querySelector('#fala-proxima').hidden = !fila.length && !fim;
  atual = fala; balao.querySelector('#fala-repetir').hidden = !Voz.tem(fala.texto, fala.quem);
  Voz.diz(fala.texto, fala.quem);
}
document.querySelector('#fala-repetir').onclick = () => atual && Voz.diz(atual.texto, atual.quem);
document.querySelector('#fala-proxima').onclick = proxima;
