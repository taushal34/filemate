// Change the whole site's colors by editing these 4-color sets (or use the palette button in the navbar).
export const PRESETS={
 'Ink & Tangerine':{dark:'#0E1116',light:'#FAF7F2',acc:'#FF7A45',glow:'#FFB27A'},
 'Deep Teal':{dark:'#031716',light:'#F5FAFA',acc:'#0C969C',glow:'#22D3C5'},
 'Forest & Mint':{dark:'#0B1512',light:'#F4FAF6',acc:'#3DDC97',glow:'#8CF2C4'},
 'Graphite & Lime':{dark:'#16181D',light:'#F7F8F2',acc:'#C6F432',glow:'#E2FA86'}}
export const DEFAULT=PRESETS['Deep Teal']
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),hex=a=>'#'+a.map(x=>Math.round(x).toString(16).padStart(2,'0')).join('')
const mix=(a,b,t)=>{const x=rgb(a),y=rgb(b);return hex(x.map((v,i)=>v+(y[i]-v)*t))}
const lum=h=>{const [r,g,b]=rgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b}
const cr=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
const readable=(c,bg,to)=>{for(let i=0;i<40&&cr(c,bg)<4.5;i++)c=mix(c,to,.1);return c}
export function derive({dark,light,acc,glow}){
 const teal=dark.toUpperCase()==='#031716'&&light.toUpperCase()==='#F5FAFA'
 return{D:{bg:dark,card:teal?'#032F30':mix(dark,light,.06),surface:teal?'#071F24':mix(dark,light,.04),line:teal?'#274D60':mix(dark,light,.24),fg:light,mute:teal?'#B8D3D5':mix(dark,light,.72),accT:readable(acc,dark,'#ffffff')},
  Lt:{bg:light,card:teal?'#E6F2F2':mix(light,dark,.05),line:teal?'#B8D3D5':mix(light,dark,.24),fg:dark,mute:mix(light,dark,.72),accT:readable(acc,light,dark)},
  S:{acc,glow,hover:teal?'#0A7075':mix(acc,dark,.2),blue:'#6BA3BE',frost:teal&&glow.toUpperCase()==='#22D3C5'?'#D8FFFA':mix(glow,'#ffffff',.7),onAcc:cr(acc,dark)>=cr(acc,'#ffffff')?dark:'#ffffff',dk:dark}}}
const css=o=>Object.entries(o).map(([k,v])=>`--${k}:${v}`).join(';')
export function applyPalette(p){const {D,Lt,S}=derive(p);let s=document.getElementById('pal');if(!s){s=document.createElement('style');s.id='pal';document.head.append(s)}
 s.textContent=`html:root{${css({...Lt,...S})}}html.dark{${css(D)}}`;window.dispatchEvent(new Event('palettechange'))}
export const loadPalette=()=>{try{const p=JSON.parse(localStorage.palette);return Object.fromEntries(Object.entries(DEFAULT).map(([k,v])=>[k,/^#[0-9a-f]{6}$/i.test(p?.[k])?p[k]:v]))}catch{return {...DEFAULT}}}
export const savePalette=p=>{applyPalette(p);try{localStorage.palette=JSON.stringify(p)}catch{}}
