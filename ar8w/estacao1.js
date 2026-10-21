/* Estação 1 (Piscina · Pegadas molhadas) como DOM 600x800 (3:4, igual à placa). Arte e regras copiadas de quadro.js. */
const svg=(b,v='0 0 92 70')=>`<svg viewBox="${v}" aria-hidden="true">${b}</svg>`;
const sola='<path d="M46 4 C64 4 66 30 62 48 C58 66 34 66 30 48 C26 30 28 4 46 4Z"/>';
const marcas={estrela:'<path d="M46 14 l3 7 7 .5 -5.5 4.5 2 7 -6.5-4 -6.5 4 2-7 -5.5-4.5 7-.5z"/>',
  chinelo:'<path d="M34 26 L46 16 L58 26" fill="none" stroke="currentColor" stroke-width="4"/>',
  crocs:'<circle cx="40" cy="16" r="3"/><circle cx="52" cy="16" r="3"/><circle cx="38" cy="28" r="3"/><circle cx="54" cy="28" r="3"/><circle cx="46" cy="22" r="3"/><circle cx="46" cy="34" r="3"/>'};
const arte=(t,peg)=>svg(`<g fill="${peg?'#2f7fb8':t==='chinelo'?'#c8102e':t==='estrela'?'#3a2a1a':'#e2ddd1'}">${sola}</g><g fill="${peg?'#e9eef2':t==='estrela'?'#fdc72f':'#111'}" color="${peg?'#e9eef2':'#111'}">${marcas[t]}</g>`);
const tacha='<i class="e1-tacha"></i>';

export const CSS=`
.e1{width:600px;height:800px;box-sizing:border-box;padding:26px;display:flex;flex-direction:column;gap:18px;color:#111;font-family:Montserrat,sans-serif;
  background:#B88A57 url(../assets/ruido.webp);background-image:url(../assets/ruido.webp),radial-gradient(circle at 30% 20%,#c79a66,transparent 60%),radial-gradient(circle at 80% 90%,#9e7244,transparent 55%);
  border:10px solid #3a2414;box-shadow:0 30px 60px #0008;position:relative;user-select:none;-webkit-user-select:none}
.e1 *{box-sizing:border-box}.e1 button{font:inherit;cursor:pointer;color:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.e1-rec{position:relative;background:#F4F1EA;border:4px solid #fff;box-shadow:0 2px 0 #0003,0 8px 14px #0004}
.e1-tacha{position:absolute;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ff6b6b,#c8102e 60%,#7a0716);box-shadow:0 2px 3px #0007;left:50%;top:-8px;margin-left:-7px;z-index:3;pointer-events:none}
.e1-ficha{padding:14px 16px 14px 130px;min-height:120px;flex:none}.e1-ficha img{position:absolute;left:10px;top:10px;width:106px;height:94px;object-fit:cover;border:3px solid #fff}
.e1-ficha small{font:700 13px 'Courier Prime',monospace;letter-spacing:.13em;color:#c8102e}.e1-ficha h2{margin:2px 0 0;font:400 34px/1.05 Anton,sans-serif;text-transform:uppercase}.e1-ficha p{margin:6px 0 0;font:600 16px/1.3 Montserrat,sans-serif}
.e1-jogo{position:relative;flex:1;min-height:0}.e1-fios{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4}.e1-fios line{stroke:#c8102e;stroke-width:5;stroke-linecap:round}
.e1-grade{height:100%;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr);column-gap:80px;row-gap:22px;padding:6px}
.e1-peca{display:flex;align-items:center;justify-content:center;flex-direction:column;padding:8px;min-width:0;font:700 22px/1.05 Caveat,cursive}
.e1-peca svg{width:120px;flex:1;min-height:0}.e1-peg{background:#e9eef2}.e1-peca small{position:absolute;left:8px;top:5px;font:700 16px 'Courier Prime',monospace}
.e1-sel{outline:5px solid #fdc72f;outline-offset:3px}.e1-ok{cursor:default}.e1-treme{animation:e1-treme .3s}@keyframes e1-treme{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
.e1-msg{flex:none;min-height:56px;background:#111;color:#fff;font:600 16px/1.3 Montserrat,sans-serif;padding:10px 14px}.e1-msg b{color:#fdc72f}
.e1-fim{position:absolute;inset:0;background:#0d0c0bd9;display:grid;place-items:center;padding:40px;z-index:6}.e1-fim[hidden]{display:none}
.e1-carimbo{text-align:center;padding:30px}.e1-st{border:6px solid #c8102e;color:#c8102e;font:400 40px/1.1 Anton,sans-serif;padding:10px;transform:rotate(-4deg)}
.e1-carimbo p{font:600 18px/1.4 Montserrat,sans-serif;margin:16px 0 0}`;

