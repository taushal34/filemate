import {useState,useRef,useEffect,useMemo,lazy,Suspense,Component} from 'react'
import {motion,AnimatePresence,useMotionValue,useSpring,useReducedMotion} from 'framer-motion'
import {Moon,Sun,Search,Upload,Download,X,Lock,Cpu,Layers} from 'lucide-react'
import PalettePanel from './PalettePanel'
import {TOOLS,CATS,validate,validateOptions,fmt,stats,CASES} from './tools'

const Hero3D=lazy(()=>import('./Hero3D'))
const Reveal=({children,className=''})=><motion.div className={className} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:'-60px'}} transition={{duration:.7,ease:[.2,.7,.2,1]}}>{children}</motion.div>

function Magnetic({children,className='',...p}){const reduce=useReducedMotion(),r=useRef(),x=useMotionValue(0),y=useMotionValue(0),sx=useSpring(x,{stiffness:220,damping:16}),sy=useSpring(y,{stiffness:220,damping:16})
 return <motion.button ref={r} style={{x:sx,y:sy}} className={className} {...p}
  onMouseMove={e=>{if(reduce)return;const b=r.current.getBoundingClientRect();x.set((e.clientX-b.left-b.width/2)*.25);y.set((e.clientY-b.top-b.height/2)*.25)}} onMouseLeave={()=>{x.set(0);y.set(0)}}>{children}</motion.button>}

const Mascot=({mood='idle',size=64})=><svg width={size} height={size*1.15} viewBox="0 0 52 60" aria-hidden className={mood==='drag'?'float':''}>
 <path d="M4 2h30l14 14v42H4z" className="fill-coral"/><path d="M34 2v14h14z" className="fill-pink"/>
 <g className="blink fill-ink"><ellipse cx="19" cy="34" rx="3" ry={mood==='happy'?1.2:3.5}/><ellipse cx="33" cy="34" rx="3" ry={mood==='happy'?1.2:3.5}/></g>
 <path d={{idle:'M21 44q5 4 10 0',drag:'M22 43a4 4 0 1 0 8 0z',happy:'M19 42q7 9 14 0',oops:'M21 47q5-4 10 0',work:'M22 45h8'}[mood]} strokeWidth="2" strokeLinecap="round" className={mood==='drag'?'stroke-ink fill-ink':'stroke-ink fill-none'}/></svg>
const Burst=()=><div aria-hidden className="pointer-events-none relative h-0">{Array.from({length:14},(_,i)=>{const a=i/14*6.28;return <motion.span key={i} className="absolute left-1/2 top-4 h-2 w-2 rounded-full bg-glow" initial={{x:0,y:0,opacity:1}} animate={{x:Math.cos(a)*90,y:Math.sin(a)*60,opacity:0,scale:.4}} transition={{duration:.9,ease:'easeOut'}}/>})}</div>
const Mark=()=><a href="#top" aria-label="FileMate home" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
 <svg width="24" height="28" viewBox="0 0 26 30" aria-hidden><path d="M2 2h14l8 8v18H2z" className="fill-coral"/><path d="M16 2v8h8z" className="fill-glow"/><circle cx="9" cy="19" r="1.8" className="fill-ink"/><circle cx="17" cy="19" r="1.8" className="fill-ink"/></svg>filemate</a>

function Nav({dark,toggle,setCat,onPal}){return <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur">
 <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3"><Mark/>
  <nav aria-label="Categories" className="hidden gap-6 text-sm md:flex">{CATS.slice(1).map(c=><a key={c} href="#tools" onClick={()=>setCat(c)} className="text-mute hover:text-accent">{c}</a>)}</nav>
  <div className="flex items-center gap-2"><PalettePanel onChange={onPal}/><button onClick={toggle} aria-label={dark?'Switch to light theme':'Switch to dark theme'} className="grid h-10 w-10 place-items-center rounded-full border border-line hover:bg-pink hover:text-ink">{dark?<Sun size={18}/>:<Moon size={18}/>}</button></div></div></header>}

