/* Só pixels e detecção: nenhuma leitura de canvas na thread da interface. */
importScripts('vendor/cv.js','vendor/aruco.js','vendor/aruco_4x4_1000.js');
const canvas=new OffscreenCanvas(1,1),cx=canvas.getContext('2d',{willReadFrequently:true});
if(!cx)throw Error('OffscreenCanvas 2D indisponível');
const detector=new AR.Detector({dictionaryName:'ARUCO_4X4_1000',maxHammingDistance:1});
// O vendor compara distance < tau; 2 inclui exatamente um bit de erro.
detector.dictionary.tau=2;
self.onmessage=async({data})=>{
  const {regiao,id,resizeWidth,resizeHeight,frame}=data;let bitmap=data.bitmap;
  try{
    if(frame)bitmap=await createImageBitmap(frame,regiao.sx,regiao.sy,regiao.sw,regiao.sh);
    if(canvas.width!==resizeWidth||canvas.height!==resizeHeight){canvas.width=resizeWidth;canvas.height=resizeHeight}
    cx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const lidas=detector.detect(cx.getImageData(0,0,canvas.width,canvas.height)).filter(m=>m.id>=300&&m.id<=311);
    const exatos=lidas.filter(m=>!m.hammingDistance);
    const marcas=(exatos.length?exatos:lidas.filter(m=>m.id<305&&m.hammingDistance<=1)).map(m=>({
      id:m.id,hammingDistance:m.hammingDistance,
      corners:m.corners.map(p=>({x:p.x*regiao.sw/canvas.width+regiao.sx,y:p.y*regiao.sh/canvas.height+regiao.sy}))
    }));
    self.postMessage({id,marcas});
  }catch(e){self.postMessage({id,erro:e.message})}
  finally{bitmap?.close();frame?.close()}
};
self.postMessage({pronto:true});