export function criarEstacao1({onGanhar}={}){
  const el=document.createElement('div');el.className='e1';
  const ps=['estrela','chinelo','crocs'],cs=['chinelo','estrela','crocs'],nomes={chinelo:'chinelo · salva-vidas',estrela:'sapato · dono ???',crocs:'babuche · chef'};
  el.innerHTML=`<div class="e1-rec e1-ficha">${tacha}<img src="../assets/cena-crime.webp" alt=""><small>ESTAÇÃO 1 · PISCINA</small><h2>Pegadas molhadas</h2><p>Três pegadas na borda da piscina. Ligue cada uma ao calçado do dono.</p></div>
  <div class="e1-jogo"><svg class="e1-fios"></svg><div class="e1-grade">${ps.map((p,i)=>`<button class="e1-rec e1-peca e1-peg" data-p="${p}" aria-label="Pegada ${'ABC'[i]}">${tacha}<small>${'ABC'[i]}</small>${arte(p,true)}</button><button class="e1-rec e1-peca" data-c="${cs[i]}" aria-label="${nomes[cs[i]]}">${tacha}${arte(cs[i],false)}<span>${nomes[cs[i]]}</span></button>`).join('')}</div></div>
  <div class="e1-msg"><b>Lucas:</b> <span>Toque numa pegada e depois no calçado do dono.</span></div>
  <div class="e1-fim" hidden><div class="e1-rec e1-carimbo">${tacha}<div class="e1-st">SALVA-VIDAS FORA</div><p>Prova: sola com estrela, dono desconhecido.</p></div></div>`;
  const msg=t=>el.querySelector('.e1-msg span').textContent=t;
  const jogo=el.querySelector('.e1-jogo'),fios=el.querySelector('.e1-fios');let sel=null,venceu=false;const pares=[];
  // Offsets locais (não getBoundingClientRect: o CSS3D aplica perspectiva).
  const local=n0=>{let x=n0.offsetWidth/2,y=4;for(let n=n0;n&&n!==jogo;n=n.offsetParent){x+=n.offsetLeft;y+=n.offsetTop}return[x,y]};
  const desenha=()=>{fios.setAttribute('viewBox',`0 0 ${jogo.clientWidth} ${jogo.clientHeight}`);fios.innerHTML=pares.map(([a,b])=>{const A=local(a),B=local(b);return`<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}"/>`}).join('')};
  const erro=c=>{c.classList.remove('e1-treme');void c.offsetWidth;c.classList.add('e1-treme');msg('A sola não bate. Compara o desenho de novo.');navigator.vibrate?.([20,30,20])};
  el.addEventListener('click',e=>{if(venceu)return;const p=e.target.closest('[data-p]'),c=e.target.closest('[data-c]');
    if(p&&!p.classList.contains('e1-ok')){sel?.classList.remove('e1-sel');sel=p;p.classList.add('e1-sel');msg('Agora toque no calçado do dono.')}
    if(c&&sel&&!c.classList.contains('e1-ok')){if(c.dataset.c!==sel.dataset.p)return erro(c);
      pares.push([sel,c]);sel.classList.replace('e1-sel','e1-ok');c.classList.add('e1-ok');sel=null;desenha();msg('Isso! A sola bate.');
      if(pares.length===3){venceu=true;navigator.vibrate?.(40);setTimeout(()=>{el.querySelector('.e1-fim').hidden=false;onGanhar?.()},700)}}});
  return el;
}
