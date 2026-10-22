/* node ar8w/tools/sincronizar_falas.cjs — textos literais da fonte de verdade. */
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../..');
const doc = fs.readFileSync(path.join(root, 'docs/historia-falas.md'), 'utf8');
const historia = {abertura: [], estacoes: {}, chave: {}, final: [], foto: []};
const vozes = {}; let secao, numero, ordem = 0;
const normalizar = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
for (const linha of doc.split(/\r?\n/)) {
  if (linha.startsWith('## ')) {
    const n = linha.match(/^## 0([1-5])/);
    secao = n ? 'estacoes' : /Abertura/.test(linha) ? 'abertura' : /Chave/.test(linha) ? 'chave' : /Final/.test(linha) ? 'final' : /Foto/.test(linha) ? 'foto' : '';
    if (n) { numero = Number(n[1]); historia.estacoes[numero] = {}; }
  }
  if (!linha.startsWith('- ') || !secao) continue;
  const textos = [...linha.matchAll(/`([^`]+)`/g)].map(m => m[1]);
  for (const texto of textos) {
    const label = linha.slice(2).split(':')[0];
    const quem = secao === 'final' ? label.replace('revela (Lucas)', 'Lucas') : secao === 'estacoes' && (numero === 3 || label.includes('Gabi')) ? 'Gabi' : numero === 4 && ['erro', 'dica'].includes(label) ? 'Pipoca' : 'Lucas';
    if (secao === 'abertura' || secao === 'foto') historia[secao].push(texto);
    else if (secao === 'final') historia.final.push({texto, quem});
    if (secao === 'estacoes') historia.estacoes[numero][label.replace(/ \(.+\)/, '')] = texto;
    if (secao === 'chave') historia.chave[label] = texto;
    vozes[(quem === 'Gabi' ? 'gabi|' : quem === 'Bê' ? 'be|' : quem === 'Pipoca' ? 'pipoca|' : '') + normalizar(texto)] = `../assets/a/v/v3-${String(++ordem).padStart(2, '0')}.m4a`;
  }
}
fs.writeFileSync(path.join(root, 'ar8w/historia.js'), '// Gerado de docs/historia-falas.md; não editar os textos aqui.\nexport const historia = ' + JSON.stringify(historia, null, 2) + ';\n');
fs.writeFileSync(path.join(root, 'ar8w/vozes.json'), JSON.stringify(vozes, null, 2) + '\n');
const disponiveis = [...new Set(Object.values(vozes))].filter(f => fs.existsSync(path.resolve(root, 'ar8w', f)));
fs.writeFileSync(path.join(root, 'ar8w/vozes-disponiveis.json'), JSON.stringify(disponiveis, null, 2) + '\n');
console.log(`${ordem} falas sincronizadas.`);
