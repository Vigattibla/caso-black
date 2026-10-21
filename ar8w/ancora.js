/* Âncora no mundo: segue a placa enquanto vista, fica parada quando some (o SLAM move a câmera). Sem dependências: testável sem câmera. */
export function criarAncora({tau=0.12, tauLonge=0.35}={}){
  let atual=null, alvo=null, visto=false, achou=0;
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
  const nlerp=(a,b,t)=>{let d=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3],s=d<0?-1:1;
    const r=a.map((v,i)=>v+(s*b[i]-v)*t),n=Math.hypot(...r)||1;return r.map(v=>v/n)};
  const copia=p=>({p:[...p.p],q:[...p.q],s:p.s});
  function pose(d){return {p:[d.position.x,d.position.y,d.position.z],q:[d.rotation.x,d.rotation.y,d.rotation.z,d.rotation.w],s:d.scale}}
  return {
    found(d){visto=true;achou++;alvo=pose(d);if(!atual)atual=copia(alvo)},
    updated(d){visto=true;alvo=pose(d);if(!atual)atual=copia(alvo)},
    lost(){visto=false;alvo=null},
    passo(dt){ // dt em segundos; retorna a pose suavizada (ou null antes da 1ª leitura)
      if(!atual||!alvo)return atual;
      // Salto grande (reencontro com erro acumulado do SLAM) desliza mais devagar, sem pulo.
      const t=1-Math.exp(-dt/(dist(atual.p,alvo.p)>alvo.s*0.25?tauLonge:tau));
      atual.p=atual.p.map((v,i)=>v+(alvo.p[i]-v)*t);atual.q=nlerp(atual.q,alvo.q,t);atual.s+=(alvo.s-atual.s)*t;
      return atual},
    get visto(){return visto}, get achou(){return achou}, get pose(){return atual}
  };
}
