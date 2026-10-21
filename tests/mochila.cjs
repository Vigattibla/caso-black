/* node tests/mochila.cjs — detector real, toques CDP, mão sintética; artefatos só no TEMP. */
const fs=require('fs'),path=require('path'),os=require('os'),http=require('http'),assert=require('assert/strict'),{spawn}=require('child_process');
const ROOT=path.resolve(__dirname,'..'),OUT=fs.mkdtempSync(path.join(os.tmpdir(),'cb-mochila-'));
const CHROME=process.env.AR_CHROME||'C:/Users/Vigatti/AppData/Local/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-win64/chrome-headless-shell.exe';
const {pinca}=require('../mochila.js'),checks=[],errors=[],requests=[];let server,browser,ws,seq=0,base;
const pending=new Map(),sleep=ms=>new Promise(r=>setTimeout(r,ms));
function landmarks(x=.5,y=.5,d=.01){const l=Array.from({length:21},()=>({x,y,z:0}));l[0].y=y+.1;l[9].y=y-.1;l[5].x=x-.1;l[17].x=x+.1;l[4].x=x-d;l[8].x=x+d;return l}
function unit(){
  assert.equal(pinca(null),null);assert.equal(pinca([]),null);assert.equal(pinca(landmarks().map(p=>({...p,x:NaN}))),null);
  assert.equal(pinca(Array.from({length:21},()=>({x:0,y:0}))),null);
  assert.equal(pinca(landmarks()).fechada,true);assert.equal(pinca(landmarks(.5,.5,.1)).fechada,false);
  assert.equal(pinca(landmarks(.5,.5,.035),false).fechada,false);assert.equal(pinca(landmarks(.5,.5,.035),true).fechada,true);
  assert.equal(pinca(landmarks(.5,.5,.05),true).fechada,false);
  const a=pinca(landmarks(.5,.5,.02),false,780,1688),b=pinca(landmarks(.5,.5,.02).map(p=>({x:p.x*2,y:p.y*2})),false,780,1688);
  assert.equal(a.razao,b.razao);assert.equal(a.x,.5);assert.equal(a.y,.5);checks.push('Pinça: inválidos, abertura/fechamento, histerese, escala e proporção do vídeo');
  for(const f of ['index.html','caso.js','quadro.js','mochila.js'])assert(!fs.readFileSync(path.join(ROOT,f)).includes(8),'Backspace literal: '+f);
  checks.push('Nenhum backspace literal');
}
function cdp(method,params={}){return new Promise((resolve,reject)=>{const id=++seq,t=setTimeout(()=>{pending.delete(id);reject(Error('Timeout '+method))},20000);pending.set(id,{resolve:r=>{clearTimeout(t);resolve(r)},reject:e=>{clearTimeout(t);reject(e)}});ws.send(JSON.stringify({id,method,params}))})}
async function ev(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value}
async function ok(expr,label){if(!await ev(expr))throw Error(label);checks.push(label)}
async function until(expr,label,ms=12000){const start=Date.now();while(Date.now()-start<ms){if(await ev(expr))return;await sleep(90)}throw Error(label+' '+JSON.stringify(await ev(`({id:QuadroAR.id,mao:Mochila.naMao,bag:localStorage.getItem('cb-mochila'),carta:document.querySelector('#mochilaCarta')?.hidden,jobs:window.__jobs?.slice(-4)})`)))}
async function touchPoint(p){await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,radiusX:2,radiusY:2,force:1}]});await sleep(60);await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(100)}
async function touch(selector){const p=await ev(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});if(!b||b.closest('[hidden]'))throw Error('Alvo ausente '+${JSON.stringify(selector)});const r=b.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;if(!b.contains(document.elementFromPoint(x,y)))throw Error('Alvo coberto '+${JSON.stringify(selector)}+' '+document.elementFromPoint(x,y)?.outerHTML.slice(0,180));return {x,y}})()`);await touchPoint(p)}
async function shot(name){const r=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(r.data,'base64'))}
const fakeVision=`export const FilesetResolver={forVisionTasks:async p=>({path:p})};
export const HandLandmarker={createFromOptions:async(fs,opts)=>{window.__modelOptions=(window.__modelOptions||[]).concat(opts);if(opts.baseOptions.delegate==='GPU')throw Error('GPU de teste indisponível');return {detectForVideo(v,t){window.__jobs.push({kind:'mao',time:v.currentTime,t});if(window.__handThrow)throw Error('CPU indisponível');return {landmarks:window.__hand?[window.__hand]:[]}},close(){window.__closed=(window.__closed||0)+1}}}};`;
async function nav(suffix=''){
  const url=new URL(base+'/'+suffix);url.searchParams.set('mochila-carga',Date.now().toString());
  await cdp('Page.navigate',{url:url.href});await until(`location.search===${JSON.stringify(url.search)}&&document.readyState==='complete'&&typeof Mochila!=='undefined'&&typeof Placa!=='undefined'`,'Módulos');
  await ev(`window.__jobs=[];window.__passes=[];window.__call=0;const ler=Placa.lerTudo;Placa.lerTudo=(v,...args)=>{__call++;__jobs.push({kind:'aruco',time:v.currentTime,t:performance.now()});return ler(v,...args)};const det=AR.Detector.prototype.detect;AR.Detector.prototype.detect=function(...a){__passes.push(__call);return det.apply(this,a)};__fake.moving=false;window.__sintetica=${landmarks.toString()};`);
}
async function handAt(p,closed){await ev(`(()=>{const v=document.querySelector('#lupaV'),r=document.querySelector('#lupaC').getBoundingClientRect(),s=Math.max(r.width/v.videoWidth,r.height/v.videoHeight),ox=r.x+(r.width-v.videoWidth*s)/2,oy=r.y+(r.height-v.videoHeight*s)/2;window.__hand=__sintetica((${p.x}-ox)/s/v.videoWidth,(${p.y}-oy)/s/v.videoHeight,${closed?.005:.14})})()`);await sleep(180)}
async function framePoint(u=.4,v=.53){return ev(`QuadroAR.ponto(QuadroAR.homografia(QuadroAR.cantos),${u},${v})`)}
async function main(){
  unit();
  const mime={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.wasm':'application/wasm','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.mp4':'video/mp4','.json':'application/json'};
  server=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]),f=path.resolve(ROOT,'.'+(u==='/'?'/index.html':u));if(!f.startsWith(ROOT+path.sep)||path.basename(f)==='debug.log'){r.writeHead(403);r.end();return}fs.readFile(f,(e,b)=>{r.writeHead(e?404:200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'});r.end(e?'':b)})});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
  browser=spawn(CHROME,['--headless','--no-sandbox','--mute-audio','--autoplay-policy=user-gesture-required','--remote-debugging-port=0','--user-data-dir='+path.join(OUT,'profile'),'about:blank'],{cwd:OUT,windowsHide:true,stdio:['ignore','ignore','pipe']});
  const endpoint=await new Promise((resolve,reject)=>{let log='';const t=setTimeout(()=>reject(Error('Sem CDP')),15000);browser.stderr.on('data',b=>{log+=b;const m=log.match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(t);resolve(m[1])}})});
  const tabs=await(await fetch(endpoint.replace('ws:','http:').replace(/\/devtools.*/,'/json'))).json();ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(p)m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}
    else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
    else if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);
    else if(m.method==='Fetch.requestPaused'){const module=m.params.request.url.includes('vision_bundle.mjs');cdp('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:module?'application/javascript':'text/css'}],body:Buffer.from(module?fakeVision:"@font-face{font-family:Anton;src:local('Oswald')}@font-face{font-family:Caveat;src:local('Caveat')}@font-face{font-family:'Courier Prime';src:local('Courier New')}").toString('base64')}).catch(e=>errors.push(e.message))}};
  await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Network.enable');await cdp('Fetch.enable',{patterns:[{urlPattern:'https://fonts.googleapis.com/*'},{urlPattern:'*/vendor/mediapipe/vision_bundle.mjs'}]});
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await cdp('Page.addScriptToEvaluateOnNewDocument',{source:fs.readFileSync(path.join(__dirname,'ar-camera-fixture.js'),'utf8')+`
    localStorage.setItem('outra-origem','preservado');
    if(location.hash==='#demo-mochila'){localStorage.setItem('cb-mochila','["item-real"]');localStorage.setItem('cb-mochila-mao','item-real');}
    window.__writes=[];const set=Storage.prototype.setItem,rem=Storage.prototype.removeItem;Storage.prototype.setItem=function(k,v){__writes.push(k);return set.call(this,k,v)};Storage.prototype.removeItem=function(k){__writes.push(k);return rem.call(this,k)};
  `});
  await nav('?mochila-test');await touch('#abrir');await sleep(950);await touch('#lupaBtn');await until(`QuadroAR.id===300&&QuadroAR.cantos`,'Quadro 300');await sleep(500);
  assert(!requests.some(u=>u.includes('mediapipe')),'Modelo carregou sem item');checks.push('MediaPipe só é solicitado após haver item');
  await ok(`document.querySelector('#mochilaDev').style.display==='none'`,'Botão de dev oculto em produção');
  for(const p of ['estrela','chinelo','crocs']){await touch('[data-p="'+p+'"]');await touch('[data-c="'+p+'"]')}
  await until(`!document.querySelector('#mochilaQueda').hidden`,'Lente após estação 1');await sleep(950);await shot('01-lente-caindo');
  await ok(`localStorage.getItem('cb-mochila-pendente')==='lente'`,'Prêmio pendente persiste antes da coleta');
  await ok(`document.querySelector('#mochilaQueda').style.transform.startsWith('matrix3d(')`,'Lente usa perspectiva do quadro');
  await ev(`fecharLupa();achadas.push(0);salvar()`);await touch('#lupaBtn');await until(`QuadroAR.id===300&&!document.querySelector('#mochilaQueda').hidden`,'Prêmio na estação já concluída');await sleep(950);checks.push('Reabrir estação concluída recupera a lente pendente');
  await touch('#mochilaItem');await ok(`localStorage.getItem('cb-mochila')==='["lente"]'&&!Mochila.naMao`,'Coleta por toque persiste cb-mochila');
  await until(`window.__modelOptions?.length>=2`,'GPU e fallback CPU');await ok(`__modelOptions[0].baseOptions.delegate==='GPU'&&__modelOptions[1].baseOptions.delegate==='CPU'&&__modelOptions.every(o=>o.numHands===1&&o.runningMode==='VIDEO')`,'Modelo: VIDEO, uma mão, GPU com fallback CPU');
  await ev(`fecharLupa();__fake.id=311;__fake.cx=65;__fake.cy=250`);await touch('#lupaBtn');await until(`!document.querySelector('#mochilaCarta').hidden`,'Slots no marcador 311');await shot('02-carta');
  await ok(`document.querySelectorAll('#mochilaSlots button').length===3&&!!document.querySelector('[data-item="lente"]')&&document.querySelector('#mochilaCarta').style.transform.startsWith('matrix3d(')`,'311 projeta três slots com a lente');
  await touch('[data-item="lente"]');await ok(`Mochila.naMao==='lente'&&localStorage.getItem('cb-mochila')==='[]'&&localStorage.getItem('cb-mochila-mao')==='lente'`,'Tirar por toque seleciona e mantém recuperação');
  await ev(`__fake.id=303;__fake.cx=195;__fake.cy=104`);await until(`QuadroAR.id===303&&QuadroAR.cantos`,'Lojinha');await sleep(600);await touchPoint(await framePoint());
  await until(`!document.querySelector('#mochilaRevelacao').hidden`,'Tinta revelada');await ok(`document.querySelector('#mochilaRevelacao').style.clipPath.startsWith('circle(33px')&&document.querySelector('#beTx').textContent.includes('Pegadas do Pipoca')`,'Revelação circular e fala');await shot('03-tinta');
  await until(`!document.querySelector('.q-opcoes').hidden`,'Tarefa 4');await touch('[data-opcao="0"]');await until(`!document.querySelector('.q-fim').hidden`,'Progressão estação 4');checks.push('Lente não bloqueia a tarefa da Lojinha');
  await ev(`fecharLupa();__fake.id=311;__fake.cx=65;__fake.cy=250`);await ok(`localStorage.getItem('cb-mochila')==='["lente"]'&&localStorage.getItem('cb-mochila-mao')===null&&__closed>=1`,'Fechar devolve o item e libera o modelo');
  await touch('#lupaBtn');await until(`!document.querySelector('#mochilaCarta').hidden`,'Carta para pinça');
  const slot=await ev(`(()=>{const r=document.querySelector('[data-item="lente"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await handAt(slot,false);await until(`!document.querySelector('#mochilaCursor').hidden`,'Cursor da mão');await handAt(slot,true);await until(`Mochila.naMao==='lente'`,'Pinça retira lente');
  await ok(`localStorage.getItem('cb-mochila')==='[]'`,'Pinça retira do inventário');
  await ev(`achadas.push(3);__fake.id=303;__fake.cx=195;__fake.cy=104`);await until(`QuadroAR.id===303&&QuadroAR.cantos`,'303 já concluída com mão');await sleep(450);const paw=await framePoint();await handAt(paw,true);await until(`!document.querySelector('#mochilaRevelacao').hidden`,'Mão revela');await shot('04-pinca');checks.push('Lente funciona também na estação 4 já concluída');
  await ok(`Math.abs(parseFloat(document.querySelector('#mochilaFlutuante').style.left)-${paw.x})<2`,'Lente acompanha o cursor');
  await handAt(paw,false);await until(`!Mochila.naMao&&!document.querySelector('#mochilaQueda').hidden`,'Soltar sobre quadro');checks.push('Soltar larga o item no plano da placa');
  await handAt(paw,true);await until(`Mochila.naMao==='lente'`,'Recapturar item solto');await ev(`__hand=null`);await sleep(700);
  await ok(`!Mochila.naMao&&document.querySelector('#mochilaCursor').hidden`,'Perda da mão solta sem cursor preso');
  const jobs=await ev(`__jobs`),hands=jobs.filter(j=>j.kind==='mao');assert(hands.length>3);for(let i=1;i<hands.length;i++)assert(hands[i].t-hands[i-1].t>=1000/15-.1,'Mão excedeu 15fps');
  for(const h of hands)assert(!jobs.some(j=>j.kind==='aruco'&&j.time===h.time),'ArUco e mão no mesmo frame');checks.push('Mão <=15 fps e em frames distintos do ArUco');
  await ok(`new Set(__passes).size===__passes.length`,'No máximo uma detecção ArUco por chamada');
  await ev(`__handThrow=true`);await until(`document.querySelector('#toast').textContent.includes('Mão indisponível')`,'Fallback após falha CPU');await touch('#mochilaItem');await ok(`Mochila.naMao==='lente'`,'Toque funciona depois da falha do rastreador');
  await ev(`fecharLupa()`);await ok(`localStorage.getItem('cb-mochila')==='["lente"]'&&localStorage.getItem('outra-origem')==='preservado'`,'Item recuperável e armazenamento alheio preservado');
  await nav('?dev#demo-mochila');await until(`!document.querySelector('#mochilaQueda')?.hidden`,'Demo sem câmera');await sleep(950);await touch('#mochilaItem');await touch('[data-etapa="311"]');await until(`!document.querySelector('#mochilaCarta').hidden`,'Demo 311');await touch('[data-item="lente"]');await touch('[data-etapa="303"]');await until(`QuadroAR.id===303&&QuadroAR.cantos`,'Demo 303');await sleep(500);await touchPoint(await framePoint());await until(`!document.querySelector('#mochilaRevelacao').hidden`,'Demo revela');await shot('05-demo');
  await ok(`__fake.frames===0&&__writes.length===0&&localStorage.getItem('cb-mochila')==='["item-real"]'&&localStorage.getItem('cb-mochila-mao')==='item-real'`,'Demo usa vídeo próprio e não altera nenhum estado real');
  await ok(`document.querySelector('#mochilaDev').style.display==='block'`,'Dar lente visível somente com dev');
  // O SVG entregue deve ser exatamente o emitido pelo dicionário do site.
  assert.equal(fs.readFileSync(path.join(ROOT,'assets/marcadores/aruco-311.svg'),'utf8').trim(),await ev(`Placa.svg(311)`));checks.push('SVG 311 corresponde ao dicionário ArUco');
  await nav('#demo-mochila');await ok(`location.hash===''&&!document.querySelector('#lupa.on')`,'Rota de demo indisponível sem dev');
  await nav('#lupa');await until(`QuadroAR.id===300&&QuadroAR.cantos`,'Entrada direta na lupa');await ev(`fecharLupa()`);checks.push('Entrada #lupa aguarda os módulos e abre a câmera');
  if(process.argv.includes('--modelo-real')){
    await cdp('Fetch.enable',{patterns:[{urlPattern:'https://fonts.googleapis.com/*'}]});
    await ok(`(async()=>{const {FilesetResolver,HandLandmarker}=await import('./vendor/mediapipe/vision_bundle.mjs?smoke-real');const fs=await FilesetResolver.forVisionTasks('./vendor/mediapipe/wasm');const model=await HandLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:'./vendor/mediapipe/hand_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numHands:1});try{const c=document.createElement('canvas');c.width=320;c.height=240;c.getContext('2d').fillRect(0,0,320,240);return model.detectForVideo(c,performance.now()).landmarks.length===0}finally{model.close()}})()`,'Modelo real local: WASM + task + inferência CPU');
  }
  assert.deepEqual(errors,[],'Erros no navegador');console.log(checks.length+' OK · mochila, ArUco real, toque, pinça sintética, GPU/CPU, demo isolada');console.log('Capturas: '+OUT);
}
main().catch(async e=>{console.error(e.stack?.split('\n').slice(0,7).join('\n'));try{if(ws)await shot('falha')}catch(_){}process.exitCode=1}).finally(()=>{fs.writeFileSync(path.join(OUT,'relatorio.json'),JSON.stringify({checks,errors,requests},null,2));ws?.close();browser?.kill();server?.close()});
