const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {PDFDocument}=require('pdf-lib');
let chromium;try{({chromium}=require('playwright'))}catch{if(!process.env.PLAYWRIGHT_MODULE)throw new Error('Install playwright as documented in audit/AUDIT.md, or set PLAYWRIGHT_MODULE.');({chromium}=require(process.env.PLAYWRIGHT_MODULE))}
(async()=>{
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:0}});await server.listen();
 const url=server.resolvedUrls.local[0];let browser;
 const report=[];const check=(name,value)=>{assert.ok(value,name);report.push(name);console.log('PASS',name)};
 try{
 browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'}),args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.locator('canvas').waitFor();
 const doc=await PDFDocument.create();doc.addPage([300,400]);doc.addPage([500,600]);const pdfBytes=Array.from(await doc.save());
 const result=await page.evaluate(async bytes=>{
  const {TOOLS,validate,validateOptions,stats,CASES}=await import('/src/tools.js');
  const f=new File([new Uint8Array(bytes)],'sample.pdf',{type:'application/pdf',lastModified:1});
  const tool=id=>TOOLS.find(t=>t.id===id);const tests=[];const outputs=[];
  const ok=(n,v)=>{if(!v)throw new Error(n);tests.push(n)};
  const rejects=async(n,fn)=>{let thrown=false;try{await fn()}catch{thrown=true}ok(n,thrown)};
  const run=async(id,files,opts={})=>{const t=tool(id),o={...Object.fromEntries((t.opts||[]).map(f=>[f.k,f.def])),...opts};return t.run(files,o,()=>{})};
  const collect=async(name,rs)=>{for(const r of rs)outputs.push({test:name,name:r.name,type:r.blob.type,bytes:Array.from(new Uint8Array(await r.blob.arrayBuffer()))})};
  await collect('merge',await run('merge',[f,new File([f],'other.pdf',{type:f.type})]));
  await collect('split-one',await run('split',[f],{r:'2,1',m:'one'}));
  await collect('split-each',await run('split',[f],{r:'1-2',m:'each'}));
  await rejects('Reject single-PDF merge',()=>run('merge',[f]));
  for(const r of ['','0','3','2-1','abc','1-99999'])await rejects('Reject invalid range '+JSON.stringify(r),()=>run('split',[f],{r}));
  await rejects('Reject corrupted PDF',()=>run('split',[new File(['%PDF-1.7 invalid'],'bad.pdf',{type:'application/pdf'})]));
  ok('Reject empty files',!!validate([new File([],'empty.pdf',{type:f.type})],tool('split')));
  ok('Reject duplicate selection',!!validate([f,f],tool('merge')));
  ok('Reject unsupported extension',!!validate([new File(['x'],'bad.txt',{type:'text/plain'})],tool('split')));
  ok('Reject MIME mismatch',!!validate([new File(['x'],'bad.pdf',{type:'image/png'})],tool('split')));
  ok('Reject oversized file',!!validate([{name:'large.pdf',type:f.type,size:51*1024*1024}],tool('split')));
  ok('Reject excessive batch count',!!validate(Array.from({length:31},(_,i)=>({name:i+'.pdf',type:f.type,size:1})),tool('merge')));
  ok('Reject excessive batch size',!!validate(Array.from({length:4},(_,i)=>({name:i+'.pdf',type:f.type,size:40*1024*1024})),tool('merge')));
  ok('Reject invalid width',!!validateOptions(tool('resize'),{w:0}));
  ok('Reject invalid output format',!!validateOptions(tool('convert'),{t:'text/html'}));
  const c=document.createElement('canvas');c.width=200;c.height=100;const g=c.getContext('2d');g.fillStyle='#0C969C';g.fillRect(0,0,200,100);
  const imgs=[];
  for(const [mime,ext] of [['image/png','png'],['image/jpeg','jpg'],['image/webp','webp']]){const b=await new Promise(r=>c.toBlob(r,mime));imgs.push(new File([b],'sample.'+ext,{type:mime}))}
  await collect('images-pdf',await run('jpg2pdf',imgs));
  for(const f of imgs){
   for(const id of ['compress','resize','convert']){const rs=await run(id,[f],id==='resize'?{w:80}:{});const b=await createImageBitmap(rs[0].blob);ok(id+' '+f.type+' decodes',b.width===(id==='resize'?80:200)&&b.height===(id==='resize'?40:100));b.close();await collect(id,rs)}
  }
  for(const t of ['image/jpeg','image/png','image/webp']){const [r]=await run('convert',[imgs[0]],{t});ok('Output MIME '+t,r.blob.type===t)}
  await rejects('Reject corrupt image',()=>run('compress',[new File(['not an image'],'broken.png',{type:'image/png'})]));
  await rejects('Reject misleading image header',()=>run('convert',[new File([new Uint8Array([137,80,78,71,13,10,26,10,0])],'broken.png',{type:'image/png'})]));
  await run('resize',[new File([imgs[0]],'no-mime.png')]);tests.push('Accept supported extension with missing MIME');
  ok('Word count',stats('Hello world. Another sentence').find(([k])=>k==='Words')[1]===4);
  ok('Final sentence without punctuation counted',stats('Hello world. Another sentence').find(([k])=>k==='Sentences')[1]===2);
  const expected={UPPER:'HELLO WORLD',lower:'hello world',Title:'Hello World',Sentence:'Hello world',camelCase:'helloWorld',snake_case:'hello_world','kebab-case':'hello-world'};
  for(const [name,fn] of Object.entries(CASES))ok('Case '+name,fn('hello world')===expected[name]);
  ok('Input PDF unchanged',f.size===bytes.length&&new Uint8Array(await f.arrayBuffer()).every((v,i)=>v===bytes[i]));
  return {tests,outputs};
 },pdfBytes);
 result.tests.forEach(t=>check(t,true));
 await fs.mkdir('audit/samples',{recursive:true});
 for(const [i,out] of result.outputs.entries()){
  check('Output nonempty '+out.test,out.bytes.length>0);
  if(out.type==='application/pdf'){const d=await PDFDocument.load(Uint8Array.from(out.bytes));const n=out.test==='merge'?4:out.test==='images-pdf'?3:out.test==='split-each'?1:2;check('PDF page count '+out.test,d.getPageCount()===n)}
  await fs.writeFile(path.join('audit/samples',`${i}-${out.name}`),Buffer.from(out.bytes));
 }
 // Theme panel persistence, focus, and canvas identity.
 await page.evaluate(()=>{window.originalCanvas=document.querySelector('canvas')});
 const palette=page.getByRole('button',{name:'Change colors',exact:true});await palette.click();await page.getByRole('button',{name:'Forest & Mint'}).click();
 check('Theme selection stays open',await page.getByRole('dialog',{name:'Color palette'}).isVisible());
 check('Canvas survives palette update',await page.evaluate(()=>window.originalCanvas===document.querySelector('canvas')));
 await page.keyboard.press('Escape');check('Escape restores palette focus',await palette.evaluate(el=>el===document.activeElement));
 await palette.click();await page.locator('h1').click();check('Outside click closes palette',await page.getByRole('dialog',{name:'Color palette'}).count()===0);
 await page.reload();check('Palette persists',await page.evaluate(()=>JSON.parse(localStorage.palette).dark==='#0B1512'));
 await palette.click();await page.getByRole('button',{name:'Reset to default'}).click();await page.getByRole('button',{name:'Close color palette'}).click();
 await page.getByRole('button',{name:'Switch to light theme'}).click();check('Light theme applies',await page.evaluate(()=>!document.documentElement.classList.contains('dark')));
 await page.reload();check('Light theme persists',await page.evaluate(()=>!document.documentElement.classList.contains('dark')));
 await page.getByRole('button',{name:'Switch to dark theme'}).click();
 // Upload validation and workspace behavior.
 await page.locator('input[type=file]').first().setInputFiles({name:'empty.pdf',mimeType:'application/pdf',buffer:Buffer.alloc(0)});
 check('Homepage reports invalid upload',await page.getByRole('alert').filter({hasText:'empty'}).count()===1);
 await page.evaluate(()=>{window.createdURLs=[];window.revokedURLs=[];const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);URL.createObjectURL=b=>{const u=create(b);window.createdURLs.push(u);return u};URL.revokeObjectURL=u=>{window.revokedURLs.push(u);return revoke(u)}});
 const opener=page.locator('#tools li').getByRole('button',{name:/^Split a PDF/});await opener.click();
 const dialog=page.getByRole('dialog',{name:'Split a PDF',exact:true});await dialog.waitFor();
 await page.mouse.click(5,300);check('Backdrop does not dismiss workspace',await dialog.isVisible());
 check('Background scroll locked',await page.evaluate(()=>document.body.style.overflow==='hidden'));
 await dialog.locator('input[type=file]').setInputFiles({name:'sample.pdf',mimeType:'application/pdf',buffer:Buffer.from(pdfBytes)});
 await page.evaluate(async()=>{const {TOOLS}=await import('/src/tools.js');const t=TOOLS.find(t=>t.id==='split'),run=t.run;window.runCount=0;t.run=async(...args)=>{window.runCount++;await new Promise(r=>setTimeout(r,1000));return run(...args)}});
 await dialog.getByRole('button',{name:'Run',exact:true}).evaluate(el=>{el.click();el.click()});await dialog.getByRole('button',{name:'Close',exact:true}).click();check('Busy close is blocked',await dialog.isVisible());await dialog.getByRole('link',{name:'Download'}).waitFor();
 check('Rapid clicks run processing once',await page.evaluate(()=>window.runCount===1));
 const download=page.waitForEvent('download');await dialog.getByRole('link',{name:'Download'}).click();const dl=await download;check('Download filename',dl.suggestedFilename()==='sample-pages.pdf');
 await dl.saveAs('audit/samples/downloaded-pages.pdf');check('Downloaded PDF opens',(await PDFDocument.load(await fs.readFile('audit/samples/downloaded-pages.pdf'))).getPageCount()===1);
 let confirm=false;page.once('dialog',async d=>{confirm=true;await d.dismiss()});await page.keyboard.press('Escape');check('Dirty close asks confirmation',confirm&&await dialog.isVisible());
 page.once('dialog',d=>d.accept());await dialog.getByRole('button',{name:'Close',exact:true}).click();await dialog.waitFor({state:'hidden'});
 check('Focus returns to opener',await opener.evaluate(el=>el===document.activeElement));check('Result URLs revoked on close',await page.evaluate(()=>window.createdURLs.length>0&&window.createdURLs.every(u=>window.revokedURLs.includes(u))));check('Scroll lock released',await page.evaluate(()=>document.body.style.overflow!== 'hidden'));
 // Narrow portrait, landscape, and tablet layouts.
 for(const [width,height] of [[320,720],[375,812],[390,844],[430,932],[844,390],[768,1024],[1440,900]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(200);
  check('No overflow '+width+'x'+height,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await palette.click();check('Palette fits '+width+'x'+height,await page.locator('#palette-panel').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}));await page.keyboard.press('Escape');
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(200);
 check('Reduced motion keeps document canvas',await page.locator('canvas').count()===1);
 await page.screenshot({path:'audit/mobile-hero.png'});
 await page.evaluate(()=>document.querySelector('canvas').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
 await page.locator('.hero-fallback').waitFor();check('Context loss displays matching stack fallback',await page.locator('.hero-fallback .paper-front').count()===1);
 await page.screenshot({path:'audit/mobile-fallback.png'});
 const noGL=await browser.newPage();await noGL.addInitScript(()=>{window.WebGLRenderingContext=undefined});await noGL.goto(url);check('Unsupported WebGL fallback',await noGL.locator('.hero-fallback').count()===1);await noGL.close();
 check('No React/browser runtime errors',errors.length===0);
 await fs.writeFile('audit/test-results.json',JSON.stringify({date:new Date().toISOString(),checks:report.length,passed:report,errors},null,2));
 console.log(`ALL ${report.length} CHECKS PASSED`);
 }finally{await browser?.close();await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
