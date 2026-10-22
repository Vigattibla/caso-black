import {historia} from './historia.js?v=23';
import {falar, sequencia} from './fala.js';
import {tocarCaca} from './investigador.js';
const locais = ['Piscina', 'Restaurante', 'Espaço Kids', 'Cafeteria', 'Recepção'];
const titulos = ['Pegadas molhadas', 'Comanda sem nome', 'Câmera do Kids', 'O faro do Pipoca', 'Linha do tempo'];
// Falas-guia do kit de gravação; viram legenda enquanto o vídeo do Cacá toca.
const falasCaca = ['Pegada molhada… opa, essa tem uma estrela na sola! Me ajuda a achar as outras?',
  'Uma comanda sem nome, meia-noite e quinze. Quem pede alguma coisa a essa hora? …Eu. Mas não fui eu! Monta esse pedido aí.',
  'A câmera do Kids gravou alguma coisa de madrugada. Tem cinco coisas diferentes nessas fotos. Olho vivo!',
  'O Pipoca tá latindo pra essa placa. Tem alguma coisa escondida aqui que só a lupa mostra. Cadê a lupa da piscina?',
  'Trancado! Ainda bem que vocês montaram a chave. Abre esse cadeado e coloca as pistas na ordem do relógio.'];
// Retrato falado (frente da carta): cada testemunha dá um traço do suspeito.
const testemunhas = [{traco: 'ÓCULOS ESCUROS', texto: 'O salva-vidas viu o suspeito: óculos escuros! Desenha os óculos no retrato falado.'},
  {traco: 'BIGODÃO', texto: 'O garçom lembrou: um bigodão enorme! Desenha o bigode no retrato.'},
  {traco: 'CHAPÉU', texto: 'Na câmera tem a sombra de um chapéu! Desenha o chapéu no retrato.'},
  {traco: 'GRAVATA-BORBOLETA', texto: 'A moça da cafeteria viu uma gravata-borboleta. Desenha no retrato!'},
  {traco: 'SORRISÃO', texto: 'A recepcionista jura: ele saiu com um sorrisão. Desenha o sorriso e mira a câmera no retrato falado!'}];
const resultado5 = 'Uma da manhã: alguém de chapéu passou pela recepção sem fazer check-out.';
export function criarPainel(n, {estado, onGanhar = () => {}, premiar = () => {}}) {
  const texto = historia.estacoes[n], quem = n === 3 ? 'Gabi' : 'Lucas';
  const el = document.createElement('section'); el.className = `e1 estacao estacao-${n}`; el.dataset.estacao = n;
  el.setAttribute('aria-label', `Estação ${n} · ${locais[n - 1]}`);
  el.innerHTML = `<header class="e1-rec e1-ficha"><i class="e1-tacha"></i><img src="${n === 5 ? './alvos/recepcao.webp' : `../assets/locais/${n}.webp`}" alt=""><small>ESTAÇÃO ${n} · ${locais[n - 1]}</small><h2>${titulos[n - 1]}</h2></header><div class="e1-jogo"></div><button class="e1-dica">PRECISA DE DICA?</button><div class="fala-slot"></div><div class="e1-fim" hidden><div class="e1-rec e1-carimbo"><i class="e1-tacha"></i><div class="e1-st">PROVA ENCONTRADA</div><p class="prova"></p><p class="dente"></p><p class="testemunha"></p><p class="vire" hidden>VIRE A CARTA E MIRE A CÂMERA NO RETRATO FALADO</p><div class="e1-fotos"><button class="e1-foto">📸 Tirar foto</button><input class="e1-arquivo" type="file" accept="image/*" capture="environment" hidden><a class="e1-baixar" hidden></a></div><button class="e1-segue">Continuar</button></div></div>`;
  const q = s => el.querySelector(s); let venceu = false;
  q('.e1-dica').onclick = () => falar(texto.dica, n === 4 ? 'Pipoca' : quem);
  function resultado(avisar) {
    venceu = true; el.dataset.concluida = 'true'; q('.e1-fim').hidden = false;
    q('.prova').textContent = texto.prova || (n === 5 ? resultado5 : texto.resultado); q('.dente').textContent = texto.dente || '';
    const tes = testemunhas[n - 1]; q('.testemunha').textContent = `RETRATO FALADO · ${tes.traco}`;
    q('.e1-segue').onclick = () => { q('.e1-fim').hidden = true; }; q('.vire').hidden = n !== 5;
    q('.e1-foto').onclick = () => q('.e1-arquivo').click(); q('.e1-arquivo').onchange = e => fotografar(e.target.files[0]);
    sequencia([n === 5 ? resultado5 : texto.resultado, ...(avisar ? [texto.lente, texto.dente] : [texto.dente]), tes.texto, n === 5 && 'Agora vira a carta e mira a câmera no RETRATO FALADO pra descobrir quem foi!'].filter(Boolean).map(t => ({texto: t, quem})));
    if (avisar) { premiar(n === 1 ? 'lente' : 'dente', el); onGanhar(n); }
  }
  // Foto da turma na estação: reduz (≤900 px), carimba ESTAÇÃO n · LOCAL e guarda no álbum do final.
  function fotografar(arq) {
    if (!arq) return; const url = URL.createObjectURL(arq), img = new Image();
    img.onload = () => {
      const k = Math.min(1, 900 / Math.max(img.width, img.height)), c = document.createElement('canvas'), x = c.getContext('2d');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); x.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      const h = Math.round(c.width * .09); x.fillStyle = '#111d'; x.fillRect(0, c.height - h, c.width, h);
      x.fillStyle = '#fdc72f'; x.font = `400 ${Math.round(h * .5)}px Anton, sans-serif`; x.textBaseline = 'middle'; x.fillText(`CASO BLACK · ESTAÇÃO ${n} · ${locais[n - 1].toUpperCase()}`, h * .4, c.height - h / 2);
      const dado = c.toDataURL('image/jpeg', .8); estado.foto(dado);
      const a = q('.e1-baixar'); a.href = dado; a.download = `caso-black-estacao-${n}.jpg`; a.innerHTML = `<img src="${dado}" alt="Foto da estação ${n}">Salvar foto`; a.hidden = false;
      q('.e1-foto').textContent = '📸 Outra foto'; q('.e1-arquivo').value = '';
    };
    img.src = url;
  }
  return {
    el, q, jogo: q('.e1-jogo'), texto, quem,
    get venceu() { return venceu; },
    iniciar() { if (estado.valor.concluidas.includes(n)) resultado(false); else tocarCaca(el, `estacao${n}.mp4`, falasCaca[n - 1]).then(() => falar(texto.fala, quem)); },
    erro(alvo) { alvo?.classList.remove('e1-treme'); void alvo?.offsetWidth; alvo?.classList.add('e1-treme'); falar(texto.erro, n === 4 ? 'Pipoca' : quem); },
    ganhar() { if (venceu || !estado.concluir(n)) return; resultado(true); navigator.vibrate?.(40); },
  };
}
