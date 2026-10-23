import {historia} from './historia.js?v=25';
import {falar, sequencia} from './fala.js';
import {roteiro, pararRoteiro} from './investigador.js';
import {tirarFoto} from './foto.js?v=1';
const locais = ['Piscina', 'Restaurante', 'Espaço Kids', 'Cafeteria', 'Recepção'];
const titulos = ['Pegadas molhadas', 'Comanda sem nome', 'Câmera do Kids', 'O faro do Pipoca', 'Linha do tempo'];
// Roteiro Lucas + Cacá: Lucas no balão (voz VoiceStudio), Cacá no vídeo com a fala dele de legenda, na ordem do roteiro.
const C = (caca, leg) => ({caca, leg}), L = lucas => ({lucas});
const roteiros = [[C('estacao1.mp4', 'Pegada molhada… opa, essa tem uma estrela na sola!'), L('Me ajuda a achar as outras?')],
  [L('Uma comanda sem nome, meia-noite e quinze. Quem pede alguma coisa a essa hora?'), C('estacao2.mp4', '…Eu. Mas não fui eu! Monta esse pedido aí.')],
  [C('estacao3.mp4', 'A câmera do Kids gravou alguma coisa de madrugada.'), L('Tem cinco coisas diferentes nessas fotos. Olho vivo!')],
  [L('O Pipoca tá latindo pra essa placa!'), C('estacao4.mp4', 'Tem alguma coisa escondida ali, que só o celular mostra.')],
  [C('estacao5.mp4', 'Trancado!'), L('Ainda bem que vocês montaram a chave. Abre esse cadeado e coloca as pistas na ordem do relógio.')]];
// Retrato falado (frente da carta): cada testemunha dá um traço do suspeito.
const testemunhas = [{traco: 'ÓCULOS ESCUROS', texto: 'O salva-vidas viu o suspeito: óculos escuros! Desenha os óculos no retrato falado, na frente da sua carta.'},
  {traco: 'BIGODÃO', texto: 'O garçom lembrou: um bigodão enorme! Desenha o bigode no retrato.'},
  {traco: 'CHAPÉU', texto: 'Na câmera tem a sombra de um chapéu! Desenha o chapéu no retrato.'},
  {traco: 'GRAVATA-BORBOLETA', texto: 'A moça da cafeteria viu uma gravata-borboleta. Desenha no retrato!'},
  {traco: 'SORRISÃO', texto: 'A recepcionista jura: ele saiu com um sorrisão. Desenha o sorriso no retrato falado!'}];
const resultado5 = 'Uma da manhã: alguém de chapéu passou pela recepção sem fazer check-out.';
export function criarPainel(n, {estado, onGanhar = () => {}, premiar = () => {}}) {
  const texto = historia.estacoes[n], quem = n === 3 ? 'Gabi' : 'Lucas';
  const el = document.createElement('section'); el.className = `e1 estacao estacao-${n}`; el.dataset.estacao = n;
  el.setAttribute('aria-label', `Estação ${n} · ${locais[n - 1]}`);
  el.innerHTML = `<header class="e1-rec e1-ficha"><i class="e1-tacha"></i><img src="${n === 5 ? './alvos/recepcao.webp' : `../assets/locais/${n}.webp`}" alt=""><small>ESTAÇÃO ${n} · ${locais[n - 1]}</small><h2>${titulos[n - 1]}</h2></header><div class="e1-jogo"></div><button class="e1-dica">PRECISA DE DICA?</button><div class="fala-slot"></div><div class="e1-fim" hidden><div class="e1-rec e1-carimbo"><i class="e1-tacha"></i><div class="e1-st">PROVA ENCONTRADA</div><p class="prova"></p><p class="dente"></p><p class="testemunha"></p><p class="vire" hidden>VIRE A CARTA E MIRE A LUPA NO RETRATO FALADO</p><div class="e1-fotos"><button class="e1-foto">📸 Tirar foto</button><a class="e1-baixar" hidden></a></div><button class="e1-segue">Continuar</button></div></div>`;
  const q = s => el.querySelector(s); let venceu = false, autoFoto;
  el.limpar = () => { clearTimeout(autoFoto); pararRoteiro(el); };
  q('.e1-dica').onclick = () => falar(texto.dica, n === 4 ? 'Pipoca' : quem);
  function resultado(avisar) {
    venceu = true; el.dataset.concluida = 'true'; q('.e1-fim').hidden = false;
    q('.prova').textContent = texto.prova || (n === 5 ? resultado5 : texto.resultado); q('.dente').textContent = texto.dente || '';
    const tes = testemunhas[n - 1]; q('.testemunha').textContent = `RETRATO FALADO · ${tes.traco}`;
    q('.e1-segue').onclick = () => { q('.e1-fim').hidden = true; }; q('.vire').hidden = n !== 5;
    q('.e1-foto').onclick = () => fotografar();
    const falas = () => sequencia([n === 5 ? resultado5 : texto.resultado, ...(avisar ? [texto.lente, texto.dente] : [texto.dente]), tes.texto, n === 5 && 'Agora vira a carta e aponta a lupa mágica pro RETRATO FALADO pra descobrir quem foi!'].filter(Boolean).map(t => ({texto: t, quem})));
    if (avisar) { premiar(n === 1 ? 'lente' : 'dente', el); onGanhar(n); autoFoto = setTimeout(() => { if (el.isConnected) fotografar().then(() => { if (el.isConnected) falas(); }); }, 900); } else falas(); // estação vencida agora: a câmera de foto abre direto
  }
  // Foto da turma na estação: carimbada ESTAÇÃO n · LOCAL, vai pro álbum do final e fica pra salvar no carimbo.
  async function fotografar() {
    if (!el.isConnected) return;
    const dado = await tirarFoto({titulo: `FOTO DA ESTAÇÃO ${n}`, legenda: `CASO BLACK · ESTAÇÃO ${n} · ${locais[n - 1].toUpperCase()}`});
    if (!dado || !el.isConnected) return; estado.foto(dado, n);
    mostrarFoto(dado);
  }
  function mostrarFoto(dado) {
    const a = q('.e1-baixar'); a.href = dado; a.download = `caso-black-estacao-${n}.jpg`; a.innerHTML = `<img src="${dado}" alt="Foto da estação ${n}">Salvar foto`; a.hidden = false;
    q('.e1-foto').textContent = '📸 Outra foto';
  }
  if (estado.valor.fotosEstacoes?.[n]) mostrarFoto(estado.valor.fotosEstacoes[n]);
  return {
    el, q, jogo: q('.e1-jogo'), texto, quem,
    get venceu() { return venceu; },
    iniciar() { if (estado.valor.concluidas.includes(n)) resultado(false); else roteiro(el, roteiros[n - 1]).then(ativo => { if (ativo && el.isConnected) falar(texto.fala, quem); }); },
    erro(alvo) { alvo?.classList.remove('e1-treme'); void alvo?.offsetWidth; alvo?.classList.add('e1-treme'); falar(texto.erro, n === 4 ? 'Pipoca' : quem); },
    ganhar() { if (venceu || !estado.concluir(n)) return; resultado(true); navigator.vibrate?.(40); },
  };
}
