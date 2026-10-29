import {PDFDocument} from 'pdf-lib'
export const MAX=50*1024*1024
export const CATS=['All','PDF','Image','Text','AI','Student']
export const fmt=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(1)+' MB'
const IMG=['image/jpeg','image/png','image/webp'],EXT={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}
const base=n=>n.replace(/\.[^.]+$/,'')
export const MAX_FILES=30,MAX_TOTAL=150*1024*1024
const EXTENSIONS={'application/pdf':['pdf'],'image/jpeg':['jpg','jpeg'],'image/png':['png'],'image/webp':['webp']}
export const fileType=f=>Object.keys(EXTENSIONS).find(t=>EXTENSIONS[t].includes(f.name.split('.').pop().toLowerCase()))||''
export const validate=(fs,t)=>{
 if(!fs.length)return 'Choose at least one file.'
 if(fs.length>(t.multi?MAX_FILES:1))return `Choose at most ${t.multi?MAX_FILES:1} file(s).`
 if(fs.reduce((n,f)=>n+f.size,0)>MAX_TOTAL)return 'Choose a batch smaller than 150 MB.'
 const seen=new Set()
 for(const f of fs){const type=fileType(f),key=[f.name,f.size,f.lastModified].join(':')
  if(!t.accept.includes(type)||(f.type&&f.type!=='application/octet-stream'&&f.type!==type))return `${f.name} isn’t supported here. This tool takes ${t.kind}. Check its extension and file type.`
  if(!f.size)return `${f.name} is empty. Choose a file with content.`
  if(f.size>MAX)return `${f.name} is ${fmt(f.size)}, over the ${fmt(MAX)} limit. Try a smaller file.`
  if(seen.has(key))return `${f.name} is already selected. Remove the duplicate.`
  seen.add(key)
 }return ''
}
export function validateOptions(tool,o){
 for(const f of tool.opts||[]){const v=o[f.k]
  if(['number','range'].includes(f.type)&&(!Number.isInteger(+v)||+v<f.min||+v>f.max))return `${f.label} must be a whole number between ${f.min} and ${f.max}.`
  if(f.type==='select'&&!f.options.some(([x])=>x===v))return `Choose a valid ${f.label.toLowerCase()}.`
 }return ''
}
const enc=(c,t,q)=>new Promise((ok,no)=>c.toBlob(b=>b&&b.type===t?ok(b):no(new Error('This browser can’t export that format. Try PNG or JPG.')),t,q))
async function img(f,{w,type,q=.92}){let b;try{b=await createImageBitmap(f)}catch{throw new Error(`${f.name} can’t be read as an image.`)}
 try{
 if(!b.width||!b.height||b.width*b.height>32000000)throw new Error(`${f.name} exceeds the 32 megapixel image limit. Use a smaller image.`)
 const s=w?Math.min(1,w/b.width):1,c=document.createElement('canvas');c.width=Math.max(1,Math.round(b.width*s));c.height=Math.max(1,Math.round(b.height*s))
 const g=c.getContext('2d');if(!g)throw new Error('Image processing is unavailable in this browser.')
 if(type==='image/jpeg'){g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height)}g.drawImage(b,0,0,c.width,c.height)
 try{return await enc(c,type,q)}finally{c.width=c.height=0}
 }finally{b.close()}}
const each=fn=>async(fs,o,p)=>{const out=[];for(let i=0;i<fs.length;i++){out.push(await fn(fs[i],o));p((i+1)/fs.length)}return out}
const load=async f=>{try{return await PDFDocument.load(await f.arrayBuffer())}catch{throw new Error(`${f.name} is encrypted or isn’t a valid PDF.`)}}
const pdf=async d=>new Blob([await d.save()],{type:'application/pdf'})
const parse=(s,n)=>{const r=[];for(const part of s.split(',')){const m=part.trim().match(/^(\d+)(?:-(\d+))?$/);if(!m)throw new Error(`“${part.trim()}” isn’t a page range. Use something like 1-3,5.`)
 const a=+m[1],b=+(m[2]||m[1]);if(a<1||b<a||b>n)throw new Error(`Pages must be between 1 and ${n}.`);for(let i=a;i<=b;i++){if(r.length>=2000)throw new Error('Choose at most 2000 output pages at a time.');r.push(i-1)}}return r}
