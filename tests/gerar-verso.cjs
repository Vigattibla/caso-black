/* Regenera a arte PLANAR, luminância, metadados e a folha A4 de impressão. */
const fs = require('fs'), path = require('path'), http = require('http');
const {chromium} = require('../landing-src/node_modules/playwright');
const ROOT = path.resolve(__dirname, '..');
async function main() {
  const server = http.createServer((q,r) => { const f = path.resolve(ROOT, '.' + decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT + path.sep)) {r.writeHead(403); return r.end();} fs.readFile(f,(e,b)=>{r.writeHead(e?404:200, {'Content-Type':({'.html':'text/html','.js':'application/javascript','.png':'image/png','.webp':'image/webp','.woff':'font/woff'})[path.extname(f)]||'application/octet-stream'});r.end(e?'':b)}); });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser = await chromium.launch({headless:true, executablePath:process.env.AR_CHROME || 'C:/Users/Vigatti/AppData/Local/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-win64/chrome-headless-shell.exe'});
  try {
    const page = await browser.newPage({viewport:{width:1200,height:1600}});
    await page.goto(`http://127.0.0.1:${server.address().port}/ar8w/verso-teste.html`);
    const result = await page.evaluate(async () => {
      const {MOLDURA,DENTES,HASTE,ARGOLA} = await import('./chave/layout.js');
      for (const [name,file] of [['Anton','anton'],['Courier Prime','courier-400'],['Montserrat','mont-600']]) { const f = new FontFace(name,`url(/assets/fonts/${file}.woff)`); document.fonts.add(await f.load()); }
      const img = await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src='/assets/lucas-detetive.webp';});
            const c=document.createElement('canvas'); c.width=1200;c.height=1600;const x=c.getContext('2d');
      const rect=(a,b,w,h,r,fill,stroke)=>{x.beginPath();x.roundRect(a,b,w,h,r);if(fill){x.fillStyle=fill;x.fill()}if(stroke){x.strokeStyle=stroke;x.stroke()}};
      const text=(s,a,b,font,color)=>{x.font=font;x.fillStyle=color;x.fillText(s,a,b)};
      x.fillStyle='#fffdf6';x.fillRect(0,0,1200,1600);
      x.fillStyle='#fdc72f';x.fillRect(0,0,1200,140);
      text('CASO BLACK',64,99,'76px Anton','#16140f'); text('KIT DO DETETIVE',774,91,'23px Courier Prime','#16140f');
      rect(44,174,1112,748,30,'#fffefa','#ded9cc');
      text('IDEIAS QUE VIRAM FERRAMENTAS',78,231,'31px Anton','#16140f');
      text('Desenhe. Leia com a câmera. Leve na mochila.',78,270,'21px Courier Prime','#777368');
      x.fillStyle='#d8d4c9';for(let a=78;a<1140;a+=26)for(let b=304;b<904;b+=26){x.beginPath();x.arc(a,b,1.3,0,Math.PI*2);x.fill()}
      // Guias delicadas: cantoneiras de visor na moldura, contorno fino da chave e cantinhos nos dentes.
      const canto=(a,b,c,d,L)=>{x.beginPath();x.moveTo(a+c*L,b);x.lineTo(a,b);x.lineTo(a,b+d*L);x.stroke()};
      const cantos=(r,L)=>{canto(r.x0,r.y0,1,1,L);canto(r.x1,r.y0,-1,1,L);canto(r.x0,r.y1,1,-1,L);canto(r.x1,r.y1,-1,-1,L)};
      x.lineCap='round';x.strokeStyle='#bdb6a6';x.lineWidth=3;cantos(MOLDURA,34);
      x.strokeStyle='#d3cdbf';x.lineWidth=1.5;x.setLineDash([3,8]);
      x.beginPath();x.arc(ARGOLA.x,ARGOLA.y,ARGOLA.r,0,Math.PI*2);x.stroke();
      x.beginPath();x.moveTo(HASTE.x0,HASTE.y0);x.lineTo(HASTE.x1,HASTE.y0);x.lineTo(HASTE.x1,HASTE.y1);x.lineTo(HASTE.x0,HASTE.y1);x.stroke();x.setLineDash([]);
      x.strokeStyle='#d3cdbf';x.lineWidth=1.5;for(const d of DENTES)for(const r of [d.cima,d.baixo])cantos(r,12);
      x.lineCap='butt';
      // Parte de baixo livre para a criança escrever; só o Lucas no canto direito.
      const h=540,w=img.width*h/img.height;x.drawImage(img,1150-w,1555-h,w,h);
      text('2026-BF',49,1584,'18px Courier Prime','#777368');text('TURMA DO BÊ',1008,1584,'18px Courier Prime','#777368');
      const png=c.toDataURL('image/png');const raw=x.getImageData(0,0,1200,1600);for(let i=0;i<raw.data.length;i+=4){const l=Math.round(.299*raw.data[i]+.587*raw.data[i+1]+.114*raw.data[i+2]);raw.data[i]=raw.data[i+1]=raw.data[i+2]=l}x.putImageData(raw,0,0);
      return {png,luminance:c.toDataURL('image/png')};
    });
    for(const [key,suffix] of [['png',''],['luminance','_luminance']])fs.writeFileSync(path.join(ROOT,`ar8w/alvos/verso-teste${suffix}.png`),Buffer.from(result[key].split(',')[1],'base64'));
    const jp=path.join(ROOT,'ar8w/alvos/verso-teste.json'),json=JSON.parse(fs.readFileSync(jp));json.name='verso';json.updated=Date.now();json.resources={originalImage:'verso-teste.png',croppedImage:'verso-teste.png',thumbnailImage:'verso-teste.png',luminanceImage:'verso-teste_luminance.png'};fs.writeFileSync(jp,JSON.stringify(json,null,2)+'\n');
    // 300 dpi A4 raster; centered 2160 × 2880 px art, without cropping.
    const a4=await page.evaluate(async png=>{const i=new Image();i.src=png;await i.decode();const c=document.createElement('canvas');c.width=2480;c.height=3508;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,c.width,c.height);x.drawImage(i,160,314,2160,2880);return c.toDataURL('image/png')},result.png);
    fs.mkdirSync(path.join(ROOT,'tmp/pdfs'),{recursive:true});fs.writeFileSync(path.join(ROOT,'tmp/pdfs/verso-chave-A4-300dpi.png'),Buffer.from(a4.split(',')[1],'base64'));
    console.log('Arte e alvo verso regenerados; A4 raster 2480 × 3508 em tmp/pdfs.');
  } finally {await browser.close();server.close()}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1});
