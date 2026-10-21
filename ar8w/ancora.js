/* Âncora no mundo: segue a placa enquanto vista, fica parada quando some (o SLAM move a câmera). Sem dependências: testável sem câmera. */
// Trava: depois de estável, ignora leituras ruidosas da placa (câmera saindo/borrada) e confia no SLAM;
// só volta a seguir se a placa ficar fora do lugar por um tempo (placa mexida ou erro real).
export function criarAncora({tau=0.12, tauLonge=0.35, estavelPara=0.5, tolera=0.08, toleraAng=0.12, foraPor=0.6}={}){
  let atual=null, alvo=null, visto=false, achou=0, travado=false, estavel=0, fora=0;
  const ang=(a,b)=>2*Math.acos(Math.min(1,Math.abs(a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3])));
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
  const nlerp=(a,b,t)=>{let d=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3],s=d<0?-1:1;
    const r=a.map((v,i)=>v+(s*b[i]-v)*t),n=Math.hypot(...r)||1;return r.map(v=>v/n)};
  const copia=p=>({p:[...p.p],q:[...p.q],s:p.s});
  function pose(d){return {p:[d.position.x,d.position.y,d.position.z],q:[d.rotation.x,d.rotation.y,d.rotation.z,d.rotation.w],s:d.scale}}
  return {
    found(d){visto=true;achou++;alvo=pose(d);if(!atual)atual=copia(alvo)},
    updated(d){visto=true;alvo=pose(d);if(!atual)atual=copia(alvo)},
    lost(){visto=false;alvo=null;fora=0},
    passo(dt){ // dt em segundos; retorna a pose suavizada (ou null antes da 1ª leitura)
      if(!atual||!alvo)return atual;
      const d=dist(atual.p,alvo.p),a=ang(atual.q,alvo.q);
      if(travado){
        if(d>alvo.s*tolera||a>toleraAng)fora+=dt;else fora=0;
        if(fora<foraPor)return atual;
        travado=false;estavel=0;fora=0;
      }
      estavel=d<alvo.s*0.02&&a<0.03?estavel+dt:0;
      if(estavel>=estavelPara)travado=true;
      // Salto grande (reencontro com erro acumulado do SLAM) desliza mais devagar, sem pulo.
      const t=1-Math.exp(-dt/(dist(atual.p,alvo.p)>alvo.s*0.25?tauLonge:tau));
      atual.p=atual.p.map((v,i)=>v+(alvo.p[i]-v)*t);atual.q=nlerp(atual.q,alvo.q,t);atual.s+=(alvo.s-atual.s)*t;
      return atual},
    get visto(){return visto}, get travado(){return travado}, get achou(){return achou}, get pose(){return atual}
  };
}
