/* node tests/chave.cjs — verso coleta a ferramenta; somente a placa usa a chave guardada. */
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(os.tmpdir(),'cb-chave-shots','verso-v2');
const CHROME=process.env.AR_CHROME||'C:/Users/Vigatti/AppData/Local/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-win64/chrome-headless-shell.exe';
let browser,server,ws,id=0;const pending=new Map(),errors=[],faltando=[],checks=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function cdp(method,params={}){return new Promise((resolve,reject)=>{const n=++id,t=setTimeout(()=>{pending.delete(n);reject(Error('Timeout '+method))},20000);pending.set(n,{resolve:r=>{clearTimeout(t);resolve(r)},reject:e=>{clearTimeout(t);reject(e)}});ws.send(JSON.stringify({id:n,method,params}))})}
async function ev(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value}
async function ok(expr,label){if(!await ev(expr))throw Error(label);checks.push(label)}
async function until(expr,label,timeout=20000){const t=Date.now();while(Date.now()-t<timeout){if(await ev(expr).catch(()=>false))return checks.push(label);await sleep(150)}throw Error(label+' '+JSON.stringify(await ev('window.__chave&&{e:__chave.estado,l:__chave.leituras,u:__chave.ultima}')))}
async function shot(name){await sleep(320);const r=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(r.data,'base64'))}
async function main(){
  fs.mkdirSync(OUT,{recursive:true});
  const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.wasm':'application/wasm'};
  server=http.createServer((q,r)=>{let url=decodeURIComponent(q.url.split('?')[0]);if(url.endsWith('/'))url+='index.html';const file=path.resolve(ROOT,'.'+url);if(!file.startsWith(ROOT+path.sep)||path.basename(file)==='debug.log'){r.writeHead(403);return r.end()}fs.readFile(file,(e,b)=>{if(e)faltando.push(url);r.writeHead(e?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});r.end(e?'Not found':b)})});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=spawn(CHROME,['--headless','--no-sandbox','--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'chrome-chave-profile'),'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  const endpoint=await new Promise((resolve,reject)=>{let s='';const t=setTimeout(()=>reject(Error('Sem CDP')),15000);browser.stderr.on('data',b=>{s+=b;const m=s.match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(t);resolve(m[1])}})});
  const targets=await(await fetch(endpoint.replace('ws:','http:').replace(/\/devtools.*/,'/json'))).json();ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(p)m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);else if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(x=>x.value||x.description).join(' '))};
  await cdp('Page.enable');await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  if(process.env.AR_UA)await cdp('Emulation.setUserAgentOverride',{userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36'});
  const base=`http://127.0.0.1:${server.address().port}`;
  // AR: motor carrega e aceita o alvo do verso.
  await cdp('Page.navigate',{url:base+'/ar8w/chave.html?nova'});
  await until(`window.__chave?.xr===true`,'motor 8th Wall carregou');
  await until(`window.__chave.configurado===true||!!window.__chave.configErro`,'configure respondeu');
  await ok(`!__chave.configErro&&__chave.alvos.join(',')==='verso,placa-1'&&document.querySelector('#abrir').textContent==='Abrir lupa'`,'dois alvos aceitos: verso e placa-1');
  await shot('chave-inicio');

  // O verso só lê e guarda: nenhuma fechadura ou pista nesta cena.
  await cdp('Page.navigate',{url:base+'/ar8w/chave.html?demo&nova'});
  await until(`__chave.estado==='guardado'&&__chave.leituras[0]==='CBBC'`,'verso leu CBBC e concluiu a coleta');
  await ok(`__chave.alvo==='verso'&&!__chave.tentativas&&JSON.parse(localStorage.getItem('cb-chave')).codigo==='CBBC'&&!document.querySelector('#mochila').hidden&&/CHAVE GUARDADA/.test(document.querySelector('#beTx').textContent)`,'inventário recebe a chave sem abrir cadeado no verso');
  await shot('verso-chave-guardada');
  for(const t of [0,.5,1,1.5,2]){await ev(`document.querySelector('#balao').classList.remove('on');__chave.seek(${t})`);await sleep(60);await shot('verso-coleta-'+String(t).replace('.','_'))}
  // Navegar simula fechar/reabrir a lupa: a ferramenta persiste no aparelho.
  await cdp('Page.navigate',{url:base+'/ar8w/chave.html?demo&alvo=placa-1'});
  await until(`__chave.estado==='aberto'`,'placa abriu com a chave persistida',12000);
  await ok(`__chave.alvo==='placa-1'&&__chave.leituras.length===0&&__chave.tentativas===1&&JSON.parse(localStorage.getItem('cb-chave')).codigo==='CBBC'&&/BOA/.test(document.querySelector('#beTx').textContent)`,'estação usa o inventário, revela pista e Lucas comemora');
  await shot('placa-certo-fim');
  for(const t of [0,.5,1.5,2.6,3.5,4.2,4.9,5.5]){await ev(`document.querySelector('#balao').classList.remove('on');__chave.seek(${t})`);await sleep(60);await shot('placa-certo-'+String(t).replace('.','_'))}

  await cdp('Page.navigate',{url:base+'/ar8w/chave.html?demo&nova&alvo=placa-1'});
  await until(`__chave.estado==='aguardando-chave'&&!__chave.tentativas&&!localStorage.getItem('cb-chave')`,'placa sem ferramenta aguarda a leitura do verso');
  await shot('placa-sem-chave');
  await cdp('Page.navigate',{url:base+'/ar8w/chave.html?demo&nova&sem-desenho'});
  await sleep(2500);
  if(!await ev(`__chave.estado==='lendo'&&__chave.leituras.length===0&&__chave.ultima.codigo==='????'&&!localStorage.getItem('cb-chave')`))throw Error('Guias/pontilhado confundidos com ferramenta');
  await shot('verso-sem-desenho');
  // Uma ferramenta errada também é coletada; só a placa avalia os dentes.
  await cdp('Page.navigate',{url:base+'/ar8w/chave.html?demo&nova&codigo=CCBC'});
  await until(`__chave.estado==='guardado'&&__chave.leituras[0]==='CCBC'&&JSON.parse(localStorage.getItem('cb-chave')).codigo==='CCBC'&&!__chave.tentativas`,'verso guarda CCBC sem avaliar a solução');
  await shot('verso-chave-errada-guardada');
  await ev(`__chave.alvoDemo('placa-1')`);
  // Aguarda iniciar sem acrescentar um checkpoint à contagem de 10 grupos.
  for(let n=0;n<60&&!await ev(`__chave.estado==='animando'`);n++)await sleep(50);
  await ev(`__chave.seek(3.7)`);await sleep(100);await shot('placa-errado-emperra');await ev(`__chave.pausado=false`);
  await until(`__chave.estado==='emperrado'&&/3 de 4/.test(document.querySelector('#beTx').textContent)&&JSON.parse(localStorage.getItem('cb-chave')).codigo==='CCBC'`,'placa rejeita CCBC: 3 de 4, ferramenta permanece no inventário',12000);
  await sleep(2500);
  if(!await ev(`__chave.tentativas===1&&__chave.leituras.length===1`))throw Error('tentativa errada repetiu');
  await shot('placa-errado-fim');

  if(faltando.length)throw Error('404: '+[...new Set(faltando)].join(', '));
  if(errors.length)throw Error('Console: '+errors.slice(0,5).join(' | '));
  console.log(checks.map(c=>'OK '+c).join('\n'));console.log(`${checks.length} OK · prints em ${OUT}`);
}
main().catch(e=>{console.error('FALHOU:',e.message);if(errors.length)console.error('Console:',errors.slice(0,5).join(' | '));if(faltando.length)console.error('404:',[...new Set(faltando)].join(', '));process.exitCode=1}).finally(()=>{try{ws?.close()}catch{}browser?.kill();server?.close()});
