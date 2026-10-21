/* CDP, câmera sintética real, Chromium silencioso. AR_BENCH_OUT guarda JSON e traces fora do repo.
   node tests/ar-performance.cjs antes|depois [1280|1920]; AR_BENCH_MS=6000 por cenário.
   AR_VERIFY=1: placas de 62/31px, protocolo e fallback; AR_CAPTURE_PROBE=1: custo da captura.
   AR_HAND=1: rastreio com MediaPipe real e prêmio pendente. */
const fs=require('fs'),path=require('path'),os=require('os'),http=require('http'),assert=require('assert/strict'),{spawn}=require('child_process');
const ROOT=path.resolve(__dirname,'..'),OUT=process.env.AR_BENCH_OUT||path.join(os.tmpdir(),'cb-ar-performance');
const LABEL=process.argv[2]||'depois',WIDTH=+(process.argv[3]||1920),DURATION=+(process.env.AR_BENCH_MS||6000);
const CHROME=process.env.AR_CHROME||'C:/Users/Vigatti/AppData/Local/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-win64/chrome-headless-shell.exe';
let browser,server,ws,seq=0,trace=[],tracingDone;const pending=new Map(),errors=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function cdp(method,params={}){return new Promise((resolve,reject)=>{const id=++seq,t=setTimeout(()=>{pending.delete(id);reject(Error('Timeout '+method))},30000);pending.set(id,{resolve:v=>{clearTimeout(t);resolve(v)},reject:e=>{clearTimeout(t);reject(e)}});ws.send(JSON.stringify({id,method,params}))})}
async function ev(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value}
async function until(expr){const t=Date.now();while(Date.now()-t<20000){if(await ev(expr))return;await sleep(100)}throw Error('Timeout: '+expr)}
async function verify(){
  const checks=[];
  await ev(`__fake.hidden=false;window.__mainDetect=0;const detect=AR.Detector.prototype.detect;AR.Detector.prototype.detect=function(...a){__mainDetect++;return detect.apply(this,a)}`);
  // 62/31 px CSS: marcador com metade do tamanho angular (distância dobrada).
  for(const side of [62,31])for(const id of [300,301,302,303,304]){
    await ev(`fecharLupa();__fake.id=${id};__fake.side=${side};abrirLupa('carta',false)`);
    try{await until(`QuadroAR.id===${id}&&!!QuadroAR.cantos`)}catch(e){throw Error(`Placa ${id}, lado ${side}px: ${e.message}`)}
    assert(await ev(`Placa.workerAtivo&&__mainDetect===0`));checks.push(`Placa ${id}, lado ${side}px, sem detecção na interface`);
  }
  await ev(`window.__send=Placa.disparar;window.__take=Placa.consumir;Placa.disparar=()=>false;Placa.consumir=()=>null;Placa.parar();Placa.iniciar();__fake.id=300;__fake.side=62;`);await until(`Placa.workerAtivo`);await sleep(150);
  assert(await ev(`__send(document.querySelector('#lupaV'))&&!__send(document.querySelector('#lupaV'))`));
  await until(`!!(window.__packet=__take())`);assert(await ev(`__packet.marcas.some(m=>m.id===300)`));checks.push('Um envio em voo; resultado real consumido uma única vez');
  assert(await ev(`__take()===null`));
  await ev(`__send(document.querySelector('#lupaV'));Placa.parar();__fake.id=301;Placa.iniciar()`);await until(`Placa.workerAtivo`);await sleep(150);
  assert(await ev(`__take()===null&&__send(document.querySelector('#lupaV'))`));await until(`!!(window.__packet=__take())`);assert(await ev(`__packet.marcas.some(m=>m.id===301)&&!__packet.marcas.some(m=>m.id===300)`));checks.push('Fechar/reabrir descarta captura e resposta da geração anterior');
  await ev(`Placa.disparar=__send;Placa.consumir=__take;window.__features={Worker,OffscreenCanvas,createImageBitmap};`);
  for(const feature of ['Worker','OffscreenCanvas','createImageBitmap']){
    await ev(`fecharLupa();window[${JSON.stringify(feature)}]=undefined;__fake.id=300;abrirLupa('carta',false)`);await until(`QuadroAR.id===300&&!!QuadroAR.cantos`);assert(await ev(`!Placa.workerAtivo`));checks.push('Fallback sem '+feature);
    await ev(`fecharLupa();window[${JSON.stringify(feature)}]=__features[${JSON.stringify(feature)}]`);
  }
  assert(await ev(`__mainDetect>0`));
  await ev(`window.__VideoFrame=VideoFrame;window.VideoFrame=undefined;window.__antesFallback=__mainDetect;abrirLupa('carta',false)`);await until(`QuadroAR.id===300&&!!QuadroAR.cantos`);
  assert(await ev(`Placa.workerAtivo&&__mainDetect===__antesFallback`));checks.push('Sem VideoFrame continua assíncrono com ImageBitmap');
  await ev(`fecharLupa();window.VideoFrame=__VideoFrame`);
  await ev(`window.VideoFrame=undefined;window.createImageBitmap=()=>Promise.reject(Error('Falha de captura de teste'));abrirLupa('carta',false)`);await until(`QuadroAR.id===300&&!!QuadroAR.cantos`);assert(await ev(`!Placa.assincrono`));checks.push('Falha assíncrona de captura ativa fallback');
  const report={cpuThrottle:4,width:WIDTH,checks,errors};fs.writeFileSync(path.join(OUT,'worker-verificacao.json'),JSON.stringify(report,null,2));assert.deepEqual(errors,[]);console.log(checks.length+' OK · placas menores, worker, geração, fallback; CPU 4×');
}
async function main(){
  fs.mkdirSync(OUT,{recursive:true});
  server=http.createServer((q,r)=>{const f=path.resolve(ROOT,'.'+(q.url.split('?')[0]==='/'?'/index.html':q.url.split('?')[0]));if(!f.startsWith(ROOT+path.sep)){r.writeHead(403);r.end();return}fs.readFile(f,(e,b)=>{r.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.wasm':'application/wasm','.css':'text/css','.svg':'image/svg+xml'})[path.extname(f)]||'application/octet-stream'});r.end(e?'':b)})});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=spawn(CHROME,['--headless','--no-sandbox','--mute-audio','--autoplay-policy=user-gesture-required','--remote-debugging-port=0','--user-data-dir='+fs.mkdtempSync(path.join(OUT,'profile-')),'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  const endpoint=await new Promise((resolve,reject)=>{let s='';browser.stderr.on('data',b=>{s+=b;const m=s.match(/DevTools listening on (ws:\/\/\S+)/);if(m)resolve(m[1])});setTimeout(()=>reject(Error('Sem CDP')),15000).unref()});
  const tabs=await(await fetch(endpoint.replace('ws:','http:').replace(/\/devtools.*/,'/json'))).json();ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(p)m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}else if(m.method==='Tracing.dataCollected')trace.push(...m.params.value);else if(m.method==='Tracing.tracingComplete')tracingDone?.();else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);else if(m.method==='Fetch.requestPaused')cdp('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/css'}],body:Buffer.from("@font-face{font-family:Anton;src:local('Oswald')}@font-face{font-family:Caveat;src:local('Caveat')}@font-face{font-family:'Courier Prime';src:local('Courier New')}").toString('base64')}).catch(e=>errors.push(e.message))};
  await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Fetch.enable',{patterns:[{urlPattern:'https://fonts.googleapis.com/*'}]});
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
  // Mesma fixture dos testes funcionais; somente a resolução da fonte é parametrizada.
  const fixture=fs.readFileSync(path.join(__dirname,'ar-camera-fixture.js'),'utf8').replace('c.width=f.wide?1280:780;c.height=f.wide?720:1688;',`c.width=${WIDTH};c.height=${WIDTH*9/16};`);
  await cdp('Page.addScriptToEvaluateOnNewDocument',{source:fixture});
  await cdp('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/?ar-performance`});await until(`typeof Placa!=='undefined'&&typeof Mochila!=='undefined'`);
  await ev(`document.querySelector('#abrir').click()`);await sleep(1000);
  await ev(`window.__read=[];for(const key of ['lerTudo','disparar']){const fn=Placa[key];if(fn)Placa[key]=function(...a){const t=performance.now();try{return fn.apply(this,a)}finally{__read.push(performance.now()-t)}}}__fake.moving=false;__fake.hidden=true;abrirLupa('carta',false)`);
  await until(`document.querySelector('#lupaV').readyState>=2`);await sleep(1000);
  await cdp('Emulation.setCPUThrottlingRate',{rate:4});
  if(process.env.AR_VERIFY){await verify();return}
  if(process.env.AR_CAPTURE_PROBE){
    console.log(JSON.stringify(await ev(`(async()=>{Placa.disparar=()=>false;Placa.parar();const v=document.querySelector('#lupaV'),fn=window.createImageBitmap,result=[];for(const mode of ['resize','none','crop','full','frame']){const values=[];for(let i=0;i<50;i++){await new Promise(r=>setTimeout(r,30));const t=performance.now();let src=v;if(mode==='frame')src=new VideoFrame(v);const p=mode==='resize'?fn(src,0,0,v.videoWidth,v.videoHeight,{resizeWidth:960,resizeHeight:540,resizeQuality:'pixelated'}):mode==='none'?fn(src,0,0,v.videoWidth,v.videoHeight,{colorSpaceConversion:'none',premultiplyAlpha:'none'}):mode==='crop'?fn(src,0,0,v.videoWidth,v.videoHeight):fn(src);values.push(performance.now()-t);const bitmap=await p;bitmap.close();if(src!==v)src.close()}result.push({mode,max:Math.max(...values),mean:values.reduce((s,v)=>s+v,0)/values.length})}return result})()`)));return;
  }
  if(process.env.AR_HAND){
    await ev(`(()=>{window.__hands=[];window.__handModes=[];const NativeWorker=Worker;window.Worker=class extends NativeWorker{constructor(url,...args){super(url,...args);if(String(url).includes('mao-worker.js'))this.addEventListener('message',({data})=>{if(data.pronto)__handModes.push(data.cpu?'CPU':'GPU');if(Number.isFinite(data.ms))__hands.push(data.ms)})}postMessage(data,...args){if(${!!process.env.AR_HAND_CPU}&&data.tipo==='iniciar')data={...data,cpu:true};return super.postMessage(data,...args)}};__fake.hidden=false;Mochila.premiar(0)})()`);
    await until(`__hands.length>3`);
  }
  const results=[];
  for(const scene of process.env.AR_HAND?['rastreando+mao']:['procurando','foto-congelada']){
    if(scene.startsWith('rastreando')||scene==='foto-congelada'){await ev(`__fake.hidden=false;window.__freezeStart=performance.now()`);await until(scene==='foto-congelada'?`QuadroAR.foto`:`!!QuadroAR.cantos`);if(scene==='foto-congelada')assert(await ev(`!Placa.workerAtivo&&!Placa.ocupado`),'Worker deve parar na foto');await sleep(2000)}
    if(process.env.AR_HAND)await ev(`__hands=[]`);
    trace=[];await cdp('Tracing.start',{categories:'toplevel,devtools.timeline,blink.user_timing',transferMode:'ReportEvents'});
    const measured=await ev(`new Promise(resolve=>{__read=[];const frames=[],longTasks=[],poses=[],t0=performance.now();let last=t0;const observer=new PerformanceObserver(list=>longTasks.push(...list.getEntries().map(e=>({start:e.startTime-t0,ms:e.duration}))));observer.observe({type:'longtask'});function frame(t){frames.push(t-last);last=t;if(QuadroAR.cantos)poses.push(QuadroAR.cantos.flatMap(p=>[p.x,p.y]));if(t-t0<${DURATION})return requestAnimationFrame(frame);observer.disconnect();const mean=poses[0]?.map((_,i)=>poses.reduce((s,r)=>s+r[i],0)/poses.length);const jitter=mean?Math.sqrt(poses.reduce((s,r)=>s+r.reduce((v,x,i)=>v+(x-mean[i])**2,0),0)/(poses.length*4)):null;resolve({fps:frames.length*1000/(t-t0),maxRafGapMs:Math.max(...frames),reads:__read.length,maxReadMainMs:Math.max(0,...__read),meanReadMainMs:__read.reduce((s,n)=>s+n,0)/__read.length,longTasks,jitterPx:jitter,video:{width:document.querySelector('#lupaV').videoWidth,height:document.querySelector('#lupaV').videoHeight},worker:Placa.workerAtivo??false})}requestAnimationFrame(frame)})`);
    if(scene==='foto-congelada'){assert.equal(measured.reads,0,'Nenhuma detecção na foto');assert(measured.jitterPx<1e-8,'Foto sem tremor')}
    const done=new Promise(r=>tracingDone=r);await cdp('Tracing.end');await done;
    const main=trace.find(e=>e.name==='thread_name'&&e.args?.name==='CrRendererMain');
    const tasks=trace.filter(e=>e.pid===main?.pid&&e.tid===main?.tid&&e.ph==='X'&&/^(RunTask|ThreadControllerImpl::RunTask)$/.test(e.name));
    const maxTask=Math.max(0,...tasks.map(e=>e.dur/1000)),over16=tasks.filter(e=>e.dur>16000).length;
    const reads=trace.filter(e=>e.pid===main?.pid&&e.tid===main?.tid&&e.ph==='X'&&e.name==='FunctionCall'&&e.args?.data?.functionName==='detectar');
    const maxDetectionCallbackMs=Math.max(0,...reads.map(e=>e.dur/1000));
    if(process.env.AR_HAND)measured.hand=await ev(`({calls:__hands.length,maxMs:Math.max(0,...__hands),meanMs:__hands.reduce((s,n)=>s+n,0)/__hands.length,delegates:__handModes})`);
    fs.writeFileSync(path.join(OUT,`${LABEL}-${WIDTH}-${scene}-trace.json`),JSON.stringify({traceEvents:trace}));
    results.push({scene,...measured,maxMainTaskMs:maxTask,mainTasksOver16ms:over16,maxDetectionCallbackMs});console.log(JSON.stringify({...results.at(-1),longTasks:measured.longTasks.length}));
  }
  const report={label:LABEL,cpuThrottle:4,durationMs:DURATION,results,errors};fs.writeFileSync(path.join(OUT,`${LABEL}-${WIDTH}.json`),JSON.stringify(report,null,2));console.log('Relatório: '+path.join(OUT,`${LABEL}-${WIDTH}.json`));
  if(errors.length)throw Error(errors.join('\n'));
}
main().catch(e=>{console.error(e.stack?.split('\n').slice(0,7).join('\n'));process.exitCode=1}).finally(()=>{ws?.close();browser?.kill();server?.close()});
