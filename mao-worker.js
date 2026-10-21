/* Worker clássico: o carregador WASM do MediaPipe usa importScripts. */
let modelo=null,cpu=false;
function gpuSoftware(){let gl;
  try{gl=new OffscreenCanvas(1,1).getContext('webgl2');if(!gl)return true;
    const ext=gl.getExtension('WEBGL_debug_renderer_info'),nome=gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER);
    return /swiftshader|llvmpipe|software/i.test(nome);
  }catch(_){return true}finally{gl?.getExtension('WEBGL_lose_context')?.loseContext()}
}
self.onmessage=async({data})=>{
  if(data.tipo==='iniciar'){
    try{
      const {FilesetResolver,HandLandmarker}=await import('./vendor/mediapipe/vision_bundle.mjs');
      const fs=await FilesetResolver.forVisionTasks(new URL('vendor/mediapipe/wasm',self.location.href).href);
      const criar=delegate=>HandLandmarker.createFromOptions(fs,{baseOptions:{
        modelAssetPath:new URL('vendor/mediapipe/hand_landmarker.task',self.location.href).href,delegate
      },runningMode:'VIDEO',numHands:1});
      cpu=!!data.cpu||gpuSoftware();
      try{modelo=await criar(cpu?'CPU':'GPU')}catch(e){if(cpu)throw e;cpu=true;modelo=await criar('CPU')}
      // GPU por software pode disputar o compositor e travar até outro worker.
      // Aquece e compara dois passes antes de liberar a câmera para a mão.
      if(!cpu){let lenta=false;
        try{const probe=new OffscreenCanvas(1280,720);probe.getContext('2d').fillRect(0,0,1280,720);
          modelo.detectForVideo(probe,0);const custos=[];
          for(let t=1;t<=2;t++){const inicio=performance.now();modelo.detectForVideo(probe,t);custos.push(performance.now()-inicio)}
          lenta=Math.min(...custos)>40;
        }catch(_){lenta=true}
        if(lenta){modelo.close();modelo=await criar('CPU');cpu=true}
      }
      self.postMessage({pronto:true,cpu});
    }catch(e){self.postMessage({erro:e.message})}
    return;
  }
  if(data.tipo!=='quadro')return;
  const {t}=data,inicio=performance.now();let bitmap=data.bitmap;
  try{if(data.frame)bitmap=await createImageBitmap(data.frame);
    const landmarks=modelo.detectForVideo(bitmap,t).landmarks[0]||null;
    self.postMessage({landmarks,t,ms:performance.now()-inicio});
  }catch(e){self.postMessage({erro:e.message})}
  finally{bitmap?.close();data.frame?.close()}
};
