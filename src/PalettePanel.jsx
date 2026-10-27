import {useState,useRef} from 'react'
import {Palette} from 'lucide-react'
import {PRESETS,DEFAULT,loadPalette,savePalette} from './palette'
const FIELDS=[['dark','Dark background'],['light','Light background'],['acc','Main accent'],['glow','Glow']]
export default function PalettePanel({onChange}){
 const [open,setOpen]=useState(false),[p,setP]=useState(loadPalette),t=useRef()
 const set=n=>{setP(n);savePalette(n);clearTimeout(t.current);t.current=setTimeout(onChange,300)}
 return <div className="relative"><button aria-expanded={open} aria-label="Change colors" onClick={()=>setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-full border border-line hover:bg-pink hover:text-ink"><Palette size={18}/></button>
 {open&&<div role="dialog" aria-label="Color palette" className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-line bg-bg p-4 shadow-xl">
  <p className="font-display font-bold">Presets</p>
  <div className="mt-2 grid gap-2">{Object.entries(PRESETS).map(([n,v])=><button key={n} onClick={()=>set(v)} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm hover:border-fg">{n}<span className="flex">{[v.dark,v.acc,v.glow,v.light].map(c=><i key={c} className="h-4 w-4" style={{background:c}}/>)}</span></button>)}</div>
  <p className="mt-4 font-display font-bold">Your own colors</p>
  <div className="mt-2 grid grid-cols-2 gap-3">{FIELDS.map(([k,l])=><label key={k} className="text-xs text-mute">{l}<input type="color" value={p[k]} onChange={e=>set({...p,[k]:e.target.value})} className="mt-1 block h-9 w-full cursor-pointer rounded bg-transparent"/></label>)}</div>
  <button onClick={()=>set(DEFAULT)} className="mt-4 text-sm text-accent underline">Reset to default</button></div>}</div>}
