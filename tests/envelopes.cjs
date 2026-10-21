/* node tests/envelopes.cjs · Chromium/CDP, sem dependências e sem backend. */
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os'), {spawn} = require('child_process');
const ROOT = path.resolve(__dirname, '..'), OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'cb-envelopes-'));
const CHROME = process.env.AR_CHROME || 'C:/Users/Vigatti/AppData/Local/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-win64/chrome-headless-shell.exe';
let server, browser, ws, seq = 0, endpoint;
const pending = new Map(), checks = [], errors = [], network = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
function cdp(method, params = {}) { return new Promise((resolve, reject) => { const id = ++seq, t = setTimeout(() => { pending.delete(id); reject(Error('Timeout ' + method)) }, 15000); pending.set(id, {resolve: r => { clearTimeout(t); resolve(r) }, reject: e => { clearTimeout(t); reject(e) }}); ws.send(JSON.stringify({id, method, params})) }) }
async function ev(expression) { const r = await cdp('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true, replMode: true}); if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result.value }
async function ok(expression, label) { if (!await ev(expression)) throw Error(label); checks.push(label) }
async function until(expression, label) { for (let i = 0; i < 80; i++) { if (await ev(expression)) return; await sleep(100) } throw Error(label) }
async function nav(hash = '') { const url = endpoint + '/?envelopes-test=' + Date.now() + hash; await cdp('Page.navigate', {url}); await until(`location.href===${JSON.stringify(url)} && !!window.Envelopes && typeof Quadro !== 'undefined'`, 'Carregar módulos') }
async function touchStart(selector) {
  const pos = await ev(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});b.scrollIntoView({block:'center',behavior:'instant'});const r=b.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;if(!b.contains(document.elementFromPoint(x,y)))throw Error('Alvo coberto '+${JSON.stringify(selector)});return {x,y}})()`);
  await cdp('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{...pos, radiusX: 2, radiusY: 2, force: 1}]});
}
async function touchEnd() { await cdp('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []}) }
async function hold(selector, ms = 1300) { await touchStart(selector); await sleep(ms); await touchEnd() }
async function key(type, key) { const space = key === ' '; await cdp('Input.dispatchKeyEvent', {type, key, code: space ? 'Space' : 'Enter', windowsVirtualKeyCode: space ? 32 : 13}) }
async function shot(name) { const r = await cdp('Page.captureScreenshot', {format: 'png', captureBeyondViewport: false}); fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.data, 'base64')) }
const seal = id => `#envelopes [data-id="${id}"] .en-lacre`;
const opened = id => `document.querySelector('#envelopes [data-id="${id}"]').classList.contains('en-aberto')`;
async function main() {
  // Fontes substitutas locais: o teste não depende da rede do Google Fonts.
  const fontFile = path.join(os.homedir(), 'AppData/Local/Microsoft/Windows/Fonts/Oswald-VariableFont_wght.ttf');
  const antonSrc = fs.existsSync(fontFile) ? `url(data:font/ttf;base64,${fs.readFileSync(fontFile).toString('base64')})` : "local('Arial Narrow')";
  const fontCss = `@font-face{font-family:Anton;src:${antonSrc}}@font-face{font-family:Caveat;src:local('Caveat')}@font-face{font-family:'Courier Prime';src:local('Courier New')}`;
  const mime = {'.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json'};
  server = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), file = path.resolve(ROOT, '.' + (u === '/' ? '/index.html' : u)); if (!file.startsWith(ROOT + path.sep) || path.basename(file) === 'debug.log') { r.writeHead(403); r.end(); return } fs.readFile(file, (e, b) => { r.writeHead(e ? 404 : 200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream'}); r.end(e ? '' : b) }) });
  await new Promise(r => server.listen(0, '127.0.0.1', r)); endpoint = 'http://127.0.0.1:' + server.address().port;
  browser = spawn(CHROME, ['--headless', '--no-sandbox', '--mute-audio', '--autoplay-policy=user-gesture-required', '--remote-debugging-port=0', '--user-data-dir=' + path.join(OUT, 'profile'), 'about:blank'], {cwd: OUT, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe']});
  const devtools = await new Promise((resolve, reject) => { let log = ''; const t = setTimeout(() => reject(Error('Sem CDP')), 15000); browser.stderr.on('data', b => { log += b; const m = log.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); resolve(m[1]) } }) });
  const targets = await (await fetch(devtools.replace('ws:', 'http:').replace(/\/devtools.*/, '/json'))).json();
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id) { const p = pending.get(m.id); pending.delete(m.id); if (p) m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result) }
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    else if (m.method === 'Network.requestWillBeSent') network.push(m.params.request.url);
    else if (m.method === 'Fetch.requestPaused') { cdp('Fetch.fulfillRequest', {requestId: m.params.requestId, responseCode: 200, responseHeaders: [{name: 'Content-Type', value: 'text/css'}], body: Buffer.from(fontCss).toString('base64')}).catch(e => errors.push(e.message)) } };
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
  await cdp('Fetch.enable', {patterns: [{urlPattern: 'https://fonts.googleapis.com/*'}]});
  await cdp('Emulation.setDeviceMetricsOverride', {width: 430, height: 932, deviceScaleFactor: 2, mobile: true});
  await cdp('Emulation.setTouchEmulationEnabled', {enabled: true, maxTouchPoints: 1});
  if (!process.argv.includes('--vip')) {
  await nav();
  await ev(`localStorage.setItem('cb-ficha',JSON.stringify({id:'teste-local',nome:'Teste',contato:'teste@example.com',carimbos:[1],resolvido:false}));localStorage.setItem('cb-envelopes','["ouro"]')`);
  await nav('#demo-envelopes');
  const initial = await ev(`JSON.stringify([localStorage.getItem('cb-ficha'),localStorage.getItem('cb-envelopes')])`);
  await ok(`document.querySelectorAll('#envelopes .en-lacre:not(:disabled)').length===4`, 'Demo: quatro níveis liberados sem aproveitar aberturas reais');
  await shot('demo-fechados');
  await touchStart(seal('bronze')); await sleep(500);
  await ok(`+document.querySelector('#envelopes [data-id="bronze"] .en-anel').style.strokeDashoffset<250`, 'Anel avança durante pressão');
  await touchEnd(); await sleep(100);
  await ok(`!${opened('bronze')} && document.querySelector('#envelopes [data-id="bronze"] .en-anel').style.strokeDashoffset==='277'`, 'Soltar cedo cancela e zera anel');
  await hold(seal('bronze')); await sleep(1500); await ok(opened('bronze'), 'Toque contínuo abre Bronze'); await shot('demo-bronze-aberto');
  await ev(`document.querySelector(${JSON.stringify(seal('prata'))}).focus()`); await key('keyDown', 'Enter'); await sleep(400); await key('keyUp', 'Enter');
  await sleep(100); await ok(`!${opened('prata')}`, 'Enter curto cancela');
  await key('keyDown', 'Enter'); await sleep(1300); await key('keyUp', 'Enter'); await sleep(1450); await ok(opened('prata'), 'Enter segurado abre Prata');
  await ev(`document.querySelector(${JSON.stringify(seal('ouro'))}).focus()`); await key('keyDown', ' '); await sleep(1300); await key('keyUp', ' '); await sleep(1450); await ok(opened('ouro'), 'Espaço segurado abre Ouro');
  await hold(seal('niobio')); await sleep(1450); await ok(opened('niobio'), 'Toque contínuo abre Nióbio');
  await ev(`document.querySelector('#envelopes [data-id="niobio"] .en-garantir').click()`);
  await ok(`document.querySelector('#en-status-niobio').textContent.includes('nenhuma reserva')`, 'GARANTIR na demo não envia reserva');
  await ok(`JSON.stringify([localStorage.getItem('cb-ficha'),localStorage.getItem('cb-envelopes')])===${JSON.stringify(initial)}`, 'Demo preserva ficha e envelopes existentes');
  console.log('Demo: toque, cancelamento, Enter, Espaço e isolamento OK');
  await ev(`localStorage.removeItem('cb-envelopes')`); await nav();
  await ev(`window.aberturas=0;document.addEventListener('cb-envelope-aberto',()=>aberturas++);Envelopes.abrir('bronze',false)`);
  await ok(`document.querySelectorAll('#envelopes .en-lacre:disabled').length===4`, 'Uma estação: todos bloqueados');
  await ev(`Envelopes.fechar();await carimbarEstacao(1,'teste-local')`);
  await ok(`!document.querySelector('#kEnvelope').hidden && document.querySelector('#kEnvelope').textContent.includes('BRONZE')`, 'Segundo carimbo avisa Bronze no modal');
  await ev(`document.querySelector('#kEnvelope').click()`); await hold(seal('bronze')); await sleep(1450);
  await ok(`aberturas===1 && JSON.parse(localStorage.getItem('cb-envelopes')).join()==='bronze'`, 'Abertura real persiste e emite evento local uma vez');
  await ev(`Envelopes.config.WHATS='A DEFINIR';document.querySelector('#envelopes [data-id="bronze"] .en-garantir').click()`);
  await ok(`document.querySelector('#en-status-bronze').textContent.includes('A DEFINIR')`, 'WhatsApp pendente mostra aviso na galeria');
  await ev(`window.destino='';window.open=(u)=>{destino=u};Envelopes.config.WHATS='5531999999999';document.querySelector('#envelopes [data-id="bronze"] .en-garantir').click()`);
  await ok(`destino.startsWith('https://wa.me/5531999999999?text=') && decodeURIComponent(destino).includes('BRONZE')`, 'WhatsApp monta destino e mensagem sem envio real');
  await ev(`Envelopes.fechar();await carimbarEstacao(2,'teste-local')`);
  await ok(`document.querySelector('#kEnvelope').hidden`, 'Terceiro carimbo não repete aviso');
  await ev(`await carimbarEstacao(3,'teste-local')`); await ok(`document.querySelector('#kEnvelope').textContent.includes('PRATA') && !document.querySelector('#kEnvelope').hidden`, 'Quarto carimbo libera Prata');
  await ev(`await carimbarEstacao(4,'teste-local')`); await ok(`document.querySelector('#kEnvelope').textContent.includes('OURO') && !document.querySelector('#kEnvelope').hidden`, 'Quinto carimbo libera Ouro');
  await ev(`fechaOv('#carimbo');Envelopes.abrir('niobio',false)`);
  await ok(`document.querySelector(${JSON.stringify(seal('niobio'))}).disabled && document.querySelector('#en-status-niobio').textContent.includes('só para quem resolve o caso')`, 'Cinco estações ainda bloqueiam Nióbio');
  await ev(`await Dados.carimbar(6,'teste-local')`);
  await ok(`!document.querySelector(${JSON.stringify(seal('niobio'))}).disabled`, 'Carimbo 6 libera Nióbio e atualiza galeria aberta');
  await ev(`Envelopes.config.niveis[3].restantes=0;Envelopes.atualizar()`);
  await ok(`document.querySelector(${JSON.stringify(seal('niobio'))}).disabled && document.querySelector('#en-status-niobio').textContent==='ESGOTADO'`, 'Estoque zero impede abertura');
  await ev(`Envelopes.fechar()`); await nav(); await ev(`Envelopes.abrir('bronze',false)`);
  await ok(opened('bronze'), 'Recarregar mostra carta aberta direto');
  await ev(`Envelopes.fechar();Dados.ficha().carimbos=[];Dados.ficha().resolvido=true;Envelopes.atualizar();Envelopes.abrir('niobio',false)`);
  await ok(`!document.querySelector(${JSON.stringify(seal('niobio'))}).disabled && document.querySelector(${JSON.stringify(seal('bronze'))}).disabled`, 'ficha.resolvido libera só Nióbio; 6 não conta como estação');
  await cdp('Emulation.setEmulatedMedia', {features: [{name: 'prefers-reduced-motion', value: 'reduce'}]});
  await hold(seal('niobio')); await ok(opened('niobio'), 'Movimento reduzido abre direto após pressão');
  await ev(`Envelopes.config.niveis[3].restantes=0;Envelopes.atualizar()`);
  await ok(`document.querySelector('#envelopes [data-id="niobio"] .en-garantir').disabled`, 'Carta já aberta respeita estoque zerado');
  await ev(`Envelopes.fechar();primeira=false;irPara(3,false)`); await sleep(300);
  const pos = await ev(`(()=>{const r=document.querySelector('.fimW').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height*.75}})()`);
  await cdp('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{...pos, radiusX: 2, radiusY: 2, force: 1}]});
  for (let i=1;i<=6;i++) { await cdp('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x:pos.x,y:pos.y-i*25,radiusX:2,radiusY:2,force:1}]}); await sleep(30) }
  await touchEnd(); await sleep(150);
  await ok(`document.querySelector('.fimW').scrollTop>0 && k===3`, 'Folha final rola por toque sem virar página');
  await ev(`document.querySelector('.fimW [data-envelope="bronze"]').scrollIntoView({block:'center',behavior:'instant'})`); await shot('folha-final');
  await ok(`document.querySelectorAll('[data-envelopes]').length===3 && document.documentElement.scrollWidth<=430`, 'Seções na folha, revelação e VIP; sem overflow horizontal');
  await ev(`document.querySelector('.fimW [data-envelope="bronze"]').click()`); await ok(`document.querySelector('#envelopes').open`, 'Acesso pela folha final');
  await ev(`Envelopes.fechar();liberar();document.querySelector('#vip [data-envelope="niobio"]').scrollIntoView({block:'center',behavior:'instant'})`); await sleep(300); await shot('vip');
  await ev(`document.querySelector('#vip [data-envelope="niobio"]').click()`); await ok(`document.querySelector('#envelopes').open`, 'Acesso pelo VIP');
  await ev(`Envelopes.fechar();document.querySelector('#vip').className='';document.querySelector('#fimAnim').className='on fim';document.querySelector('#fimAnim [data-envelope="niobio"]').click()`); await ok(`document.querySelector('#envelopes').open`, 'Acesso pela revelação');
  await nav('#demos'); await until(`[...document.querySelectorAll('button')].some(b=>b.textContent==='Envelopes')`, 'Carregar menu #demos');
  await ev(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Envelopes').click()`);
  await until(`location.hash==='#demo-envelopes' && document.querySelector('#envelopes').open`, 'Botão Envelopes no menu de demos');
  checks.push('Menu #demos abre #demo-envelopes');
  await ev(`Envelopes.fechar();[...document.querySelectorAll('button')].find(b=>b.textContent==='Envelopes').click()`);
  await ok(`document.querySelector('#envelopes').open`, 'Menu reabre a demo quando a rota já está ativa');
  }
  await nav('#demos');
  await until(`[...document.querySelectorAll('button')].some(b=>b.textContent==='VIP sem resolver')`, 'Carregar demos VIP');
  await cdp('Emulation.setEmulatedMedia', {features: [{name: 'prefers-reduced-motion', value: 'reduce'}]});
  for (const [label, hash, fim] of [['VIP sem resolver','#demo-vip-aberto',false],['VIP resolvido','#demo-vip-ok',true]]) {
    await ev(`Envelopes.fechar();[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(label)}).click()`);
    await until(`location.hash===${JSON.stringify(hash)} && document.querySelector('#vip').classList.contains('go')`, 'Menu abre ' + label);
    await ok(`Envelopes.resolvido()===${fim}`, label + ': estado simulado');
  }
  await ev(`localStorage.clear()`); await nav('#vip');
  await ok(`document.querySelector('#vip.on .ok').textContent==='CASO EM ABERTO' && document.querySelector('#garantir').textContent==='Voltar ao caso'`, 'VIP direto sem ficha abre caso em aberto');
  await ok(`document.querySelector('#vip p.t').textContent==='Tem desconto já liberado esperando por você. Termine o caso para abrir os envelopes.' && document.querySelector('#vip p.t').nextElementSibling.matches('[data-envelopes]') && !document.querySelector('#vipSelos')`, 'Texto e envelopes substituem cupons no VIP');
  await ok(`document.querySelectorAll('#vip .en-perda').length===4 && document.querySelector('#vip [data-envelope="bronze"] small').textContent==='faltam 2 provas'`, 'Sem provas: quatro avisos e contagem correta');
  await ev(`document.querySelector('#garantir').click()`);
  await until(`location.hash==='#estacoes' && !document.querySelector('#vip.on') && k===1`, 'Voltar ao caso abre estações');
  await nav('#final'); await ev(`document.querySelector('[data-ver-vip]').click()`);
  await until(`location.hash==='#vip' && !!document.querySelector('#vip.on')`, 'Link da última prova abre VIP sem resolver');
  await ev(`localStorage.setItem('cb-ficha',JSON.stringify({id:'vip-teste',nome:'Teste',contato:'teste@example.com',carimbos:[1,2,2,6,99],resolvido:false}))`);
  await nav('#vip');
  await ok(`document.querySelector('#vip .ok').textContent==='CASO RESOLVIDO · O BÊ APARECEU' && document.querySelectorAll('#vip .envelopes-bloq').length===2 && !document.querySelector('#vip .en-perda')`, 'Carimbo 6 resolve VIP sem contar como prova de estação');
  await ev(`localStorage.setItem('cb-ficha',JSON.stringify({id:'vip-teste',nome:'Teste',contato:'teste@example.com',carimbos:[1,2],resolvido:false}));localStorage.setItem('cb-envelopes','["ouro"]')`);
  await nav('#vip');
  await ok(`document.querySelectorAll('#vip .en-perda').length===3 && document.querySelector('#vip [data-envelope="prata"] small').textContent==='faltam 2 provas' && document.querySelector('#vip [data-envelope="ouro"] small').textContent==='faltam 3 provas'`, 'VIP real respeita dois carimbos e bloqueios');
  await ev(`document.querySelector('#vip [data-envelope="bronze"]').click()`); await hold(seal('bronze'));
  await ok(opened('bronze'), 'Caso em aberto permite abrir Bronze conquistado');
  await ok(`document.querySelector(${JSON.stringify(seal('ouro'))}).disabled && !${opened('ouro')} && document.querySelectorAll('#envelopes .en-perda').length===3`, 'Abertura salva não contorna bloqueio e galeria mostra avisos');
  const realStorage = await ev(`JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])))`);
  for (const [width,height] of [[430,932],[430,740],[360,640],[932,430]]) {
    await cdp('Emulation.setDeviceMetricsOverride', {width,height,deviceScaleFactor:1,mobile:true});
    for (const [hash,fim] of [['#demo-vip-aberto',false],['#demo-vip-ok',true]]) {
      await nav(hash);
      await until(`!!document.querySelector('#vip.go')`, 'VIP demo aparece'); await sleep(650);
      await ok(`Envelopes.resolvido()===${fim} && document.querySelectorAll('#vip .en-perda').length===${fim?0:3}`, hash + ': avisos em ' + width + 'x' + height);
      await ok(`document.documentElement.scrollWidth<=innerWidth && [...document.querySelectorAll('#vip .envelopes-resumo button')].every(b=>b.scrollWidth<=b.clientWidth)`, hash + ': sem corte horizontal em ' + width + 'x' + height);
      await ev(`document.querySelector('#voltar').scrollIntoView({block:'end',behavior:'instant'})`);
      await ok(`(()=>{const r=document.querySelector('#voltar').getBoundingClientRect();if(r.top<0 || r.bottom>innerHeight+1)throw Error(JSON.stringify({top:r.top,bottom:r.bottom,height:innerHeight,scroll:document.querySelector('#vip .miolo').scrollTop}));return true})()`, hash + ': retorno alcançável em ' + width + 'x' + height);
      await ev(`document.querySelector('#vip .miolo').scrollTop=0`); await shot('vip-' + (fim?'ok':'aberto') + '-' + width + 'x' + height);
      await ev(`document.querySelector('#vip [data-envelope="bronze"]').click()`);
      await ok(`document.querySelectorAll('#envelopes .en-lacre:not(:disabled)').length===${fim?4:1}`, hash + ': bloqueios simulados independem da ficha real');
      await hold(seal('bronze')); await ok(opened('bronze'), hash + ': abre Bronze em memória');
      if (fim) { await hold(seal('niobio')); await ok(opened('niobio'), hash + ': abre Nióbio em memória') }
      await ev(`document.querySelector('#envelopes [data-id="bronze"] .en-garantir').click()`);
      await ok(`document.querySelector('#en-status-bronze').textContent.includes('nenhuma reserva')`, hash + ': reserva desativada');
      await ev(`Envelopes.fechar();if(Envelopes.resolvido())document.querySelector('#garantir').click()`);
      await ok(`JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])))===${JSON.stringify(realStorage)}`, hash + ': localStorage intacto em ' + width + 'x' + height);
    }
  }
  await cdp('Emulation.setDeviceMetricsOverride', {width:430,height:430,deviceScaleFactor:1,mobile:true});
  await nav('#vip');
  await ok(`!Envelopes.resolvido() && document.querySelector('#vip [data-envelope="bronze"] small').textContent==='carta aberta' && document.querySelector('#vip [data-envelope="niobio"]').classList.contains('envelopes-bloq')`, 'Sair das demos restaura ficha e aberturas reais');
  const vipTouch = await ev(`(()=>{const r=document.querySelector('#vip .miolo').getBoundingClientRect();return {x:r.x+r.width/2,y:r.height*.8}})()`);
  await cdp('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[{...vipTouch,radiusX:2,radiusY:2,force:1}]});
  for(let i=1;i<=6;i++){await cdp('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:vipTouch.x,y:vipTouch.y-i*25,radiusX:2,radiusY:2,force:1}]});await sleep(30)}
  await touchEnd(); await sleep(100);
  await ok(`document.querySelector('#vip .miolo').scrollTop>0 && k===3`, 'VIP rola por toque sem virar folhas');
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'PageDown',code:'PageDown',windowsVirtualKeyCode:34});
  await ok(`k===3`, 'PageDown no VIP não vira a pasta');
  await ev(`await Dados.carimbar(6,'teste-local')`);
  await ok(`document.querySelector('#vip .ok').textContent==='CASO RESOLVIDO · O BÊ APARECEU' && document.querySelector('#garantir').textContent==='Garantir meu acesso'`, 'VIP aberto atualiza ao resolver o caso');
  if (errors.length) throw Error('Erros JS: ' + errors.join('\n'));
  if (network.some(u => /supabase|\/api\//i.test(u))) throw Error('Chamada remota inesperada');
  console.log(checks.length + ' verificações OK; sem exceções JS ou backend. Capturas: ' + OUT);
}
main().catch(e => { console.error(e.stack); process.exitCode = 1 }).finally(async () => { ws?.close(); browser?.kill(); server?.close() });
