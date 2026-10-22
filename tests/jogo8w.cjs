/* node tests/jogo8w.cjs — Chrome headless/CDP; sem dependências npm, sem câmera na demo. */
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), os = require('node:os'), assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.AR_CHROME || 'C:/Users/Vigatti/AppData/Local/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-win64/chrome-headless-shell.exe';
const OUT = path.join(os.tmpdir(), 'cb-jogo8w-shots'), perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'cb-jogo8w-'));
let browser, server, ws, id = 0; const pending = new Map(), errors = [], faltando = [], checks = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
function cdp(method, params = {}) { return new Promise((resolve, reject) => { const n = ++id, t = setTimeout(() => { pending.delete(n); reject(Error('Timeout ' + method)); }, 20000); pending.set(n, {resolve: r => { clearTimeout(t); resolve(r); }, reject: e => { clearTimeout(t); reject(e); }}); ws.send(JSON.stringify({id: n, method, params})); }); }
async function ev(expression) { const r = await cdp('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value; }
async function ok(expr, label) { assert.ok(await ev(expr), label); checks.push(label); }
async function until(expr, label) { const t = Date.now(); while (Date.now() - t < 20000) { if (await ev(expr).catch(() => false)) { checks.push(label); return; } await sleep(75); } throw Error(label); }
async function click(s) { await ev(`document.querySelector(${JSON.stringify(s)}).click()`); }
async function abrir(demo, reset = false) { await cdp('Page.navigate', {url: `http://127.0.0.1:${server.address().port}/ar8w/?demo=${demo}${reset ? '&reset=1' : ''}`}); await until(`window.__ar8w?.pronto && __ar8w.alvo===${JSON.stringify(demo === 'verso' ? 'verso' : 'placa-' + demo)}`, 'demo ' + demo + ' pronta'); }
async function shot(nome) { await sleep(180); const r = await cdp('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(path.join(OUT, nome + '.png'), Buffer.from(r.data, 'base64')); }
async function arrastar(origem, destino) {
  const ponto = s => ev(`(()=>{const r=document.querySelector(${JSON.stringify(s)}).getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
  const a = await ponto(origem), b = await ponto(destino);
  await cdp('Input.dispatchMouseEvent', {type: 'mousePressed', ...a, button: 'left', clickCount: 1});
  for (let i = 1; i <= 8; i++) await cdp('Input.dispatchMouseEvent', {type: 'mouseMoved', x: a.x + (b.x - a.x) * i / 8, y: a.y + (b.y - a.y) * i / 8, button: 'left', buttons: 1});
  await cdp('Input.dispatchMouseEvent', {type: 'mouseReleased', ...b, button: 'left', clickCount: 1});
}
async function main() {
  fs.mkdirSync(OUT, {recursive: true});
  const doc = fs.readFileSync(path.join(ROOT, 'docs/historia-falas.md'), 'utf8'), vozes = JSON.parse(fs.readFileSync(path.join(ROOT, 'ar8w/vozes.json'), 'utf8'));
  assert.equal(Object.keys(vozes).length, [...doc.matchAll(/`([^`]+)`/g)].length, 'todas as falas têm um arquivo v3 em ordem');
  for (let n = 2; n <= 5; n++) { const alvo = JSON.parse(fs.readFileSync(path.join(ROOT, `ar8w/alvos/placa-${n}.json`))); assert.equal(alvo.type, 'PLANAR'); assert.equal(alvo.properties.width, 1200); assert.equal(alvo.properties.height, 1600); for (const f of Object.values(alvo.resources)) assert.ok(fs.existsSync(path.join(ROOT, 'ar8w/alvos', f))); }
  const mime = {'.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.m4a': 'audio/mp4'};
  server = http.createServer((req, res) => {
    let url = decodeURIComponent(req.url.split('?')[0]); if (url.endsWith('/')) url += 'index.html';
    const file = path.resolve(ROOT, '.' + url); if (!file.startsWith(ROOT + path.sep) || path.basename(file) === 'debug.log') { res.writeHead(403); return res.end(); }
    fs.readFile(file, (e, b) => { if (e && url !== '/favicon.ico') faltando.push(url); res.writeHead(e ? 404 : 200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream'}); res.end(e ? '' : b); });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  browser = spawn(CHROME, ['--headless', '--no-sandbox', '--mute-audio', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--remote-debugging-port=0', '--user-data-dir=' + perfil, 'about:blank'], {windowsHide: true, stdio: ['ignore', 'ignore', 'pipe']});
  const endpoint = await new Promise((resolve, reject) => { let buf = ''; const t = setTimeout(() => reject(Error('Sem CDP')), 15000); browser.on('error', e => { clearTimeout(t); reject(e); }); browser.stderr.on('data', b => { buf += b; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); resolve(m[1]); } }); });
  const targets = await (await fetch(endpoint.replace('ws:', 'http:').replace(/\/devtools.*/, '/json'))).json();
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (p) m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result); } else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value || a.description).join(' ')); };
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Emulation.setDeviceMetricsOverride', {width: 390, height: 844, deviceScaleFactor: 2, mobile: true});
  await abrir(4, true); await click('.usar-lente');
  await ok(`!window.XR8&&!document.querySelector('script[src="./xr/xr.js"]')`, 'demo não carrega câmera nem runtime XR');
  await ok(`!document.querySelector('.memoria')&&document.querySelector('#beTx').textContent==='Falta a lente. Ela ficou na piscina!'`, '4 bloqueia memória sem lente'); await shot('04-sem-lente');
  await abrir(5); await click('[data-item=chave]');
  await ok(`!document.querySelector('.tempo')&&!__ar8w.estado.valor.concluidas.length&&document.querySelector('#beTx').textContent==='A recepção tá trancada. Falta a chave!'`, '5 bloqueia sem chave'); await shot('05-sem-chave');
  await abrir('verso'); await click('.ler-chave'); await ok(`!__ar8w.estado.valor.itens.chave&&!document.querySelector('.final-revelado:not([hidden])')`, 'verso exige os quatro dentes');
  await abrir(1); await click('[data-pegada="1"]'); await ok(`document.querySelector('#beTx').textContent==='Essa não tem estrela. Olha de novo!'&&!__ar8w.estado.valor.itens.lente`, '1 rejeita pegada sem estrela');
  for (const i of [0, 3, 5]) await click(`[data-pegada="${i}"]`);
  await ok(`__ar8w.estado.valor.itens.lente&&__ar8w.estado.valor.dentes[1]==='C'&&__ar8w.estado.valor.provas[1]==='Sola de estrela, pé de adulto.'`, '1 entrega lente, prova e dente para cima'); await shot('01-premio-lente');
  await click('.e1-segue'); await ok(`document.querySelector('#beTx').textContent.startsWith('Achei!')`, 'resultado da estação usa fala literal'); await click('#fala-proxima'); await ok(`document.querySelector('#beTx').textContent==='Lente guardada na mochila. Ela vai servir mais pra frente.'`, 'lente tem fala própria'); await click('#fala-proxima'); await shot('01-dente');
  await abrir(1); await ok(`document.querySelector('[data-concluida=true]')&&__ar8w.estado.valor.concluidas.length===1`, 'reabrir estação restaura prêmio sem duplicar');
  await abrir(2); await click('[data-tira="2"]'); await ok(`!__ar8w.estado.valor.concluidas.includes(2)`, 'comanda recusa ordem errada'); for (const i of [0, 1, 2, 3]) await click(`[data-tira="${i}"]`); await ok(`__ar8w.estado.valor.dentes[2]==='B'`, 'comanda entrega dente para baixo'); await shot('02-comanda');
  await abrir(3); for (const id of ['escorregador', 'castelo', 'camiseta', 'cadeira', 'chapeu']) await click(`[data-dif="${id}"]`);
  await ok(`__ar8w.estado.valor.dentes[3]==='B'&&document.querySelectorAll('[aria-pressed=true][data-dif]').length===5`, 'cinco diferenças entregam prova e dente'); await shot('03-camera');
  await abrir(4); await arrastar('[data-item=lente]', '[data-ferramenta=lente]');
  await ok(`document.querySelector('#beTx').textContent==='Pegadas do Pipoca! A lente revelou a tinta escondida.'&&!document.querySelector('.pegadas-pipoca').hidden`, 'arrastar lente na placa revela pegadas'); await shot('04-lente-revela');
  await click('#fala-proxima'); await click('#fala-proxima'); await until(`document.querySelectorAll('[data-carta]').length===12`, 'memória só abre depois da lente');
  // Joga pelos pares visíveis; sem chamar o método de conclusão/alterar storage.
  const pares = await ev(`(()=>{const m={};document.querySelectorAll('[data-carta]').forEach(b=>{const nome=b.querySelector('img').alt;(m[nome]??=[]).push(b.dataset.carta)});return Object.values(m)})()`);
  const a = pares[0][0], b = pares[1][0]; await click(`[data-carta="${a}"]`); await click(`[data-carta="${b}"]`); await ok(`document.querySelector('#beTx').textContent==='Au!'`, 'par errado usa latido'); await sleep(850);
  for (const par of pares) for (const i of par) await click(`[data-carta="${i}"]`);
  await ok(`Object.values(__ar8w.estado.valor.dentes).join('')==='CBBC'&&__ar8w.estado.podeLer()`, 'memória completa os quatro dentes CBBC'); await shot('04-memoria');
  await abrir('verso'); await click('.ler-chave'); await ok(`document.querySelector('#beTx').textContent==='Essa chave não encaixa. Confere os dentes nas placas.'&&!__ar8w.estado.valor.itens.chave&&__ar8w.quadro.ultimaLeitura.codigo==='CCCC'`, 'leitor de pixels rejeita CCCC'); await shot('verso-errado');
  await click('[data-dente="1"]'); await click('[data-dente="2"]'); await click('.ler-chave');
  await ok(`__ar8w.quadro.ultimaLeitura.codigo==='CBBC'&&__ar8w.estado.valor.itens.chave.codigo==='CBBC'&&JSON.parse(localStorage.cb8w_v1).itens.chave.codigo==='CBBC'`, 'mesmo leitor aceita CBBC e persiste chave'); await shot('verso-chave');
  await abrir(5); await ok(`!document.querySelector('.tempo')`, '5 exige uso da chave mesmo guardada'); await arrastar('[data-item=chave]', '[data-ferramenta=chave]');
  await ok(`document.querySelector('#beNome').textContent==='Gabi'&&document.querySelector('.aberto')`, 'arrastar chave abre cadeado e fala Gabi'); await shot('05-cadeado-aberto');
  await until(`document.querySelector('[data-tempo]')`, 'cadeado libera linha do tempo'); await click('[data-tempo="3"]'); await ok(`document.querySelector('#beTx').textContent==='A ordem não bate. Olha os horários.'`, 'linha do tempo recusa ordem errada');
  for (let i = 0; i < 5; i++) await click(`[data-tempo="${i}"]`);
  await ok(`__ar8w.estado.valor.concluidas.length===5&&!__ar8w.estado.valor.final`, '5 conclui caso e manda voltar ao verso'); await shot('05-prova');
  await abrir('verso'); await ok(`__ar8w.estado.valor.final&&!document.querySelector('.final-revelado').hidden&&document.querySelector('.digital path')`, 'verso revela digital dourada só após estação 5'); await sleep(1650); await shot('final-digital');
  await click('#fala-proxima'); await ok(`document.querySelector('#beTx').textContent==='Fui eu! Peguei a Black emprestada pra preparar uma surpresa.'&&!document.querySelector('#beRetrato').hidden`, 'Bê confessa com cabeça'); await shot('final-be'); await click('#fala-proxima'); await ok(`document.querySelector('#beTx').textContent.includes('27 de novembro')`, 'Bê anuncia data e VIP'); await click('#fala-proxima'); await click('#fala-proxima');
  await ok(`!document.querySelector('.foto-convite').hidden&&document.querySelector('input[type=file]').accept==='image/*'`, 'final convida foto para álbum'); await shot('final-foto');
  const dom = await cdp('DOM.getDocument'), input = await cdp('DOM.querySelector', {nodeId: dom.root.nodeId, selector: 'input[type=file]'});
  await cdp('DOM.setFileInputFiles', {nodeId: input.nodeId, files: [path.join(ROOT, 'assets/be-cabeca.png')]});
  await until(`__ar8w.estado.valor.fotos.length===1&&document.querySelector('.album a[download]')`, 'foto escolhida vai ao álbum e pode baixar');
  await abrir('verso'); for (let i = 0; i < 4; i++) await click('#fala-proxima');
  await ok(`__ar8w.estado.valor.final&&document.querySelectorAll('.album img').length===1`, 'álbum e final persistem após recarregar');
  // Corrupção de storage não derruba o jogo.
  await ev(`localStorage.setItem('cb8w_v1','{quebrado')`); await abrir(4); await click('.usar-lente'); await ok(`!__ar8w.estado.valor.itens.lente`, 'storage corrompido recomeça sem prêmios');
  // O runtime real carrega seis alvos; simular eventos não concede prêmios.
  await cdp('Page.navigate', {url: `http://127.0.0.1:${server.address().port}/ar8w/`});
  await until(`window.__ar8w?.configurado||window.__ar8w?.configErro`, 'configuração AR respondeu');
  await ok(`!__ar8w.configErro&&__ar8w.alvos.join(',')==='placa-1,placa-2,placa-3,placa-4,placa-5,verso'`, 'XR8 aceita os seis alvos PLANAR');
  const pose = `{position:{x:0,y:1.5,z:-2},rotation:{x:0,y:0,z:0,w:1},scale:1,scaledWidth:1,scaledHeight:4/3}`;
  for (const nome of ['placa-1', 'placa-4', 'placa-2', 'verso', 'placa-5']) {
    await ev(`__ar8w.simular({...${pose},name:'${nome}'})`);
    await ok(`__ar8w.alvo==='${nome}'&&__ar8w.quadro.dataset.estacao==='${nome === 'verso' ? 'verso' : nome.slice(-1)}'&&__ar8w.quadro.querySelector('#balao')`, 'alvo seleciona quadro único ' + nome);
  }
  await ok(`!document.querySelectorAll('.q-suspeitos').length&&!__ar8w.estado.valor.concluidas.length`, 'trocar alvo não inventa progresso');
  await ev(`__ar8w.simular({name:'placa-1'},'lost')`); await ok(`__ar8w.ancora.visto`, 'evento perdido de outro alvo é ignorado');
  await ev(`__ar8w.simular({name:'placa-5'},'lost')`); await ok(`!__ar8w.ancora.visto&&!!__ar8w.ancora.pose`, 'perder alvo conserva pose no mundo');
  const app = fs.readFileSync(path.join(ROOT, 'ar8w/app.js'), 'utf8'); assert.ok(app.includes('XR8.FullWindowCanvas.pipelineModule()')); assert.ok(!/canvas\.(?:width|height)\s*=|devicePixelRatio|nitidez/.test(app));
  assert.deepEqual(errors, [], 'sem exceções JavaScript'); assert.deepEqual([...new Set(faltando)], [], 'sem assets faltando ou pedidos de áudio ausente');
  console.log(`${checks.length} verificações OK; fluxo 1–5, bloqueios, leitor CBBC, persistência e final.\nScreenshots: ${OUT}`);
}
main().catch(e => { console.error(e.stack); process.exitCode = 1; }).finally(() => { ws?.close(); browser?.kill(); server?.close(); });
