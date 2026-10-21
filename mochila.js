/* Caso Black: todos os tamanhos físicos são lados do quadrado preto do marcador. */
function pincaMochila(l,anterior=false,w=1,h=1){
  if(!Array.isArray(l)||l.length<21||![0,4,5,8,9,17].every(i=>Number.isFinite(l[i]?.x)&&Number.isFinite(l[i]?.y)))return null;
  const dist=(a,b)=>Math.hypot((l[a].x-l[b].x)*w,(l[a].y-l[b].y)*h);
  const palma=Math.max(dist(0,9),dist(5,17));if(palma<1e-6)return null;
  const razao=dist(4,8)/palma;
  return {x:(l[4].x+l[8].x)/2,y:(l[4].y+l[8].y)/2,razao,fechada:razao<(anterior ? .43 : .28)};
}
const Mochila=(()=>{
  if(typeof document==='undefined')return {pinca:pincaMochila};
  // Illustrator: área à direita do 311; três slots, cada lado = 1,2 marcadores.
  const CARTA={id:311,x:1.35,y:-.2,w:4.2,h:2.1,slots:3};
  const PREMIO={placa:300,x:455,y:660,duracao:850};
  const ITENS={lente:{img:null,desenhar(x){
    x.lineCap='round';x.strokeStyle='#22252a';x.lineWidth=14;x.beginPath();x.moveTo(22,22);x.lineTo(44,44);x.stroke();
    x.beginPath();x.arc(0,0,30,0,Math.PI*2);x.fillStyle='#ee273a55';x.fill();x.lineWidth=7;x.stroke();
    x.strokeStyle='#ffffffb0';x.lineWidth=3;x.beginPath();x.arc(-2,-2,22,3.6,4.6);x.stroke();
  }}};
  // Arte final: substituir só esta função (plano lógico 600 × 800).
  const TINTA_OCULTA=x=>{
    x.fillStyle='#8c1024';
    for(const [cx,cy,a] of [[240,420,-.3],[330,525,.3],[240,630,-.2]]){
      x.save();x.translate(cx,cy);x.rotate(a);x.beginPath();x.ellipse(0,12,21,26,0,0,Math.PI*2);x.fill();
      for(const [px,py] of [[-27,-13],[-11,-32],[12,-32],[28,-12]]){x.beginPath();x.ellipse(px,py,9,13,0,0,Math.PI*2);x.fill()}x.restore();
    }
    x.strokeStyle='#8c1024';x.lineWidth=10;x.lineJoin='round';x.beginPath();x.moveTo(335,650);x.lineTo(415,650);x.lineTo(395,625);x.moveTo(415,650);x.lineTo(395,675);x.stroke();
  };
  let demo=!!window.DEV&&location.hash==='#demo-mochila',aberta=false,ui=null,bag=[],mao=null,solta=null,revelada=false;
  let carta=null,quadros=new Map(),cursor=null,ultimaMao=-Infinity,custoMao=0,modelo=null,carga=null,falhou=false,cpuModelo=false,geracao=0,arrasto=null,cancelarCarga=null;
  let demoId=300,demoTimer=0,demoStream=null,tintaPixels=null;
  const $=s=>ui.querySelector(s),agora=()=>performance.now();
  function ler(){
    bag=[];if(demo){solta=null;return}
    try{const b=JSON.parse(localStorage.getItem('cb-mochila')||'[]');if(Array.isArray(b))bag=[...new Set(b.filter(id=>Object.hasOwn(ITENS,id)))];
      const salvo=localStorage.getItem('cb-mochila-mao');if(Object.hasOwn(ITENS,salvo)&&!bag.includes(salvo))bag.push(salvo);
      if(bag.includes('lente'))solta=null;
      else if(localStorage.getItem('cb-mochila-pendente')==='lente')solta={id:'lente',...PREMIO,t:agora(),adquirida:false};
    }catch(_){}
  }
  function salvar(){if(demo)return;try{
    // Recuperação após reload/fechamento abrupto, sem perder um item retirado da carta.
    if(mao||solta?.adquirida)localStorage.setItem('cb-mochila-mao',mao?.id||solta.id);
    localStorage.setItem('cb-mochila',JSON.stringify(bag));
    if(!mao&&!solta?.adquirida)localStorage.removeItem('cb-mochila-mao');
    if(solta&&!solta.adquirida)localStorage.setItem('cb-mochila-pendente',solta.id);else localStorage.removeItem('cb-mochila-pendente');
  }catch(_){toast('Não foi possível salvar a mochila neste navegador.')}}
  function fala(t,titulo='NA CARTA'){beFala(t,titulo,{nome:'Lucas',cab:['lucas']})}
  function item(c,id,tamanho=100){const x=c.getContext('2d');c.width=c.height=tamanho;x.translate(tamanho/2,tamanho/2);x.scale(tamanho/110,tamanho/110);
    const it=ITENS[id];if(it.img)x.drawImage(it.img,-55,-55,110,110);else it.desenhar(x)}
  function criar(){
    if(ui)return;
    document.head.insertAdjacentHTML('beforeend',`<style>
      #mochilaAR{position:fixed;inset:0;z-index:94;pointer-events:none;color:#fff;font-family:Montserrat,sans-serif}
      #mochilaAR[hidden],#mochilaAR [hidden]{display:none!important}
      #mochilaAR .m-plano{position:absolute;left:0;top:0;transform-origin:0 0;pointer-events:none}
      #mochilaAR canvas{display:block;pointer-events:none}
      #mochilaAR button{pointer-events:auto;touch-action:none;cursor:pointer;border:0}
      #mochilaAR button:focus-visible{outline:4px solid #fdc72f}
      #mochilaQueda{width:600px;height:800px}
      #mochilaItem{position:absolute;width:120px;height:120px;background:#fff3;border:3px dashed #fdc72f!important;border-radius:24px}
      #mochilaItem canvas{width:100%;height:100%}
      #mochilaCarta{width:720px;height:360px;background:#f6efd9eb;border:5px solid #473325;border-radius:18px;padding:26px;box-sizing:border-box}
      #mochilaCarta b{display:block;color:#473325;font:700 28px 'Courier Prime',monospace;margin-bottom:22px}
      #mochilaSlots{display:flex;gap:20px}#mochilaSlots button{width:200px;height:200px;background:#6c50331c;border:3px dashed #856442!important;border-radius:14px}
      #mochilaSlots canvas{width:100%;height:100%}#mochilaSlots button:disabled{pointer-events:none}
      #mochilaRevelacao{position:absolute;inset:0;pointer-events:none}#mochilaTinta{width:600px;height:800px}
      #mochilaFlutuante{position:absolute;width:120px;height:120px;transform:translate(-50%,-50%)}
      #mochilaCursor{position:absolute;width:22px;height:22px;border:2px solid #fff;border-radius:50%;transform:translate(-50%,-50%);background:#fff3;box-shadow:0 1px 5px #000}
      #mochilaCursor.fechada{background:#fdc72f88;border-color:#fdc72f}
      #mochilaBarra{position:absolute;left:12px;top:calc(12px + env(safe-area-inset-top));display:flex;align-items:center;gap:5px;padding:4px 8px;border-radius:30px;background:#16130dcc;min-height:40px}
      #mochilaBarra canvas{width:36px;height:36px}#mochilaBarra>svg{width:25px;height:30px}
      #mochilaGuardar{display:flex;align-items:center;background:#fdc72f;color:#17130d;border-radius:24px;min-width:48px;min-height:44px;padding:2px 7px}
      #mochilaDev{position:absolute;right:60px;top:calc(19px + env(safe-area-inset-top));color:#fff;background:#181818aa;border-radius:5px;padding:8px}
      #mochilaEtapas{position:absolute;left:10px;right:10px;top:calc(70px + env(safe-area-inset-top));display:flex;gap:4px}
      #mochilaEtapas button{background:#181818da;color:#fff;padding:8px;border-radius:4px;font:600 11px Montserrat}
      #mochilaInstrucao{position:absolute;left:16px;right:16px;bottom:calc(140px + env(safe-area-inset-bottom));text-align:center;font-size:12px;background:#16130ddd;border-radius:8px;padding:8px}
    </style>`);
    ui=document.createElement('div');ui.id='mochilaAR';ui.hidden=true;
    ui.innerHTML=`<div id="mochilaRevelacao" hidden><canvas id="mochilaTinta" class="m-plano" width="600" height="800"></canvas></div>
      <div id="mochilaCarta" class="m-plano" hidden><b>MOCHILA DA CARTA</b><div id="mochilaSlots"></div></div>
      <div id="mochilaQueda" class="m-plano" hidden><button id="mochilaItem" aria-label="Pegar lente vermelha"><canvas></canvas></button></div>
      <canvas id="mochilaFlutuante" hidden></canvas><div id="mochilaCursor" hidden></div>
      <div id="mochilaBarra" aria-label="Inventário"><svg viewBox="0 0 28 32" role="img" aria-label="Mochila" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 9V6a6 6 0 0 1 12 0v3M7 7h14a4 4 0 0 1 4 4v16a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V11a4 4 0 0 1 4-4ZM8 19h12v8H8ZM8 13h12"/></svg><div id="mochilaGuardados"></div><button id="mochilaGuardar" aria-label="Guardar lente na carta" hidden>✋<canvas></canvas></button></div>
      <button id="mochilaDev" class="demo" style="display:none">dar a lente</button>
      <nav id="mochilaEtapas" aria-label="Etapas da demonstração" hidden><button data-etapa="300">1 · Quadro</button><button data-etapa="311">2 · Carta</button><button data-etapa="303">3 · Lojinha</button></nav>
      <div id="mochilaInstrucao" role="status" hidden></div>`;
    document.body.append(ui);item($('#mochilaItem canvas'),'lente',120);item($('#mochilaFlutuante'),'lente',120);item($('#mochilaGuardar canvas'),'lente',72);
    const tinta=$('#mochilaTinta').getContext('2d');TINTA_OCULTA(tinta);tintaPixels=tinta.getImageData(0,0,600,800).data;
    $('#mochilaItem').onclick=()=>coletar('toque');$('#mochilaGuardar').onclick=guardar;
    $('#mochilaDev').style.display=window.DEV?'block':'none';$('#mochilaDev').onclick=()=>{if(!window.DEV)return;if(!bag.includes('lente')&&!mao){bag.push('lente');salvar();barra();vibra(30)}};
    $('#mochilaEtapas').onclick=e=>{const b=e.target.closest('[data-etapa]');if(b)etapaDemo(+b.dataset.etapa)};
    // Captura só os alvos da mochila e o gesto de usar a lente; os jogos continuam recebendo toques.
    document.addEventListener('pointerdown',e=>{
      if(!aberta||e.button!==0)return;
      const b=e.target.closest('#mochilaAR button');if(b&&!b.disabled){e.preventDefault();e.stopImmediatePropagation();b.click();return}
      if(mao?.modo==='toque'&&!e.target.closest('#quadro button,#quadroHUD button')&&noQuadro({x:e.clientX,y:e.clientY},303)){
        e.preventDefault();e.stopImmediatePropagation();arrasto=e.pointerId;mao.p={x:e.clientX,y:e.clientY};
      }
    },true);
    document.addEventListener('pointermove',e=>{if(arrasto===e.pointerId&&mao?.modo==='toque'){e.preventDefault();e.stopImmediatePropagation();mao.p={x:e.clientX,y:e.clientY}}},true);
    for(const ev of ['pointerup','pointercancel'])document.addEventListener(ev,e=>{if(arrasto===e.pointerId)arrasto=null},true);
  }
  function barra(){if(!ui)return;const b=$('#mochilaGuardados');b.replaceChildren();
    for(const id of bag){const c=document.createElement('canvas');c.setAttribute('aria-label',id+' guardada');item(c,id,72);b.append(c)}
    $('#mochilaGuardar').hidden=!mao;$('#mochilaBarra').hidden=!bag.length&&!mao&&!solta;
    const slots=$('#mochilaSlots');slots.replaceChildren();
    for(let i=0;i<CARTA.slots;i++){const id=bag[i],b=document.createElement('button');b.disabled=!id;b.setAttribute('aria-label',id?'Tirar '+id+' da carta':'Slot vazio');
      if(id){b.dataset.item=id;const c=document.createElement('canvas');item(c,id,200);b.append(c);b.onclick=()=>tirar(id,'toque')}slots.append(b)}
  }
  function iniciar(){demo=!!window.DEV&&location.hash==='#demo-mochila';criar();aberta=true;ui.hidden=false;ler();mao=null;cursor=null;quadros.clear();carta=null;revelada=false;falhou=false;
    $('#mochilaEtapas').hidden=!demo;$('#mochilaInstrucao').hidden=!demo;barra();
  }
  function fechar(){if(!aberta)return;guardar(false);if(solta?.adquirida){if(!bag.includes(solta.id))bag.push(solta.id);solta=null;salvar()}aberta=false;geracao++;cancelarCarga?.();cancelarCarga=null;modelo?.close();modelo=null;carga=null;falhou=false;ultimaMao=-Infinity;custoMao=0;cursor=null;arrasto=null;
    clearTimeout(demoTimer);ui.hidden=true;document.body.classList.remove('mochila-carta');demoStream?.getTracks().forEach(t=>t.stop());demoStream=null;
  }
  function premiar(est){if(est!==0||bag.includes('lente')||mao?.id==='lente'||solta)return;
    solta={id:'lente',placa:PREMIO.placa,x:PREMIO.x,y:PREMIO.y,t:agora(),adquirida:false};salvar();barra();
  }
  function coletar(modo,p){if(!solta||!visivel(quadros.get(solta.placa)))return false;const premio=!solta.adquirida,id=solta.id;solta=null;
    if(premio&&!bag.includes(id))bag.push(id);
    if(modo==='mao'||!premio)mao={id,origem:premio?'premio':'carta',modo,p};
    salvar();barra();vibra(35);if(premio)fala('Lente guardada na sua carta! Aponte para a mochila para tirar.');return true;
  }
  function tirar(id,modo,p){if(!bag.includes(id)||!visivel(carta))return false;if(mao)guardar(false);bag=bag.filter(n=>n!==id);mao={id,origem:'carta',modo,p};salvar();barra();vibra(25);return true}
  function guardar(avisar=false){if(!mao)return;const id=mao.id;mao=null;if(!bag.includes(id))bag.push(id);salvar();barra();if(avisar)fala('Lente guardada na carta.')}
  function visivel(g,t=agora()){return g&&t-g.vis<450}
  function tela(p,v){const r=document.getElementById('lupaC').getBoundingClientRect(),w=v.videoWidth||v.width,h=v.videoHeight||v.height,s=Math.max(r.width/w,r.height/h);
    return {x:r.x+(r.width-w*s)/2+p.x*s,y:r.y+(r.height-h*s)/2+p.y*s}}
  function plano(el,cs,w,h){const m=QuadroAR.homografia(cs);if(!m)return null;
    el.style.transform=`matrix3d(${[m[0]/w,m[3]/w,0,m[6]/w,m[1]/h,m[4]/h,0,m[7]/h,0,0,1,0,m[2],m[5],0,1].join(',')})`;return m;
  }
  function local(m,p){if(!m)return null;const a=m[0]-p.x*m[6],b=m[1]-p.x*m[7],c=p.x-m[2],d=m[3]-p.y*m[6],e=m[4]-p.y*m[7],f=p.y-m[5],z=a*e-b*d;
    return Math.abs(z)>1e-8?{x:(c*e-b*f)/z,y:(a*f-c*d)/z}:null}
  function noQuadro(p,id){const g=quadros.get(id);if(!visivel(g))return null;const cs=QuadroAR.id===id&&QuadroAR.cantos||g.cantos,q=local(QuadroAR.homografia(cs),p);return q&&q.x>=0&&q.x<=1&&q.y>=0&&q.y<=1?q:null}
  function observar(marcas,v,t){if(!aberta)return;
    for(const mk of marcas){if(mk.id===CARTA.id){if(!QuadroAR.convexa(mk.corners))continue;const m=QuadroAR.homografia(mk.corners),uv=[[CARTA.x,CARTA.y],[CARTA.x+CARTA.w,CARTA.y],[CARTA.x+CARTA.w,CARTA.y+CARTA.h],[CARTA.x,CARTA.y+CARTA.h]];
        if(!m||uv.some(([u,v])=>m[6]*u+m[7]*v+1<=.08))continue;
        const cantos=uv.map(([u,w])=>tela(QuadroAR.ponto(m,u,w),v));if(QuadroAR.convexa(cantos,900))carta={marca:mk,vis:t,cantos};
      }else if(mk.id===300||mk.id===303){const g=QuadroAR.geometria(mk,v);if(g)quadros.set(mk.id,{cantos:g.cantos,vis:t})}
    }
  }
  function pontoMao(){return mao?.modo==='mao'&&cursor?cursor:mao?.p||{x:innerWidth-50,y:170}}
  function hit(p){
    if(solta&&visivel(quadros.get(solta.placa))){const g=quadros.get(solta.placa),q=local(QuadroAR.homografia(QuadroAR.id===solta.placa&&QuadroAR.cantos||g.cantos),p);
      if(q&&Math.abs(q.x*600-solta.x)<65&&Math.abs(q.y*800-alturaSolta(agora()))<65)return {tipo:'solta'};}
    if(visivel(carta)){const q=local(QuadroAR.homografia(carta.cantos),p);if(q){const x=q.x*720,y=q.y*360,i=Math.floor((x-31)/220);if(i>=0&&i<CARTA.slots&&x>=31+i*220&&x<=231+i*220&&y>=84&&y<=284&&bag[i])return {tipo:'slot',id:bag[i]}}}
    return null;
  }
  function soltar(){if(!mao)return;if(mao.origem==='premio'){mao=null;salvar();barra();return}
    const p=pontoMao(),qc=visivel(carta)&&local(QuadroAR.homografia(carta.cantos),p);
    if(qc&&qc.x>=0&&qc.x<=1&&qc.y>=0&&qc.y<=1)return guardar();
    for(const id of [303,300]){const q=noQuadro(p,id);if(q){solta={id:mao.id,placa:id,x:Math.max(65,Math.min(535,q.x*600)),y:Math.max(65,Math.min(735,q.y*800)),t:agora(),adquirida:true};mao=null;salvar();barra();return}}
    guardar();
  }
  function receberMao(l,v,t){
    const anterior=cursor?.fechada||false,g=pincaMochila(l,anterior,v.videoWidth||v.width,v.videoHeight||v.height);
    if(!g){if(cursor&&t-cursor.vis>300){soltar();cursor=null}return}
    const p=tela({x:g.x*(v.videoWidth||v.width),y:g.y*(v.videoHeight||v.height)},v);cursor={...p,vis:t,fechada:g.fechada};
    if(g.fechada&&!anterior){const alvo=hit(p);if(alvo?.tipo==='solta')coletar('mao',p);else if(alvo?.tipo==='slot')tirar(alvo.id,'mao',p);else if(mao?.modo==='toque'){mao.modo='mao';mao.p=p}}
    if(!g.fechada&&anterior&&mao?.modo==='mao')soltar();
  }
  function modeloWorker(cpu,aoErro){
    const w=new Worker('mao-worker.js?v=1');let fechado=false,pronto=false,emVoo=false,retorno=null,timer=0,rejeitar,usarFrame=true;
    const cargaWorker=new Promise((ok,erro)=>{rejeitar=erro;timer=setTimeout(()=>falha(Error('Tempo do modelo')),15000);
      w.onmessage=({data})=>{if(fechado)return;if(data.erro){falha(Error(data.erro));return}
        if(data.pronto){clearTimeout(timer);pronto=true;proxy.cpu=data.cpu;ok(proxy);return}
        clearTimeout(timer);emVoo=false;const receber=retorno;retorno=null;receber?.(data.landmarks,data.t,data.ms)};
      w.onerror=e=>{e.preventDefault();falha(Error(e.message||'Worker da mão indisponível'))};
    });
    function falha(e){if(fechado)return;if(!pronto)rejeitar(e);else aoErro();proxy.close()}
    const proxy={worker:true,cpu:false,pronto:cargaWorker,get ocupado(){return emVoo},
      enviar(v,t,receber){if(fechado||!pronto||emVoo)return false;emVoo=true;retorno=receber;const videoTime=v.currentTime;timer=setTimeout(()=>falha(Error('Tempo da mão')),4000);
        // VideoFrame transfere a referência; a conversão de pixels fica no worker.
        let frame;try{if(usarFrame&&typeof VideoFrame==='function')frame=new VideoFrame(v)}catch(_){usarFrame=false}
        if(frame){try{w.postMessage({tipo:'quadro',frame,t,videoTime},[frame])}catch(_){frame.close();usarFrame=false}if(usarFrame)return true}
        try{createImageBitmap(v).then(bitmap=>{if(fechado){bitmap.close();return}
          try{w.postMessage({tipo:'quadro',bitmap,t,videoTime},[bitmap])}catch(e){bitmap.close();falha(e)}
        },falha)}catch(e){falha(e)}return true},
      close(){if(fechado)return;fechado=true;clearTimeout(timer);w.terminate();retorno=null;if(!pronto)rejeitar(Error('Modelo encerrado'))}
    };
    w.postMessage({tipo:'iniciar',cpu});return proxy;
  }
  function erroMao(){modelo?.close();modelo=null;if(cpuModelo){falhou=true;toast('Mão indisponível. Toque nos itens para pegar.')}else preparar(true)}
  async function preparar(cpu=false){if(carga||falhou||!aberta)return;const vez=geracao;
    carga=(async()=>{try{
        if(typeof Worker==='function'&&typeof OffscreenCanvas==='function'&&typeof createImageBitmap==='function'){
          let proxy;
          try{proxy=modeloWorker(cpu,()=>{if(aberta&&vez===geracao)erroMao()});cancelarCarga=()=>proxy.close();
            const novo=await proxy.pronto;if(vez===geracao)cancelarCarga=null;if(!aberta||vez!==geracao){novo.close();return}modelo=novo;cpuModelo=novo.cpu;return;
          }catch(_){proxy?.close();if(vez===geracao)cancelarCarga=null;if(!aberta||vez!==geracao)return}
        }
        const {FilesetResolver,HandLandmarker}=await import('./vendor/mediapipe/vision_bundle.mjs');const fs=await FilesetResolver.forVisionTasks('./vendor/mediapipe/wasm');
        const criar=delegate=>HandLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:'./vendor/mediapipe/hand_landmarker.task',delegate},runningMode:'VIDEO',numHands:1});
        let novo,usouCPU=cpu;try{novo=await criar(cpu?'CPU':'GPU')}catch(e){if(cpu)throw e;usouCPU=true;novo=await criar('CPU')}
        if(!aberta||vez!==geracao){novo.close();return}modelo=novo;cpuModelo=usouCPU;
      }catch(_){if(vez===geracao&&aberta){falhou=true;toast('Mão indisponível. Toque nos itens para pegar.')}}finally{if(vez===geracao)carga=null}
    })();
  }
  function lerMao(v,t,vezMao){
    if(!aberta||demo)return false;
    const precisa=mao||solta&&visivel(quadros.get(solta.placa),t)||bag.length&&visivel(carta,t);
    if(!precisa)return false;if(!modelo){preparar();return false}
    if(!vezMao||t-ultimaMao<Math.max(1000/15,modelo.worker?0:custoMao*2))return false;
    if(modelo.worker){const vez=geracao,enviou=modelo.enviar(v,t,(l,tempo)=>{if(aberta&&vez===geracao&&agora()-tempo<350)receberMao(l,v,tempo)});if(enviou)ultimaMao=t;return enviou}
    ultimaMao=t;const inicio=agora();
    try{receberMao(modelo.detectForVideo(v,t).landmarks[0],v,t)}catch(_){erroMao()}
    custoMao=.7*custoMao+.3*(agora()-inicio);return true;
  }
  function desenhar(t=agora()){
    if(!aberta)return;const gc=visivel(carta,t);$('#mochilaCarta').hidden=!gc;if(gc)plano($('#mochilaCarta'),carta.cantos,720,360);
    document.getElementById('lupa').classList.toggle('mochila-foco',!!gc||!!mao);
    document.body.classList.toggle('mochila-carta',!!gc);
    const g=solta&&quadros.get(solta.placa),gs=visivel(g,t);$('#mochilaQueda').hidden=!gs;
    if(gs){plano($('#mochilaQueda'),QuadroAR.id===solta.placa&&QuadroAR.cantos||g.cantos,600,800);
      $('#mochilaItem').style.left=(solta.x-60)+'px';$('#mochilaItem').style.top=(alturaSolta(t)-60)+'px';}
    if(cursor&&t-cursor.vis>350){if(mao?.modo==='mao')soltar();cursor=null}
    $('#mochilaCursor').hidden=!cursor;if(cursor){const c=$('#mochilaCursor');c.style.left=cursor.x+'px';c.style.top=cursor.y+'px';c.classList.toggle('fechada',cursor.fechada)}
    const fl=$('#mochilaFlutuante');fl.hidden=!mao;if(mao){const p=pontoMao();/* desenho: centro do vidro = centro do cursor */
      fl.style.left=p.x+'px';fl.style.top=p.y+'px';}
    const p=mao&&pontoMao(),q=p&&noQuadro(p,303),revela=$('#mochilaRevelacao');revela.hidden=!q;
    if(q){const g=quadros.get(303),cs=QuadroAR.id===303&&QuadroAR.cantos||g.cantos;plano($('#mochilaTinta'),cs,600,800);
      revela.style.clipPath=`circle(33px at ${p.x}px ${p.y}px)`;
      if(!revelada&&QuadroAR.id===303&&tintaNoCirculo(q,cs)){revelada=true;vibra(30);fala('Pegadas do Pipoca! A lente revelou a tinta escondida.','TINTA INVISÍVEL')}
    }
    if(demo)$('#mochilaInstrucao').textContent=demoId===300?'Toque na lente que caiu no quadro. Depois, abra “2 · Carta”.':demoId===311?'Toque na lente dentro da mochila da carta. Depois, abra “3 · Lojinha”.':'Com a lente selecionada, toque e arraste sobre o quadro para procurar as pegadas.';
  }
  function alturaSolta(t){if(solta.adquirida)return solta.y;const p=Math.min(1,Math.max(0,(t-solta.t)/PREMIO.duracao));return solta.y-350*(1-p)*(1-p)+Math.sin(p*Math.PI*3)*(1-p)*35}
  function tintaNoCirculo(q,cs){const px=q.x*600,py=q.y*800,r=33*600/Math.max(1,Math.hypot(cs[1].x-cs[0].x,cs[1].y-cs[0].y));
    for(let y=Math.max(0,Math.floor(py-r));y<Math.min(800,py+r);y+=8)for(let x=Math.max(0,Math.floor(px-r));x<Math.min(600,px+r);x+=8)
      if((x-px)**2+(y-py)**2<=r*r&&tintaPixels[(y*600+x)*4+3]>0)return true;
    return false;
  }
  function etapaDemo(id){if(!demo)return;clearTimeout(demoTimer);Quadro.fechar();demoId=id;quadros.clear();carta=null;$('#mochilaCarta').hidden=true;$('#mochilaQueda').hidden=true;$('#mochilaRevelacao').hidden=true;
    if(id===300&&!bag.length&&!mao)solta=null;
  }
  function quadroDemo(marcas,v,t){const mk=marcas.find(m=>m.id===demoId);if(!mk||demoId===311)return;
    if(QuadroAR.id!==demoId){Quadro.abrir(demoId===300?0:3,'demo',()=>etapaDemo(311),true);
      if(demoId===300)demoTimer=setTimeout(()=>premiar(0),600);}
    QuadroAR.atualizar(mk,v,t);
  }
  function videoDemo(){
    demoId=300;const c=document.createElement('canvas');c.width=780;c.height=1688;const x=c.getContext('2d');let id=-1,rects=[];
    function draw(){x.fillStyle='#bcb3a0';x.fillRect(0,0,c.width,c.height);x.strokeStyle='#aa9c84';for(let y=0;y<c.height;y+=120){x.beginPath();x.moveTo(0,y);x.lineTo(c.width,y+20);x.stroke()}
      if(id!==demoId){id=demoId;const doc=new DOMParser().parseFromString(Placa.svg(id),'image/svg+xml');rects=[...doc.querySelectorAll('rect')].map(r=>({x:(+r.getAttribute('x')-1)/6,y:(+r.getAttribute('y')-1)/6,w:+r.getAttribute('width')/6,h:+r.getAttribute('height')/6,cor:r.getAttribute('fill')}))}
      // Mesmo plano e quadrados reais usados pelo detector; nenhuma leitura simulada.
      const m=QuadroAR.homografia((id===311?[[85,430],[205,435],[200,555],[80,550]]:[[328,155],[452,162],[449,286],[325,279]]).map(([x,y])=>({x,y})));
      for(const r of rects){x.fillStyle=r.cor;x.beginPath();[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]].forEach(([u,v],i)=>{const p=QuadroAR.ponto(m,u,v);i?x.lineTo(p.x,p.y):x.moveTo(p.x,p.y)});x.closePath();x.fill()}
    }
    draw();const stream=c.captureStream(30),iv=setInterval(draw,1000/30),track=stream.getVideoTracks()[0],stop=track.stop.bind(track);track.stop=()=>{clearInterval(iv);stop()};demoStream=stream;return stream;
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){guardar();cursor=null}});
  if(demo)addEventListener('load',()=>{irPara(0,false);abrirLupa()});
  return {iniciar,fechar,premiar,observar,desenhar,lerMao,pinca:pincaMochila,ITENS,CARTA,TINTA_OCULTA,
    videoDemo,quadroDemo,etapaDemo,get lendoMao(){return !!modelo?.worker&&modelo.ocupado},get demo(){return demo},get naMao(){return mao?.id},get premioPendente(){return !!solta&&!solta.adquirida},get procurarCarta(){return !!(solta||mao||bag.length)},get rastreio(){return visivel(carta)?carta.marca:null}};
})();
if(typeof module!=='undefined'&&module.exports)module.exports={pinca:pincaMochila};
