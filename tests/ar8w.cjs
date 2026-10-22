/* node tests/ar8w.cjs — protótipo 8th Wall: carrega motor, aceita o alvo, âncora suaviza, quadro jogável. */
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(os.tmpdir(),'cb-8w-shots');
const CHROME=process.env.AR_CHROME||'C:/Users/Vigatti/AppData/Local/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-win64/chrome-headless-shell.exe';
let browser,server,ws,id=0;const pending=new Map(),errors=[],faltando=[],checks=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function cdp(method,params={}){return new Promise((resolve,reject)=>{const n=++id,t=setTimeout(()=>{pending.delete(n);reject(Error('Timeout '+method))},20000);pending.set(n,{resolve:r=>{clearTimeout(t);resolve(r)},reject:e=>{clearTimeout(t);reject(e)}});ws.send(JSON.stringify({id:n,method,params}))})}
async function ev(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value}
async function ok(expr,label){if(!await ev(expr))throw Error(label);checks.push(label)}
async function until(expr,label,timeout=20000){const t=Date.now();while(Date.now()-t<timeout){if(await ev(expr))return checks.push(label);await sleep(150)}throw Error(label+' '+JSON.stringify(await ev('window.__ar8w&&{xr:__ar8w.xr,cfg:__ar8w.configurado,erro:__ar8w.configErro}')))}
async function shot(name){const r=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(r.data,'base64'))}
async function main(){
  fs.mkdirSync(OUT,{recursive:true});
  const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json','.wasm':'application/wasm'};
  server=http.createServer((q,r)=>{let url=decodeURIComponent(q.url.split('?')[0]);if(url.endsWith('/'))url+='index.html';const file=path.resolve(ROOT,'.'+url);if(!file.startsWith(ROOT+path.sep)||path.basename(file)==='debug.log'){r.writeHead(403);return r.end()}fs.readFile(file,(e,b)=>{if(e&&!/\/assets\/a\/v\/v3-\d+\.m4a$/.test(url)&&url!=='/favicon.ico')faltando.push(url);r.writeHead(e?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});r.end(e?'Not found':b)})});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=spawn(CHROME,['--headless','--no-sandbox','--mute-audio','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--remote-debugging-port=0','--user-data-dir='+path.join(os.tmpdir(),'chrome-8w-profile'),'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  const endpoint=await new Promise((resolve,reject)=>{let s='';const t=setTimeout(()=>reject(Error('Sem CDP')),15000);browser.stderr.on('data',b=>{s+=b;const m=s.match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(t);resolve(m[1])}})});
  const targets=await(await fetch(endpoint.replace('ws:','http:').replace(/\/devtools.*/,'/json'))).json();ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(p)m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);else if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(x=>x.value||x.description).join(' '))};
  await cdp('Page.enable');await cdp('Runtime.enable');
  if(process.env.AR_UA)await cdp('Emulation.setUserAgentOverride',{userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36'});
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  const base=`http://127.0.0.1:${server.address().port}`;
  await cdp('Page.navigate',{url:base+'/ar8w/?reset=1'});
  await until(`window.__ar8w?.xr===true`,'motor 8th Wall carregou (xrloaded)');
  await until(`window.__ar8w.configurado===true||!!window.__ar8w.configErro`,'configure respondeu');
  await ok(`!window.__ar8w.configErro&&__ar8w.alvos.length===6`,'configure aceitou os seis alvos');
  await ok(`!document.querySelector('#abrir').disabled&&document.querySelector('#abrir').textContent==='Abrir lupa'`,'botão Abrir lupa liberado');
  await ok(`/8th Wall/.test(document.querySelector('#credito').textContent)`,'crédito 8th Wall visível');
  await ok(`(()=>{document.body.appendChild(document.querySelector('#camera'));const z=e=>+getComputedStyle(document.querySelector(e)).zIndex||0;return z('#css3d')>z('#camera')})()`,'quadro fica acima do canvas mesmo com o canvas no fim do body');
  await shot('8w-inicio');

  // Âncora: suaviza, segura ao perder, não salta.
  await ok(`(()=>{const a=__ar8w.ancora,d={position:{x:0,y:1.5,z:-2},rotation:{x:0,y:0,z:0,w:1},scale:1};a.found(d);a.passo(1/60);
    a.updated({...d,position:{x:0.02,y:1.5,z:-2}});const p1=a.passo(1/60).p[0];if(!(p1>0&&p1<0.02))return false;
    for(let i=0;i<120;i++)a.passo(1/60);const fix=a.pose.p[0];a.lost();for(let i=0;i<120;i++)a.passo(1/60);
    return Math.abs(fix-0.02)<1e-3&&Math.abs(a.pose.p[0]-fix)<1e-9&&!a.visto&&a.achou===1})()`,'âncora suaviza e fica no lugar ao perder a placa');

  await ok(`(()=>{const a=__ar8w.ancora;const d=x=>({position:{x,y:1.5,z:-2},rotation:{x:0,y:0,z:0,w:1},scale:1});
    a.found(d(0.02));for(let i=0;i<60;i++){a.updated(d(0.02));a.passo(1/60)}if(!a.travado)return 'nao travou';const fix=a.pose.p[0];
    for(let i=0;i<60;i++){a.updated(d(0.02+(i%2?0.05:-0.05)));a.passo(1/60)}if(Math.abs(a.pose.p[0]-fix)>1e-9)return 'tremeu';
    for(let i=0;i<30;i++){a.updated(d(0.4));a.passo(1/60)}if(Math.abs(a.pose.p[0]-fix)>1e-9)return 'seguiu cedo';
    for(let i=0;i<120;i++){a.updated(d(0.4));a.passo(1/60)}return a.pose.p[0]>0.3||'nao seguiu placa mexida'})()===true`,'âncora trava: ignora leitura ruidosa e só segue placa mexida');

  // Quadro jogável (DOM sem câmera): só as três pegadas de estrela.
  await ev(`(()=>{__ar8w.simular({name:'placa-1',position:{x:0,y:1.5,z:-2},rotation:{x:0,y:0,z:0,w:1},scale:1,scaledWidth:1});const q=__ar8w.quadro;document.body.appendChild(q);q.style.cssText='position:fixed;left:0;top:0;transform:scale(.65);transform-origin:0 0;z-index:50;visibility:visible'})()`);
  const tocar=async s=>ev(`document.querySelector(${JSON.stringify(s)}).click()`);
  await tocar('[data-pegada="1"]');
  await ok(`document.querySelector('[data-pegada="1"]').classList.contains('e1-treme')`,'pegada errada treme');
  for(const i of [0,3,5])await tocar(`[data-pegada="${i}"]`);
  await sleep(900);
  await ok(`document.querySelectorAll('.e1-ok').length===3&&__ar8w.estado.valor.itens.lente&&__ar8w.estado.valor.dentes[1]==='C'&&!document.querySelector('.e1-fim').hidden`,'três pegadas entregam lente, prova e dente');
  await shot('8w-quadro-resolvido');

  // Navegador sem suporte (desktop headless) mostra mensagem, sem travar.
  await cdp('Page.navigate',{url:base+'/ar8w/?b'});await until(`window.__ar8w?.configurado===true`,'recarregou');
  await ev(`document.querySelector('#abrir').click()`);await sleep(2500);
  await ok(`!document.querySelector('#erro').hidden||document.querySelector('#inicio').hidden`,'Abrir lupa responde (erro amigável ou câmera)');
  await shot('8w-abrir');
  const viu=await ev(`({erro:!document.querySelector('#erro').hidden&&document.querySelector('#erro p').textContent,status:document.querySelector('#status').textContent})`);
  if(faltando.length)throw Error('404: '+[...new Set(faltando)].join(', '));
  if(errors.length)throw Error('Console: '+errors.slice(0,5).join(' | '));
  console.log(checks.map(c=>'OK '+c).join('\n'));console.log('Abrir lupa →',JSON.stringify(viu));console.log(`${checks.length} OK · prints em ${OUT}`);
}
main().catch(e=>{console.error('FALHOU:',e.message);if(errors.length)console.error('Console:',errors.slice(0,5).join(' | '));if(faltando.length)console.error('404:',[...new Set(faltando)].join(', '));process.exitCode=1}).finally(()=>{try{ws?.close()}catch{}browser?.kill();server?.close()});
