/* Caso Black · vozes da turma. Cada fala do balão toca o áudio gravado com o mesmo texto (assets/a/v, gerados no VoiceStudio).
   Chave = texto normalizado; fala da Gabi usa prefixo "gabi|". Texto sem áudio fica só no balão. */
const Voz = (() => {
  const M = {
   "oieusouolucasobesumiuedeixouessapastacomalupamagicadelearrasteafolhaproladopravirar": "01-lucas-abertura",
   "essalupaemagicatoquenelaeaponteprasmanchasdacartanasplacaselamostraapista": "02-lucas-lupa",
   "sao5placaspeloresorteemcadaumatemalguemdaturmaesperandotoquenumaestacaopraverapista": "03-lucas-estacoes",
   "acadaplacaumafotodaequipenofimvocespostamoalbuminteironostory": "04-lucas-album",
   "ondeaaguaescondeoamareloalguemdeixoucairumsegredo": "05-lucas-piscina",
   "ondeafomeencontraosaborprocureoqueninguempedenocardapio": "06-lucas-restaurante",
   "gabi|ondeascriancasmandamalguemviroucriancatambem": "07-gabi-kids",
   "porondetodomundopassaninguemrepara": "08-lucas-recepcao",
   "todomundonafotocomolucaselavaiproalbumdocaso": "09-lucas-foto",
   "gabi|todomundonafotocomagabielavaiproalbumdocaso": "10-gabi-foto",
   "guardemnoalbumdocasooucompartilhemcomafamilia": "11-lucas-foto-pronta",
   "gabi|guardemnoalbumdocasooucompartilhemcomafamilia": "12-gabi-foto-pronta",
   "escolhaumafotodaequipenagaleria": "13-lucas-sem-camera",
   "gabi|escolhaumafotodaequipenagaleria": "14-gabi-sem-camera",
   "todomundojuntodenovo": "15-lucas-foto-repetir",
   "gabi|todomundojuntodenovo": "16-gabi-foto-repetir",
   "agorajunteos5pedacosdoretratoeleiaapalavraqueaparece": "17-lucas-palavra",
   "provascompletaspegasuacartaabrealupaeapontaproselonoversodequemseraessadigital": "18-lucas-provas-completas",
   "codigoerradoeletaimpressoembaixodoselonoversodacarta": "19-lucas-codigo-errado",
   "casofechadoeobeapareceufinalmente": "20-lucas-caso-fechado",
   "ouviuissoeopipocaelefarejoualgumacoisaaqui": "23-lucas-pipoca-chegou",
   "todomundonafotocomopipocaelavaiproalbumdocaso": "24-lucas-foto-pipoca",
   "todomundonafotocomaturmaessaeaultimadoalbum": "25-lucas-foto-turma",
   "ondetudotemprecoopipocafarejouoquenaoestaavenda": [
    "pipoca-au-au",
    "31-lucas-lojinha"
   ]
  };
  const n = t => String(t).replace(/<[^>]+>/g, '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  let a = null, fila = [], mudo = false;
  try { mudo = localStorage.getItem('cbMudo') === '1' } catch (_) {}
  function prox() { const f = fila.shift(); if (!f) return a = null; a = new Audio(`assets/a/v/${f}.m4a`); a.onended = prox; a.play().catch(() => { fila = []; a = null }) }
  function toca(l) { para(); if (mudo) return; fila = [].concat(l); prox() }
  function para() { fila = []; if (a) { a.onended = null; a.pause(); a = null } }
  function diz(t, quem) { const k = n(t), q = quem && /gabi/i.test(quem) ? 'gabi|' + k : k, f = M[q] || M[k]; if (f) toca(f) }
  return {diz, toca, para, carimbo: c => c >= 1 && c <= 5 && toca(`${25 + c}-lucas-carimbo-${c}`),
    mudo: v => { if (v === undefined) return mudo; mudo = !!v; if (mudo) para(); try { localStorage.setItem('cbMudo', mudo ? '1' : '0') } catch (_) {} }};
})();