function HeroFallback(){return <div className="hero-fallback" role="img" aria-label="PDF document stack with PDF, JPG and DOCX badges"><div className="paper paper-back"/><div className="paper paper-mid"/><div className="paper paper-front"><strong>FILEMATE</strong><div className="paper-lines"/><div className="paper-art"/><div className="paper-lines"/></div><span className="file-badge badge-pdf">PDF</span><span className="file-badge badge-jpg">JPG</span><span className="file-badge badge-doc">DOCX</span></div>}
class HeroBoundary extends Component{
 state={failed:false}
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?<HeroFallback/>:this.props.children}
}

function Hero({pulse}){const use3D=useMemo(()=>!!window.WebGLRenderingContext,[])
 return <section id="top" className="relative mx-auto grid max-w-7xl gap-6 overflow-hidden px-5 pb-10 pt-12 lg:grid-cols-12 lg:pt-20">
  <div aria-hidden className="float absolute -right-24 top-10 h-80 w-80 rounded-full bg-glow opacity-20 blur-3xl"/>
  <div className="relative lg:col-span-7"><h1 className="font-display text-[clamp(2.65rem,10.5vw,9rem)] font-bold leading-[.9] tracking-tighter">Your files,<br/><span className="text-accent">handled quietly.</span></h1>
   <p className="mt-8 max-w-md text-lg text-mute">Compress, convert, merge and split right here in your browser. Your files never leave this tab.</p>
   <div className="mt-8 flex flex-wrap items-center gap-5"><Magnetic onClick={()=>document.getElementById('tools').scrollIntoView()} className="rounded-full bg-coral px-8 py-4 font-medium text-onacc hover:bg-pink">Choose a tool</Magnetic>
    <a href="#privacy" className="border-b border-line pb-1 text-mute hover:text-accent">How it stays private</a></div></div>
  <div className="relative h-[380px] lg:col-span-5 lg:h-[460px]" style={{perspective:use3D?undefined:1000}} aria-hidden>{use3D?<HeroBoundary><Suspense fallback={<HeroFallback/>}><Hero3D pulse={pulse} fallback={<HeroFallback/>}/></Suspense></HeroBoundary>:
   <HeroFallback/>}</div></section>}

function Drop({onFiles,files,error}){const [over,setOver]=useState(false),ref=useRef()
 const sug=files.length?TOOLS.filter(t=>!t.soon&&!t.text&&!validate(files,t)):[]
 return <section className="mx-auto max-w-7xl px-5 py-6"><div className="relative lg:ml-[16%]"><div aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2.5rem] bg-coral"/>
  <div onDragOver={e=>{e.preventDefault();setOver(true)}} onDragLeave={()=>setOver(false)} onDrop={e=>{e.preventDefault();setOver(false);onFiles([...e.dataTransfer.files])}}
   className={`relative rounded-[2.5rem] border border-fg p-8 transition-colors sm:p-12 ${over?'bg-pink text-ink':'bg-bg'}`}>
   <input ref={ref} type="file" accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp" multiple hidden onChange={e=>{onFiles([...e.target.files]);e.target.value=''}}/>
   <div className="absolute -top-10 right-8"><Mascot mood={over?'drag':files.length?'happy':'idle'}/></div>
   <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-3xl font-bold sm:text-4xl">Drop a file. We’ll suggest what to do with it.</h2><p className="mt-2 text-mute">PDF, JPG, PNG or WebP. Up to 50 MB each, 30 files / 150 MB per batch; images up to 32 megapixels.</p></div>
    <Magnetic onClick={()=>ref.current.click()} className="flex shrink-0 items-center gap-2 rounded-full border border-fg px-6 py-3 hover:bg-fg hover:text-bg"><Upload size={18}/>Browse files</Magnetic></div>
   {error&&<p role="alert" className="mt-4 text-accent">{error}</p>}{files.length>0&&<div className="mt-6 border-t border-line pt-5" aria-live="polite"><p className="text-sm text-mute">{files.map(f=>`${f.name} (${fmt(f.size)})`).join(', ')}</p>
    <div className="mt-3 flex flex-wrap gap-2">{sug.length?sug.map(t=><button key={t.id} onClick={()=>onFiles(files,t)} className="rounded-full bg-coral px-4 py-2 text-sm text-onacc hover:bg-pink">{t.name}</button>):<p className="text-sm text-accent">No tool takes this mix of files. Try one type at a time.</p>}</div></div>}</div></div></section>}