const IK='JPG, PNG or WebP images',I={accept:IMG,kind:IK,multi:true,cat:'Image'},P={accept:['application/pdf'],kind:'PDF files',cat:'PDF'}
const soon=(id,name,cat,desc)=>({id,name,cat,desc,soon:true})
export const TOOLS=[
{...I,id:'compress',name:'Compress images',desc:'Shrink JPG, PNG and WebP files. PNGs become WebP to save the most.',opts:[{k:'q',label:'Quality',type:'range',min:10,max:95,def:70}],
 run:each(async(f,o)=>{const t=fileType(f)==='image/png'?'image/webp':fileType(f),b=await img(f,{type:t,q:o.q/100});return b.size<f.size?{name:`${base(f.name)}-small.${EXT[t]}`,blob:b}:{name:f.name,blob:f}})},
{...I,id:'resize',name:'Resize images',desc:'Set a maximum width. Height follows, and small images are never stretched.',opts:[{k:'w',label:'Max width (px)',type:'number',min:16,max:8000,def:1280}],
 run:each(async(f,o)=>({name:`${base(f.name)}-${o.w}w.${EXT[fileType(f)]}`,blob:await img(f,{w:+o.w,type:fileType(f)})}))},
{...I,id:'convert',name:'Convert image format',desc:'Switch between JPG, PNG and WebP.',opts:[{k:'t',label:'Convert to',type:'select',def:'image/webp',options:[['image/jpeg','JPG'],['image/png','PNG'],['image/webp','WebP']]}],
 run:each(async(f,o)=>({name:`${base(f.name)}.${EXT[o.t]}`,blob:await img(f,{type:o.t})}))},
{...P,id:'merge',name:'Merge PDFs',desc:'Combine PDFs into one, in the order you add them.',multi:true,
 run:async(fs,o,p)=>{if(fs.length<2)throw new Error('Add at least two PDFs to merge.');const out=await PDFDocument.create()
  for(let i=0;i<fs.length;i++){const d=await load(fs[i]);(await out.copyPages(d,d.getPageIndices())).forEach(x=>out.addPage(x));p((i+1)/fs.length)}return[{name:'merged.pdf',blob:await pdf(out)}]}},
{...P,id:'split',name:'Split a PDF',desc:'Pull out pages or ranges, as one file or one file per page.',
 opts:[{k:'r',label:'Pages',type:'text',def:'1'},{k:'m',label:'Output',type:'select',def:'one',options:[['one','One PDF'],['each','Separate pages']]}],
 run:async([f],o,p)=>{const d=await load(f),idx=parse(o.r,d.getPageCount()),mk=async ix=>{const x=await PDFDocument.create();(await x.copyPages(d,ix)).forEach(y=>x.addPage(y));return pdf(x)}
  if(o.m==='one')return[{name:`${base(f.name)}-pages.pdf`,blob:await mk(idx)}]
  const out=[];for(let i=0;i<idx.length;i++){out.push({name:`${base(f.name)}-p${idx[i]+1}.pdf`,blob:await mk([idx[i]])});p((i+1)/idx.length)}return out}},
{...I,id:'jpg2pdf',name:'Images to PDF',cat:'PDF',desc:'Turn images into one PDF, one image per page.',
 run:async(fs,o,p)=>{const d=await PDFDocument.create();for(let i=0;i<fs.length;i++){const f=fs[i];let m
  if(fileType(f)==='image/jpeg')m=await d.embedJpg(await f.arrayBuffer());else if(fileType(f)==='image/png')m=await d.embedPng(await f.arrayBuffer());else m=await d.embedPng(await(await img(f,{type:'image/png'})).arrayBuffer())
  d.addPage([m.width,m.height]).drawImage(m,{x:0,y:0,width:m.width,height:m.height});p((i+1)/fs.length)}return[{name:'images.pdf',blob:await pdf(d)}]}},
{id:'words',name:'Word counter',cat:'Student',desc:'Words, characters, sentences and reading time as you type.',text:'count'},
{id:'case',name:'Text case converter',cat:'Text',desc:'UPPER, lower, Title, Sentence, camelCase, snake_case and kebab-case.',text:'case'},
soon('summary','AI summarizer','AI','Summaries of long documents, run locally.'),soon('ocr','Image to text','AI','OCR for scans and photos.'),
soon('docx','Word to PDF','PDF','Needs a document renderer we haven’t added yet.'),soon('cards','Flashcard maker','Student','Notes in, study cards out.')]
async function inspectContent(f){
 const bytes=new Uint8Array(await f.slice(0,1024).arrayBuffer()),type=fileType(f)
 const starts=(...a)=>a.every((v,i)=>bytes[i]===v)
 const valid=type==='application/pdf'?new TextDecoder().decode(bytes).includes('%PDF-'):type==='image/jpeg'?starts(255,216,255):type==='image/png'?starts(137,80,78,71,13,10,26,10):starts(82,73,70,70)&&String.fromCharCode(...bytes.slice(8,12))==='WEBP'
 if(!valid)throw new Error(`${f.name} does not contain a valid ${type==='application/pdf'?'PDF':'image'} header. Choose the original file.`)
 if(type.startsWith('image/')){let bitmap;try{bitmap=await createImageBitmap(f);if(bitmap.width*bitmap.height>32000000)throw new Error('Image exceeds the 32 megapixel limit.')}catch(e){throw new Error(`${f.name} can’t be read. ${e.message||'Try another image.'}`)}finally{bitmap?.close()}}
}
for(const tool of TOOLS){if(!tool.run)continue;const run=tool.run;tool.run=async(fs,o={},p=()=>{})=>{
 const error=validate(fs,tool)||validateOptions(tool,o);if(error)throw new Error(error)
 try{for(const f of fs)await inspectContent(f);return await run(fs,o,p)}catch(e){throw new Error(e.message||'This file could not be read. Try another file.')}
}}
export const stats=t=>{const w=t.trim()?t.trim().split(/\s+/).length:0;return[['Words',w],['Characters',t.length],['No spaces',t.replace(/\s/g,'').length],['Sentences',(t.match(/[^.!?]+(?:[.!?]+|$)/g)||[]).filter(s=>s.trim()).length],['Reading time',Math.max(w&&1,Math.round(w/230))+' min']]}
const words=t=>t.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[],cap=s=>s.charAt(0).toUpperCase()+s.slice(1)
export const CASES={UPPER:t=>t.toUpperCase(),lower:t=>t.toLowerCase(),Title:t=>t.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()),Sentence:t=>t.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g,(m,a,b)=>a+b.toUpperCase()),
 camelCase:t=>words(t).map((w,i)=>i?cap(w):w).join(''),snake_case:t=>words(t).join('_'),'kebab-case':t=>words(t).join('-')}
