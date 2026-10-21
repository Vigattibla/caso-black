/* Medidas em lados do quadrado preto da placa. DOM e hit-test ficam no mesmo plano. */
const QUADRO_ESCALA = 5;
const QuadroAR = (() => {
  const W=600,H=800,TOPO=-.22;
  let estado=null;
  function homografia(p){
    const [a,b,c,d]=p,dx=b.x-c.x,dy=b.y-c.y,ex=d.x-c.x,ey=d.y-c.y;
    const sx=a.x-b.x+c.x-d.x,sy=a.y-b.y+c.y-d.y,den=dx*ey-ex*dy;
    if(Math.abs(den)<1e-8)return null;
    const g=(sx*ey-ex*sy)/den,h=(dx*sy-sx*dy)/den;
    return [b.x-a.x+g*b.x,d.x-a.x+h*d.x,a.x,b.y-a.y+g*b.y,d.y-a.y+h*d.y,a.y,g,h,1];
  }
  function ponto(m,x,y){const z=m[6]*x+m[7]*y+1;return {x:(m[0]*x+m[1]*y+m[2])/z,y:(m[3]*x+m[4]*y+m[5])/z}}
  function convexa(p,min=64){
    if(p.length!==4||p.some(a=>!Number.isFinite(a.x)||!Number.isFinite(a.y)))return false;
    let sinal=0,area=0;
    for(let i=0;i<4;i++){const a=p[i],b=p[(i+1)%4],c=p[(i+2)%4],z=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);
      if(Math.abs(z)<1e-5||sinal&&Math.sign(z)!==sinal)return false;sinal=Math.sign(z);area+=a.x*b.y-b.x*a.y}
    return Math.abs(area)/2>=min;
  }
  function geometria(mk,v){
    if(!mk||!convexa(mk.corners))return null;
    const m=homografia(mk.corners),esq=(1-QUADRO_ESCALA)/2,baixo=TOPO+QUADRO_ESCALA*4/3;
    if(!m)return null;
    const mundo=[[esq,TOPO],[esq+QUADRO_ESCALA,TOPO],[esq+QUADRO_ESCALA,baixo],[esq,baixo]];
    const zs=mundo.map(([x,y])=>m[6]*x+m[7]*y+1);
    if(zs.some(z=>z<=.08))return null;
    const r=document.getElementById('lupaC').getBoundingClientRect(),vw=v.videoWidth||v.width,vh=v.videoHeight||v.height;
    if(!vw||!vh||!r.width||!r.height)return null;
    // object-fit:cover; coordenadas CSS, independentes do DPR do backing canvas.
    const s=Math.max(r.width/vw,r.height/vh),ox=r.x+(r.width-vw*s)/2,oy=r.y+(r.height-vh*s)/2;
    const tela=p=>({x:ox+p.x*s,y:oy+p.y*s}),cantos=mundo.map(([x,y])=>tela(ponto(m,x,y)));
    if(!convexa(cantos,900)||cantos.some(p=>Math.abs(p.x)>r.width*12||Math.abs(p.y)>r.height*12))return null;
    return {cantos,placa:mk.corners.map(tela)};
  }
  const alpha=(dt,c)=>1/(1+1/(2*Math.PI*c*dt));
  class Euro {
    constructor(x,t){this.x=this.raw=x;this.dx=0;this.t=t}
    filtrar(x,t){const dt=Math.max(.001,Math.min(.15,(t-this.t)/1000));this.t=t;
      this.dx+=alpha(dt,1)*((x-this.raw)/dt-this.dx);this.raw=x;
      this.x+=alpha(dt,.65+.018*Math.abs(this.dx))*(x-this.x);return this.x}
  }
  function montar(el,i){
    limpar();const hud=document.createElement('div');hud.id='quadroHUD';hud.setAttribute('aria-label','Controles da investigação');
    hud.innerHTML='<div class="qar-status" role="status" hidden>aponte para a placa</div><button class="qar-tela" hidden>VER EM TELA CHEIA</button><div class="qar-fala"></div><div class="qar-acoes"></div>';
    document.body.append(hud);
    const itens=[document.getElementById('balao'),el.querySelector('.q-dica'),el.querySelector('.q-segue')];
    estado={el,hud,id:ARUCO0+i,itens,casas:itens.map(b=>b.parentElement),vis:performance.now(),inicio:performance.now(),filtros:null,cantos:null,raw:null,tela:false,salto:null};el.setAttribute('aria-owns','quadroHUD');
    const placa=document.createElement('div');placa.className='q-placa';placa.innerHTML=`<span>PROVA ${String(i+1).padStart(2,'0')}</span>`;el.append(placa);
    el.style.setProperty('--placa-x',`${W*(QUADRO_ESCALA-1)/(2*QUADRO_ESCALA)}px`);
    el.style.setProperty('--placa-y',`${-TOPO*W/QUADRO_ESCALA}px`);el.style.setProperty('--placa-lado',`${W/QUADRO_ESCALA}px`);
    hud.querySelector('.qar-tela').onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();telaCheia()};
    hud.querySelector('.qar-tela').onclick=e=>{if(e.detail===0)telaCheia()};perspectiva();el.style.visibility='hidden';
  }
  function perspectiva(){const e=estado;if(!e)return;e.tela=false;e.el.classList.add('ar');
    e.hud.classList.remove('tela');e.hud.querySelector('.qar-fala').append(e.itens[0]);e.hud.querySelector('.qar-acoes').append(e.itens[1],e.itens[2]);e.itens[2].hidden=!e.el.querySelector('.q-fim:not([hidden])');e.el._resize?.();}
  function telaCheia(){const e=estado;if(!e)return;e.tela=true;e.el.classList.remove('ar');e.el.style.transform='';e.el.style.opacity='';e.el.style.visibility='';
    e.itens.forEach((b,i)=>{b.hidden=false;e.casas[i].append(b)});e.hud.classList.add('tela');e.el._resize?.()}
  function atualizar(mk,v,t=performance.now()){
    const e=estado;if(!e||mk?.id!==e.id)return false;const g=geometria(mk,v);if(!g)return false;
    if(e.raw){const lado=Math.hypot(g.placa[1].x-g.placa[0].x,g.placa[1].y-g.placa[0].y),salto=Math.max(...g.placa.map((p,i)=>Math.hypot(p.x-e.raw.placa[i].x,p.y-e.raw.placa[i].y)));
      if(salto>Math.max(65,lado*.8)){
        const anterior=e.salto,perto=anterior&&g.placa.every((p,i)=>Math.hypot(p.x-anterior.placa[i].x,p.y-anterior.placa[i].y)<lado*.25);
        e.salto={placa:g.placa,n:perto?anterior.n+1:1};if(e.salto.n<3)return false;
      }}
    e.salto=null;e.vis=t;e.raw=g;e.marca={id:mk.id,corners:mk.corners.map(p=>({...p}))};
    if(e.tela)perspectiva();
    if(!e.filtros)e.filtros=g.cantos.flatMap(p=>[new Euro(p.x,t),new Euro(p.y,t)]);
    e.alvo=g.cantos.map((p,i)=>({x:e.filtros[i*2].filtrar(p.x,t),y:e.filtros[i*2+1].filtrar(p.y,t)}));
    if(!e.cantos)e.cantos=e.alvo.map(p=>({...p}));
    e.el.style.visibility='';return true;
  }
  function desenhar(t=performance.now()){
    const e=estado;if(!e)return;const perdido=t-e.vis;
    e.hud.querySelector('.qar-status').hidden=perdido<=400;e.hud.querySelector('.qar-tela').hidden=perdido<=4000;
    if(e.tela||!e.cantos)return;e.el.style.opacity=perdido>400?'.85':'1';
    // A pose filtrada é o alvo; o DOM avança em todo rAF, mesmo com o detector ocupado.
    const dt=Math.max(0,Math.min(50,t-(e.desenho??t)));e.desenho=t;
    if(perdido<=400&&e.alvo&&e.cantos.some((p,i)=>Math.hypot(e.alvo[i].x-p.x,e.alvo[i].y-p.y)>.02)){
      const a=1-Math.exp(-dt/45);e.cantos=e.cantos.map((p,i)=>({x:p.x+(e.alvo[i].x-p.x)*a,y:p.y+(e.alvo[i].y-p.y)*a}))}
    let cantos=e.cantos;const s=Math.min(1,Math.max(.001,(t-e.inicio)/350));
    if(s<1){const m=homografia(cantos),ax=.5,ay=(-TOPO+.5)/(QUADRO_ESCALA*4/3),k=1-Math.pow(1-s,3);
      cantos=[[0,0],[1,0],[1,1],[0,1]].map(([x,y])=>ponto(m,ax+(x-ax)*k,ay+(y-ay)*k))}
    const m=homografia(cantos);if(!m)return;
    e.el.style.transform=`matrix3d(${[m[0]/W,m[3]/W,0,m[6]/W,m[1]/H,m[4]/H,0,m[7]/H,0,0,1,0,m[2],m[5],0,1].join(',')})`;
  }
  function ganhou(){if(estado&&!estado.tela)estado.itens[2].hidden=false}
  function limpar(){if(!estado)return;const e=estado;estado=null;e.itens.forEach((b,i)=>{b.hidden=false;e.casas[i].append(b)});e.hud.remove();e.el.classList.remove('ar');e.el.removeAttribute('aria-owns');for(const p of ['transform','opacity','visibility'])e.el.style[p]='';e.el.querySelector('.q-placa')?.remove()}
  return {montar,atualizar,desenhar,ganhou,limpar,geometria,homografia,ponto,convexa,
    get ativo(){return !!estado},get id(){return estado?.id},get rastreio(){return estado?.marca},get cantos(){return estado?.cantos}};
})();
