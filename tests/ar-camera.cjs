/* node tests/ar-camera.cjs — real detector, silent Chromium, real CDP touches. */
const fs=require('fs'),path=require('path'),http=require('http'),os=require('os'),{spawn}=require('child_process');
const ROOT=path.resolve(__dirname,'..'),BASE=os.tmpdir(),OUT=path.join(BASE,'cb-foto-shots');
const CHROME=process.env.AR_CHROME||'C:/Users/Vigatti/AppData/Local/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-win64/chrome-headless-shell.exe';
let browser,server,ws,id=0,pending=new Map(),failure=null;const errors=[],shots=[],checks=[],metrics=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function cdp(method,params={}){return new Promise((resolve,reject)=>{const n=++id,t=setTimeout(()=>{pending.delete(n);reject(Error('Timeout '+method))},20000);pending.set(n,{resolve:r=>{clearTimeout(t);resolve(r)},reject:e=>{clearTimeout(t);reject(e)}});ws.send(JSON.stringify({id:n,method,params}))})}
async function ev(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value}
async function ok(expr,label){if(!await ev(expr))throw Error(label);checks.push(label)}
async function until(expr,label,timeout=12000){const t=Date.now();while(Date.now()-t<timeout){if(await ev(expr))return;await sleep(100)}throw Error(label+' '+JSON.stringify(await ev(`({ready:document.querySelector('#lupaV').readyState,semcam:document.querySelector('#lupa').className,id:QuadroAR.id,frames:__fake.frames,stats:window.__det})`)))}
async function shot(name){const file='ar-'+name+'.png',r=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip:{x:0,y:0,width:390,height:844,scale:1/(await ev('devicePixelRatio'))}});fs.writeFileSync(path.join(OUT,file),Buffer.from(r.data,'base64'));shots.push(file)}
async function touch(selector,hold=60){const p=await ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.closest('[hidden]'))throw Error('Alvo ausente: '+${JSON.stringify(selector)});const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;const hit=document.elementFromPoint(x,y);if(!hit||!e.contains(hit))throw Error('Hit-test falhou '+${JSON.stringify(selector)}+' '+JSON.stringify({hit:hit?.outerHTML.slice(0,200),rect:r.toJSON(),style:getComputedStyle(e).cssText,visibility:getComputedStyle(e).visibility,ancestors:[e.parentElement,e.parentElement.parentElement,document.querySelector('#quadro')].map(x=>({class:x.className,style:x.style.cssText,v:getComputedStyle(x).visibility})),foto:QuadroAR.foto,lendo:QuadroAR.lendo,body:document.body.className,own:e.outerHTML,matrix:document.querySelector('#quadro').style.transform}));return {x,y}})()`);
  await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,radiusX:2,radiusY:2,force:1}]});await sleep(hold);await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(100)}
async function nav(){await cdp('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/?ar-test=${Date.now()}`});await until(`typeof Quadro!=='undefined'&&typeof Placa!=='undefined'`,'Scripts');await ev(`document.fonts.ready`);await ev(`window.__det={n:0,ms:0,misses:0};const original=Placa.lerTudo;Placa.lerTudo=(...a)=>{const t=performance.now(),r=original(...a);__det.n++;__det.ms+=performance.now()-t;if(!r.some(m=>m.id===__fake.id))__det.misses++;return r};const consumir=Placa.consumir;Placa.consumir=()=>{const r=consumir();if(r){__det.n++;__det.ms+=performance.now()-r.t;if(!r.marcas.some(m=>m.id===__fake.id))__det.misses++}return r}`);await touch('#abrir');await sleep(900)}
async function main(){
  fs.mkdirSync(OUT,{recursive:true});const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.mp3':'audio/mpeg','.woff2':'font/woff2','.json':'application/json'};
  // Offline CDN fixture: installed Montserrat/Caveat, Oswald for Anton, Courier New for Courier Prime.
  const fonts={heading:'C:/Users/Vigatti/AppData/Local/Microsoft/Windows/Fonts/Oswald-VariableFont_wght.ttf',hand:'C:/Users/Vigatti/AppData/Local/Microsoft/Windows/Fonts/Caveat-VariableFont_wght.ttf',mono:'C:/Windows/Fonts/courbd.ttf'};
  server=http.createServer((q,r)=>{const url=decodeURIComponent(q.url.split('?')[0]),base=path.resolve(url.startsWith('/shots/')?BASE:ROOT),font=fonts[url.replace('/ar-test-fonts/','')],file=font||path.resolve(base,'.'+(url==='/'?'/index.html':url));if(!font&&(!file.startsWith(base+path.sep)||path.basename(file)==='debug.log')){r.writeHead(403);r.end();return}fs.readFile(file,(e,b)=>{r.writeHead(e?404:200,{'Content-Type':font?'font/ttf':mime[path.extname(file)]||'application/octet-stream'});r.end(e?'Not found':b)})});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=spawn(CHROME,['--headless','--no-sandbox','--mute-audio','--autoplay-policy=user-gesture-required','--remote-debugging-port=0','--user-data-dir='+path.join(BASE,'chrome-ar-profile'),'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  const endpoint=await new Promise((resolve,reject)=>{let s='';const t=setTimeout(()=>reject(Error('Sem CDP')),15000);browser.stderr.on('data',b=>{s+=b;const m=s.match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(t);resolve(m[1])}})});
  const targets=await(await fetch(endpoint.replace('ws:','http:').replace(/\/devtools.*/,'/json'))).json();ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(p)m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}else if(m.method==='Fetch.requestPaused'){const host=`http://127.0.0.1:${server.address().port}`,css=`@font-face{font-family:Anton;src:url(${host}/ar-test-fonts/heading)}@font-face{font-family:Caveat;src:url(${host}/ar-test-fonts/hand);font-weight:400 800}@font-face{font-family:'Courier Prime';src:url(${host}/ar-test-fonts/mono)}`;cdp('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/css'},{name:'Access-Control-Allow-Origin',value:'*'}],body:Buffer.from(css).toString('base64')}).catch(e=>errors.push(e.message))}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);else if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args.map(x=>x.value||x.description).join(' '));else if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')errors.push(m.params.entry.text)};
  await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Log.enable');await cdp('Fetch.enable',{patterns:[{urlPattern:'https://fonts.googleapis.com/*'}]});await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await cdp('Page.addScriptToEvaluateOnNewDocument',{source:fs.readFileSync(path.join(__dirname,'ar-camera-fixture.js'),'utf8')});

  for(let n=1;n<=5;n++){
    await nav();await ev(`__fake.id=${299+n};__fake.moving=false;__fake.jitter=true`);await touch('#lupaBtn');
    await sleep(1800);await ok(`!QuadroAR.foto&&!QuadroAR.ativo`,'Jitter não congela '+n);await shot(n+'-leitura');
    await ev(`__fake.jitter=false;window.__inicio=performance.now()`);await until(`QuadroAR.foto&&QuadroAR.id===${299+n}`,'Foto '+n);
    const ms=await ev(`performance.now()-__inicio`);metrics.push({station:n,freezeMs:ms});if(ms>=1500)throw Error('Congelamento lento '+ms);
    await sleep(240);await shot(n+'-foto');
    await ok(`document.querySelector('#lupaFoto').width===document.querySelector('#lupaV').videoWidth&&document.querySelector('#lupaFoto').height===document.querySelector('#lupaV').videoHeight`,'Foto resolução nativa '+n);
    await ok(`!Placa.workerAtivo&&!Placa.ocupado&&document.querySelector('#lupaV').paused`,'Detector e reprodução pausados '+n);
    const pose=await ev(`document.querySelector('#quadro').style.transform`),image=await ev(`document.querySelector('#lupaFoto').toDataURL()`);
    await ev(`__fake.pose=3;__fake.hidden=true`);await sleep(650);
    await ok(`document.querySelector('#quadro').style.transform===${JSON.stringify(pose)}&&document.querySelector('#lupaFoto').toDataURL()===${JSON.stringify(image)}&&document.querySelector('#quadro').style.opacity==='1'&&!document.querySelector('.qar-tela')`,'Mover/remover não altera foto/quadro '+n);
    await touch('.q-dica');await ok(`document.querySelector('#balao').classList.contains('q-ajuda')`,'Dica '+n);
    if(n===1){for(const p of ['estrela','chinelo','crocs']){await touch('[data-p="'+p+'"]');await touch('[data-c="'+p+'"]')}}
    if(n===2){await touch('[data-tira="0"]');await ev(`__fake.pose=0;__fake.hidden=false`);await touch('#lupaReler');await ok(`!QuadroAR.foto&&!document.querySelector('#lupaV').paused`,'Ler de novo volta ao vivo');await until(`QuadroAR.foto`,'Reler');await ok(`document.querySelector('[data-tira="0"]').classList.contains('q-ok')`,'Reler mantém tarefa parcial');for(let i=1;i<4;i++)await touch('[data-tira="'+i+'"]')}
    if(n===3){await ok(`(()=>{const a=[...document.querySelectorAll('[data-dif]')];return a.every((p,i)=>a.slice(i+1).every(q=>{const x=p.getBoundingClientRect(),y=q.getBoundingClientRect();return x.right<=y.left||y.right<=x.left||x.bottom<=y.top||y.bottom<=x.top}))})()`,'Diferenças: áreas de toque sem sobreposição');for(const p of ['escorregador','castelo','camiseta','cadeira','chapeu']){await touch('[data-dif="'+p+'"]');await ok(`document.querySelector('[data-dif="${p}"]').classList.contains('q-ok')`,'Diferença marcada '+p)}}
    if(n===4){await until(`!document.querySelector('.q-opcoes').hidden`,'Memorizar');await touch('[data-opcao="0"]')}
    if(n===5)for(let i=0;i<5;i++)await touch('[data-tempo="'+i+'"]');
    await until(`!document.querySelector('.q-fim').hidden`,'Carimbo '+n);await shot(n+'-carimbo');
    if(n===1)await ok(`!QuadroAR.foto&&Mochila.premioPendente`,'Prêmio da estação 1 retoma câmera ao vivo');
    else{
      await ev(`fecharLupa();__fake.hidden=true`);await touch('#lupaBtn');await until(`QuadroAR.foto`,'Cache '+n);
      await ok(`!document.querySelector('.q-fim').hidden&&!Placa.workerAtivo`,'Reabrir foto em memória mantém feito/carimbo '+n);
      await ev(`__fake.hidden=false;__fake.pose=0`);await touch('#lupaReler');await until(`QuadroAR.foto`,'Reler concluída '+n);
      await ok(`!document.querySelector('.q-fim').hidden`,'Reler mesma placa mantém conclusão '+n);
    }
    await touch('#quadroHUD .q-segue');await until(`!!document.querySelector('#prova.on')`,'Foto da equipe '+n);await ok(`!document.querySelector('#lupa.on')&&!fluxo`,'Fechar encerra stream '+n);
    console.log('Estação '+n+': leitura estável, foto, toques, carimbo OK ('+ms.toFixed(0)+'ms)');
  }
  await nav();await ev(`__fake.moving=false;__fake.alternando=true`);await touch('#lupaBtn');await sleep(2200);await ok(`!QuadroAR.foto`,'IDs alternando não congelam');
  await ev(`__fake.alternando=false`);await until(`QuadroAR.foto`,'Após alternância');
  const measured=await ev(`new Promise(resolve=>{let frames=0;const start=performance.now(),reads=__det.n,pose=JSON.stringify(QuadroAR.cantos);function frame(t){frames++;if(t-start<2000)return requestAnimationFrame(frame);resolve({fps:frames*1000/(t-start),detections:__det.n-reads,jitter:JSON.stringify(QuadroAR.cantos)===pose?0:null})}requestAnimationFrame(frame)})`);metrics.push(measured);if(measured.detections!==0||measured.jitter!==0)throw Error('Foto ainda detecta/treme');
  for(const dpr of [1,3]){await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:dpr,mobile:true});await nav();await ev(`__fake.wide=true;__fake.moving=false`);await touch('#lupaBtn');await until(`QuadroAR.foto`,'Cover');await ok(`(()=>{const v=document.querySelector('#lupaV'),g=QuadroAR.geometria({id:300,corners:[[0,0],[1,0],[1,1],[0,1]].map(([u,v])=>__fake.project(u,v))},v),h=QuadroAR.homografia(g.placa),p=QuadroAR.ponto(h,.5,.5);return Math.hypot(p.x-195,p.y-104)<.01})()`,'Cover e DPR '+dpr);await shot('cover-dpr-'+dpr)}
  await ok(`!QuadroAR.convexa([{x:0,y:0},{x:100,y:100},{x:0,y:100},{x:100,y:0}])&&!QuadroAR.convexa([{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}])`,'Poses não convexas/mínimas rejeitadas');
  await ev(`fecharLupa();investigar(1,'codigo')`);await ok(`!!document.querySelector('#quadro.on:not(.ar)')&&!QuadroAR.ativo`,'Código abre tela cheia');
  await nav();await ev(`HTMLVideoElement.prototype.requestVideoFrameCallback=undefined;__fake.moving=false`);await touch('#lupaBtn');await until(`QuadroAR.foto`,'Fallback rAF');await ev(`fecharLupa()`);
  await sleep(100);if(errors.length)throw Error('Console: '+JSON.stringify([...new Set(errors)]));
  console.log(JSON.stringify({metrics,checks:checks.length,consoleErrors:errors.length,screenshots:shots.length}));
}

main().catch(async e=>{failure=e.message;console.error(e.stack?.split('\n').slice(0,6).join('\n'));try{if(ws)await shot('falha')}catch(_){}process.exitCode=1}).finally(()=>{
  fs.writeFileSync(path.join(OUT,'ar-relatorio.json'),JSON.stringify({status:failure?'falhou':'aprovado',failure,checks,metrics,errors,screenshots:shots,offlineFonts:'Oswald substitui Anton e Courier New substitui Courier Prime apenas no teste (CDN sem acesso de rede).'},null,2));
  ws?.close();browser?.kill();server?.close();
});
