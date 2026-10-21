/* Injected before page scripts. Only the silent canvas stream may autoplay. */
HTMLMediaElement.prototype.play=function(){this.muted=true;return Promise.reject(new DOMException('Media bloqueada no teste','NotAllowedError'))};
for(const C of [window.AudioContext,window.webkitAudioContext])if(C)C.prototype.resume=()=>Promise.resolve();
window.CB_CONFIG={backend:'local'};
Object.keys(localStorage).filter(k=>k.startsWith('cb')).forEach(k=>localStorage.removeItem(k));
localStorage.setItem('cb-ficha',JSON.stringify({id:'00000000-0000-4000-8000-000000000001',nome:'Teste AR',contato:'teste@example.invalid',tipo:'email',carimbos:[],resolvido:false,em:'2026-10-21T12:00:00Z'}));
window.__fake={id:300,hidden:false,moving:true,pose:0,frames:0,wide:false};
Object.defineProperty(navigator.mediaDevices,'getUserMedia',{configurable:true,value:async()=>{
  const f=window.__fake,c=document.createElement('canvas');c.width=f.wide?1280:780;c.height=f.wide?720:1688;
  c.style='position:fixed;left:-10px;top:-10px;width:1px;height:1px;pointer-events:none';document.body.append(c);
  const x=c.getContext('2d'),wall=document.createElement('canvas');wall.width=c.width;wall.height=c.height;const w=wall.getContext('2d');
  w.fillStyle='#c7c1b2';w.fillRect(0,0,c.width,c.height);
  let seed=17;for(let i=0;i<10000;i++){seed=(seed*1664525+1013904223)>>>0;const a=seed%c.width;seed=(seed*1664525+1013904223)>>>0;const b=seed%c.height;w.fillStyle=i%2?'#ffffff14':'#594b3a12';w.fillRect(a,b,2,2)}
  w.strokeStyle='#a19a8b44';w.lineWidth=2;for(let y=130;y<c.height;y+=260){w.beginPath();w.moveTo(0,y);w.lineTo(c.width,y);w.stroke()}
  let lastId=-1,rects=[],t0=performance.now();
  f.project=(u,v,t=performance.now())=>{
    const time=f.moving?(t-t0)/1000:0,pose=f.pose,side=(f.side??62)*(1+pose*.075+.025*Math.sin(time*.4));
    const ang=.025+pose*.035+.025*Math.sin(time*.35),cx=(f.cx??195)+pose*10+9*Math.sin(time*.45),cy=(f.cy??104)+pose*13+6*Math.sin(time*.3);
    const z=1+.012*(u-.5)+(.008+pose*.003)*(v-.5),px=(u-.5)*side/z,py=(v-.5)*side/z;
    const screen={x:cx+px*Math.cos(ang)-py*Math.sin(ang),y:cy+px*Math.sin(ang)+py*Math.cos(ang)};
    const cover=Math.max(390/c.width,844/c.height);return {x:(screen.x-(390-c.width*cover)/2)/cover,y:(screen.y-(844-c.height*cover)/2)/cover};
  };
  function draw(){
    x.drawImage(wall,0,0);if(!f.hidden){if(lastId!==f.id){lastId=f.id;const doc=new DOMParser().parseFromString(Placa.svg(f.id),'image/svg+xml');rects=[...doc.querySelectorAll('rect')].map(r=>({a:(+r.getAttribute('x')-1)/6,b:(+r.getAttribute('y')-1)/6,w:+r.getAttribute('width')/6,h:+r.getAttribute('height')/6,fill:r.getAttribute('fill')}))}
      for(const r of rects){x.fillStyle=r.fill;x.beginPath();[[r.a,r.b],[r.a+r.w,r.b],[r.a+r.w,r.b+r.h],[r.a,r.b+r.h]].forEach(([u,v],i)=>{const p=f.project(u,v);i?x.lineTo(p.x,p.y):x.moveTo(p.x,p.y)});x.closePath();x.fill()}}
    f.frames++;
  }
  draw();const stream=c.captureStream(30),iv=setInterval(draw,1000/30),track=stream.getVideoTracks()[0],stop=track.stop.bind(track);track.stop=()=>{clearInterval(iv);c.remove();stop()};track.addEventListener('ended',()=>{clearInterval(iv);c.remove()});f.canvas=c;f.stream=stream;
  return stream;
}});