function Tools({cat,setCat,open,recent}){const [q,setQ]=useState('')
 const list=TOOLS.filter(t=>(cat==='All'||t.cat===cat)&&(t.name+t.desc).toLowerCase().includes(q.toLowerCase()))
 return <section id="tools" className="mx-auto max-w-7xl scroll-mt-16 px-5 py-20"><Reveal className="grid gap-8 lg:grid-cols-12"><div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
  <h2 className="font-display text-5xl font-bold tracking-tight">Tools</h2>
  <label className="mt-6 flex items-center gap-3 border-b border-fg py-2"><Search size={18} aria-hidden/><span className="sr-only">Search tools</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search tools" className="w-full bg-transparent outline-none placeholder:text-mute"/></label>
  <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by category">{CATS.map(c=><button key={c} aria-pressed={cat===c} onClick={()=>setCat(c)} className={`rounded-full border px-4 py-1.5 text-sm ${cat===c?'border-coral bg-coral text-onacc':'border-line hover:border-fg'}`}>{c}</button>)}</div>{recent.length>0&&<div className="mt-6"><p className="text-sm text-mute">Recently used</p><div className="mt-2 flex flex-wrap gap-2">{recent.map(id=>TOOLS.find(t=>t.id===id)).filter(Boolean).map(t=><button key={t.id} onClick={()=>open(t)} className="rounded-full border border-accent px-3 py-1 text-sm text-accent hover:bg-pink hover:text-ink">{t.name}</button>)}</div></div>}</div>
  <ul className="lg:col-span-8">{list.map(t=><li key={t.id} className="border-t border-line last:border-b"><button disabled={t.soon} onClick={()=>open(t)} className="group flex w-full items-baseline justify-between gap-4 py-6 text-left disabled:opacity-55">
   <span><span className="font-display text-2xl font-bold transition-transform group-enabled:group-hover:translate-x-2 sm:text-3xl">{t.name}</span><span className="mt-1 block max-w-lg text-mute">{t.desc}</span></span>
   <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${t.soon?'border border-line':'bg-pink text-ink'}`}>{t.soon?'Coming soon':t.cat}</span></button></li>)}
   {!list.length&&<li className="border-t border-line py-10 text-mute">Nothing matches “{q}”. Clear the search or pick another category.</li>}</ul></Reveal></section>}

function Field({f,v,set}){const c='mt-1 w-full rounded-lg border border-line bg-transparent px-3 py-2'
 return <label className="block text-sm">{f.label}{f.type==='range'&&<span className="float-right text-accent">{v}</span>}
  {f.type==='select'?<select className={c} value={v} onChange={e=>set(e.target.value)}>{f.options.map(([a,b])=><option className="text-ink" key={a} value={a}>{b}</option>)}</select>
  :<input className={f.type==='range'?'mt-2 w-full accent-coral':c} type={f.type} min={f.min} max={f.max} value={v} onChange={e=>set(e.target.value)}/>}</label>}

function TextTool({tool,onDirty}){const [t,setT]=useState(''),[copy,setCopy]=useState('')
 useEffect(()=>{onDirty(!!t)},[t,onDirty])
 return <div><label className="sr-only" htmlFor="tx">Your text</label><textarea id="tx" value={t} onChange={e=>setT(e.target.value)} rows={8} placeholder="Paste or type here" className="w-full rounded-xl border border-line bg-transparent p-4"/>
  {tool.text==='count'?<dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">{stats(t).map(([k,v])=><div key={k} className="border-t border-line pt-2"><dd className="font-display text-3xl font-bold">{v}</dd><dt className="text-sm text-mute">{k}</dt></div>)}</dl>
  :<div className="mt-4 flex flex-wrap gap-2">{Object.entries(CASES).map(([k,fn])=><button key={k} onClick={()=>setT(fn(t))} className="rounded-full border border-line px-4 py-2 text-sm hover:bg-pink hover:text-ink">{k}</button>)}
   <button onClick={async()=>{try{await navigator.clipboard.writeText(t);setCopy('Copied.')}catch{setCopy('Copy failed. Select the text and copy manually.')}}} className="rounded-full bg-coral px-4 py-2 text-sm text-onacc hover:bg-pink">Copy text</button><p role="status">{copy}</p></div>}</div>}

function Workspace({tool,pre,close}){
 const [files,setFiles]=useState(pre||[]),[o,setO]=useState(()=>Object.fromEntries((tool.opts||[]).map(x=>[x.k,x.def]))),[st,setSt]=useState({busy:false,p:0,err:'',res:[]}),ref=useRef(),dialog=useRef(),running=useRef(false),mounted=useRef(true),dirty=useRef(false)
 const latest=useRef()
 latest.current={files,st,requestClose:()=>requestClose()}
 const markDirty=useMemo(()=>v=>{dirty.current=v},[])
 const requestClose=()=>{if(running.current){setSt(s=>({...s,err:'Please wait for processing to finish before closing.'}));return}if((files.length||st.res.length||dirty.current)&&!window.confirm('Close this tool and discard selected files and results?'))return;close()}
 const [urls,setUrls]=useState([]);useEffect(()=>{const next=st.res.map(r=>URL.createObjectURL(r.blob));setUrls(next);return()=>next.forEach(url=>URL.revokeObjectURL(url))},[st.res])
 useEffect(()=>{
  mounted.current=true
  const previous=document.activeElement,overflow=document.body.style.overflow
  document.body.style.overflow='hidden';const background=[...document.querySelectorAll('header,main,footer')].map(el=>[el,el.inert]);background.forEach(([el])=>{el.inert=true});dialog.current?.focus()
  const key=e=>{
   if(e.key==='Escape'){e.preventDefault();latest.current.requestClose()}
   if(e.key==='Tab'){
    const items=[...dialog.current.querySelectorAll('button:not(:disabled),a[href],input:not([type="hidden"]):not(:disabled),select:not(:disabled),textarea')].filter(x=>x.getClientRects().length)
    const first=items[0],last=items.at(-1)
    if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last?.focus()}
    else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===dialog.current)){e.preventDefault();first?.focus()}
   }
  }
  const unload=e=>{if(running.current||latest.current.files.length||dirty.current||latest.current.st.res.length){e.preventDefault();e.returnValue=''}}
  document.addEventListener('keydown',key);window.addEventListener('beforeunload',unload)
  return()=>{mounted.current=false;document.body.style.overflow=overflow;background.forEach(([el,inert])=>{el.inert=inert});document.removeEventListener('keydown',key);window.removeEventListener('beforeunload',unload);previous?.focus()}
 },[])
 const add=l=>{if(running.current||!l.length)return;if(!tool.multi&&l.length>1){setSt(s=>({...s,err:'Choose one file for this tool.'}));return}const n=tool.multi?[...files,...l]:l.slice(0,1),err=tool.accept&&validate(n,tool);err?setSt(s=>({...s,err})):(setFiles(n),setSt({busy:false,p:0,err:'',res:[]}))}
 const run=async()=>{if(running.current)return;const err=validate(files,tool)||validateOptions(tool,o);if(err){setSt(s=>({...s,err}));return}running.current=true;setSt({busy:true,p:0,err:'',res:[]});await new Promise(r=>setTimeout(r,30))
  try{const res=await tool.run(files,o,p=>{if(mounted.current)setSt(s=>({...s,p}))});setSt({busy:false,p:1,err:'',res})}catch(e){setSt({busy:false,p:0,err:e.message||'Something went wrong. Check the file and try again.',res:[]})}finally{running.current=false}}
 const saved=Math.round((1-st.res.reduce((a,r)=>a+r.blob.size,0)/(files.reduce((a,f)=>a+f.size,0)||1))*100)
 return <motion.div className="fixed inset-0 z-40 flex justify-end bg-ink/50" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
  <motion.aside ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={tool.name} onClick={e=>e.stopPropagation()} initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring',damping:30,stiffness:260}} className="h-full w-full max-w-xl overflow-y-auto bg-bg p-6 sm:p-10">
   <div className="flex items-start justify-between gap-4"><h2 className="font-display text-4xl font-bold tracking-tight">{tool.name}</h2><button onClick={requestClose} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full border border-line"><X size={18}/></button></div>
   <p className="mt-2 text-mute">{tool.desc}</p>
   <div className="mt-8">{tool.text?<TextTool tool={tool} onDirty={markDirty}/>:<>
    <input ref={ref} type="file" hidden multiple={tool.multi} accept={tool.accept.join(',')} onChange={e=>{add([...e.target.files]);e.target.value=''}}/>
    <button disabled={st.busy} onClick={()=>ref.current.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();add([...e.dataTransfer.files])}} className="w-full rounded-2xl border border-dashed border-fg p-8 text-center hover:bg-pink hover:text-ink"><Upload className="mx-auto mb-2" size={22}/>{files.length?'Add or replace files':`Choose or drop ${tool.kind}`}</button>
    {files.length>0&&<ul className="mt-4 divide-y divide-line text-sm">{files.map((f,i)=><li key={i} className="flex justify-between gap-3 py-2"><span className="truncate">{f.name}</span><span className="text-mute">{fmt(f.size)}</span><button disabled={st.busy} aria-label={`Remove ${f.name}`} onClick={()=>{setFiles(files.filter((_,j)=>i!==j));setSt({busy:false,p:0,err:'',res:[]})}}><X size={18}/></button></li>)}</ul>}
    {tool.opts&&<fieldset disabled={st.busy} className="mt-6 grid gap-4">{tool.opts.map(f=><Field key={f.k} f={f} v={o[f.k]} set={v=>setO({...o,[f.k]:v})}/>)}</fieldset>}
    <Magnetic disabled={!files.length||st.busy} onClick={run} className="mt-6 w-full rounded-full bg-coral py-4 font-medium text-onacc disabled:opacity-40 hover:bg-pink">{st.busy?'Working…':'Run'}</Magnetic>
    {st.busy&&<div role="progressbar" aria-label="Processing files" aria-valuenow={Math.round(st.p*100)} aria-valuemin={0} aria-valuemax={100} className="mt-4 h-1.5 overflow-hidden rounded bg-line"><div className="h-full bg-coral transition-all" style={{width:`${Math.max(8,st.p*100)}%`}}/></div>}
    <p role="alert" className="mt-4 flex items-center gap-2 text-accent">{st.err&&<Mascot mood="oops" size={32}/>}{st.err}</p>
    {st.res.length>0&&<div aria-live="polite" className="mt-6"><Burst/><div className="flex items-center gap-3"><Mascot mood="happy" size={40}/><h3 className="font-display text-xl font-bold">{tool.id==='compress'&&saved>0?`Squeezed it down ${saved}%!`:'Done. Files stay on your device.'}</h3></div><ul className="mt-2 divide-y divide-line">{st.res.map((r,i)=><li key={i} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="truncate">{r.name} <span className="text-mute">{fmt(r.blob.size)}</span></span>
     <a href={urls[i]} download={r.name} className="flex items-center gap-1 rounded-full bg-coral px-4 py-2 font-medium text-onacc"><Download size={15}/>Download</a></li>)}</ul></div>}</>}</div></motion.aside></motion.div>}

const Sections=()=><><section className="mx-auto max-w-7xl px-5 py-20"><Reveal><h2 className="max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">Three steps. No account, no queue, no upload bar.</h2></Reveal>
 <ol className="mt-14 grid gap-10 md:grid-cols-3">{[['Add','Drop files on the page or pick them from your device.'],['Adjust','Set quality, width, format or page ranges. Defaults are sensible.'],['Save','Download the result. It was made in this tab and never sent anywhere.']].map(([h,p],i)=>
  <li key={h} style={{marginTop:i*40}} className="border-t border-fg pt-4"><span className="font-display text-accent">Step {i+1}</span><h3 className="mt-2 font-display text-3xl font-bold">{h}</h3><p className="mt-2 text-mute">{p}</p></li>)}</ol></section>
 <section id="privacy" className="scroll-mt-16 bg-card py-20 text-fg"><div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2"><div><Lock className="text-accent" size={30}/><h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">Your files never leave your device.</h2></div>
  <div className="space-y-5 text-mute"><p>Every tool runs with your browser’s own code. There is no upload step, so there is no server copy to leak, store or sell.</p><p className="flex gap-3"><Cpu className="shrink-0 text-pink" size={20}/>Large files use your device’s memory, so we cap each file at 50 MB to keep phones responsive.</p><p className="flex gap-3"><Layers className="shrink-0 text-pink" size={20}/>Open the Network tab while you run a tool. You’ll see nothing sent.</p></div></div></section></>

export default function App(){
 useEffect(()=>{const prevent=e=>{if(e.dataTransfer?.types.includes('Files'))e.preventDefault()};window.addEventListener('dragover',prevent);window.addEventListener('drop',prevent);return()=>{window.removeEventListener('dragover',prevent);window.removeEventListener('drop',prevent)}},[])
 const [dark,setDark]=useState(()=>document.documentElement.classList.contains('dark')),[pulse,setPulse]=useState(0),[recent,setRecent]=useState(()=>{try{const r=JSON.parse(localStorage.recent||'[]');return Array.isArray(r)?r.filter(x=>typeof x==='string'):[]}catch{return[]}}),[cat,setCat]=useState('All'),[files,setFiles]=useState([]),[tool,setTool]=useState(null),[uploadError,setUploadError]=useState('')
 const toggle=()=>{const d=!dark;setDark(d);document.documentElement.classList.toggle('dark',d);try{localStorage.theme=d?'dark':'light'}catch{}}
 const openTool=t=>{setTool(t);const r=[t.id,...recent.filter(x=>x!==t.id)].slice(0,4);setRecent(r);try{localStorage.recent=JSON.stringify(r)}catch{}}
 const onFiles=(fs,t)=>{if(!fs.length)return;const err=validate(fs,t||{accept:['application/pdf','image/jpeg','image/png','image/webp'],multi:true,kind:'PDF, JPG, PNG or WebP'});setUploadError(err);if(err)return;setFiles(fs);setPulse(p=>p+1);if(t)openTool(t)}
 return <><Nav dark={dark} toggle={toggle} setCat={setCat}/><main><Hero pulse={pulse}/><Drop files={files} onFiles={onFiles} error={uploadError}/><Tools cat={cat} setCat={setCat} recent={recent} open={t=>{setFiles([]);openTool(t)}}/><Sections/></main>
  <footer className="border-t border-line px-5 py-10"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-mute"><Mark/><p>Free and open source. Made to run on your device.</p></div></footer>
  <AnimatePresence>{tool&&<Workspace key={tool.id} tool={tool} pre={files} close={()=>setTool(null)}/>}</AnimatePresence></>}
