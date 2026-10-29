import {useState,useRef,useEffect} from 'react'
import {Palette,X} from 'lucide-react'
import {PRESETS,DEFAULT,loadPalette,savePalette} from './palette'
const FIELDS=[['dark','Dark background'],['light','Light background'],['acc','Main accent'],['glow','Glow']]
export default function PalettePanel({onChange}){
 const [open,setOpen]=useState(false),[p,setP]=useState(loadPalette),root=useRef(),trigger=useRef(),panel=useRef()
 const dismiss=()=>{setOpen(false);trigger.current?.focus()}
 useEffect(()=>{
  if(!open)return
  panel.current?.querySelector('button')?.focus()
  const outside=e=>{if(!root.current?.contains(e.target))setOpen(false)}
  const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();dismiss()}}
  const focus=e=>{if(!root.current?.contains(e.target))setOpen(false)}
  document.addEventListener('pointerdown',outside)
  document.addEventListener('keydown',key)
  document.addEventListener('focusin',focus)
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);document.removeEventListener('focusin',focus)}
 },[open])
 const set=n=>{setP(n);savePalette(n);onChange?.()}
 return <div ref={root} className="relative"><button ref={trigger} aria-expanded={open} aria-controls="palette-panel" aria-haspopup="dialog" aria-label="Change colors" onClick={()=>setOpen(v=>!v)} className="grid h-10 w-10 place-items-center rounded-full border border-line hover:bg-pink hover:text-ink"><Palette size={18}/></button>
 {open&&<div id="palette-panel" ref={panel} role="dialog" aria-label="Color palette" className="palette-panel absolute right-0 top-12 z-50 w-72 overflow-y-auto rounded-2xl border border-line bg-bg p-4 shadow-xl">
  <div className="flex items-center justify-between"><p className="font-display font-bold">Presets</p><button onClick={dismiss} aria-label="Close color palette" className="grid h-10 w-10 place-items-center rounded-full border border-line"><X size={18}/></button></div>
  <div className="mt-2 grid gap-2">{Object.entries(PRESETS).map(([n,v])=><button key={n} aria-pressed={FIELDS.every(([k])=>p[k]===v[k])} onClick={()=>set(v)} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm hover:border-fg">{n}<span className="flex" aria-hidden>{[v.dark,v.acc,v.glow,v.light].map((c,i)=><i key={i} className="h-4 w-4" style={{background:c}}/>)}</span></button>)}</div>
  <p className="mt-4 font-display font-bold">Your own colors</p>
  <div className="mt-2 grid grid-cols-2 gap-3">{FIELDS.map(([k,l])=><label key={k} className="text-xs text-mute">{l}<input type="color" value={p[k]} onChange={e=>set({...p,[k]:e.target.value})} className="mt-1 block h-9 w-full cursor-pointer rounded bg-transparent"/></label>)}</div>
  <button onClick={()=>set(DEFAULT)} className="mt-4 min-h-10 text-sm text-accent underline">Reset to default</button></div>}</div>
}
