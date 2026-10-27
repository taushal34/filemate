import {useRef,useMemo,useEffect,useState} from 'react'
import {Canvas,useFrame} from '@react-three/fiber'
import * as THREE from 'three'
const v=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim()
const cv=()=>({acc:v('--acc')||'#0C969C',glow:v('--glow')||'#22D3C5',frost:v('--frost')||'#D8FFFA',dk:v('--dk')||'#031716',on:v('--onAcc')||'#031716'})
const W=2.1,H=2.8,N=5,BW=.95,BH=.4
// Original file stack is intentionally preserved. No globe, sphere or portal orb.
const PALETTE={acc:'#0C969C',glow:'#22D3C5',frost:'#D8FFFA',dk:'#031716',on:'#031716'}
function rr(w,h,r,d){const s=new THREE.Shape(),x=-w/2,y=-h/2
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y)
 const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:2,curveSegments:8});g.translate(0,0,-d/2);return g}
const fit=(t,w,h)=>{t.colorSpace=THREE.SRGBColorSpace;t.repeat.set(1/w,1/h);t.offset.set(.5,.5);return t}
function page(C){const c=document.createElement('canvas');c.width=512;c.height=Math.round(512*H/W);const g=c.getContext('2d'),w=c.width
 g.fillStyle=C.frost;g.fillRect(0,0,w,c.height)
 g.fillStyle=C.acc;g.fillRect(40,48,160,20)
 g.fillStyle=C.dk;g.globalAlpha=.85;g.fillRect(40,92,300,18)
 g.globalAlpha=.2;[432,400,432,300].forEach((l,i)=>g.fillRect(40,140+i*30,l,12))
 g.globalAlpha=.5;g.fillStyle=C.glow;g.fillRect(40,290,432,190)
 g.globalAlpha=.95;g.fillStyle=C.acc;g.beginPath();g.moveTo(40,480);g.lineTo(180,360);g.lineTo(260,430);g.lineTo(340,340);g.lineTo(472,480);g.fill()
 g.fillStyle=C.frost;g.beginPath();g.arc(400,335,22,0,6.3);g.fill()
 g.globalAlpha=.2;g.fillStyle=C.dk;[432,400,432,260].forEach((l,i)=>g.fillRect(40,510+i*30,l,12))
 return fit(new THREE.CanvasTexture(c),W,H)}
function badge(t,bg,fg){const c=document.createElement('canvas');c.width=256;c.height=108;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,256,108)
 g.fillStyle=fg;g.font='700 52px "Space Grotesk",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(t,128,56);return fit(new THREE.CanvasTexture(c),BW,BH)}
function shadowTex(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64)
 r.addColorStop(0,'rgba(0,0,0,.45)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)}

// A restrained constellation of glints around the existing paper stack.
function Dust({color}){
 const points=useMemo(()=>{const a=new Float32Array(75*3);for(let i=0;i<75;i++){
  const t=i*2.399963,rad=1.8+((i*37)%41)/41*2.1;
  a[i*3]=Math.cos(t)*rad+.4;a[i*3+1]=Math.sin(t)*rad*.78;
  a[i*3+2]=-1.5+((i*17)%29)/29*2.6;
 }return a},[])
 const mesh=useRef()
 useFrame(({clock})=>{if(mesh.current)mesh.current.rotation.z=Math.sin(clock.elapsedTime*.12)*.045})
 return <points ref={mesh}><bufferGeometry><bufferAttribute attach="attributes-position" args={[points,3]}/></bufferGeometry><pointsMaterial color={color} size={.035} transparent opacity={.48} sizeAttenuation depthWrite={false}/></points>
}
// Thin, non-spherical accent strokes: decorative motion, not an orbiting planet.
function AccentStrokes({color,boost}){
 const refs=useRef([])
 useFrame(({clock})=>{const t=clock.elapsedTime;refs.current.forEach((m,i)=>{if(!m)return;
  m.rotation.z=Math.sin(t*.45+i)*.09;
  m.scale.setScalar(1+Math.sin(t*1.2+i)*.025+boost.current*.075)
 })})
 return <group position={[.5,.05,-.7]}>{[0,1,2].map(i=><mesh key={i} ref={e=>refs.current[i]=e} position={[i===1?1.6:-1.3,i===2?-1.2:1.05,-.3-i*.15]} rotation={[0,0,i*.8]}>
  <torusGeometry args={[.46+i*.12,.008,4,80,Math.PI*(.85+i*.13)]}/>
  <meshBasicMaterial color={color} transparent opacity={.28-i*.05} depthWrite={false}/>
 </mesh>)}</group>
}
function Sparkles({color,boost}){
 const ref=useRef()
 const coords=useMemo(()=>Array.from({length:12},(_,i)=>{
  const a=i*2.39996,r=1.3+(i%4)*.52;return [Math.cos(a)*r+.55,Math.sin(a)*r*.85,.7+(i%3)*.25]
 }),[])
 useFrame(({clock})=>{if(!ref.current)return;ref.current.children.forEach((m,i)=>{
  const q=.65+.35*Math.sin(clock.elapsedTime*1.8+i*1.7);
  m.scale.setScalar((.6+q*.6)*(1+boost.current*1.7))
 })})
 return <group ref={ref}>{coords.map((pos,i)=><mesh key={i} position={pos} rotation={[0,0,Math.PI/4]}>
  <planeGeometry args={[i%3===0?.055:.025,i%3===0?.055:.025]}/>
  <meshBasicMaterial color={color} transparent opacity={i%3===0?.85:.45} depthWrite={false} side={THREE.DoubleSide}/>
 </mesh>)}</group>
}

function Scene({pulse}){
 const C=useMemo(cv,[]),geo=useMemo(()=>rr(W,H,.16,.07),[]),bgeo=useMemo(()=>rr(BW,BH,.2,.08),[]),front=useMemo(()=>page(C),[C]),shadow=useMemo(shadowTex,[])
 const back=[C.acc,C.glow,C.frost,C.acc]
 const chips=useMemo(()=>[['PDF',C.acc,C.on,[-1.5,1.55,1.4]],['DOCX',C.frost,C.dk,[-1.2,-1.6,1.5]]].map(([t,bg,fg,p])=>({t,p,map:badge(t,bg,fg)})),[C])
 const root=useRef(),sh=useRef([]),ch=useRef([]),sp=useRef(1.8),boost=useRef(0),last=useRef(pulse)
 useFrame(({pointer,clock},dt)=>{
  if(last.current!==pulse){last.current=pulse;boost.current=1}
  boost.current=Math.max(0,boost.current-dt*.55);const t=clock.elapsedTime
  sp.current+=((1+boost.current*.9)-sp.current)*Math.min(1,dt*3);const s=sp.current,r=root.current
  r.rotation.y+=(pointer.x*.42+Math.sin(t*.4)*.08-r.rotation.y)*Math.min(1,dt*4);r.rotation.x+=(-pointer.y*.23-r.rotation.x)*Math.min(1,dt*4);r.position.y=Math.sin(t*.55)*.065
  sh.current.forEach((m,i)=>{const d=N-1-i;m.position.set(-d*.42*s,d*.1*s+Math.sin(t*.9+i)*.04,i*.28);m.rotation.z=d*.07*s;m.rotation.y=Math.sin(t*.5+i*.8)*.028+boost.current*.035})
  ch.current.forEach((m,i)=>{m.position.y=chips[i].p[1]+Math.sin(t*.8+i*2)*.1;m.rotation.z=Math.sin(t*.6+i)*.05})})
 return <group ref={root}><Dust color={C.glow}/><AccentStrokes color={C.glow} boost={boost}/><Sparkles color={C.frost} boost={boost}/><group position={[.8,0,0]}>
  {Array.from({length:N},(_,i)=><mesh key={i} ref={e=>sh.current[i]=e} geometry={geo}>{i===N-1?<meshStandardMaterial map={front} roughness={.5}/>:<meshStandardMaterial color={back[i]} roughness={.45}/>}</mesh>)}
  {chips.map((c,i)=><mesh key={c.t} ref={e=>ch.current[i]=e} geometry={bgeo} position={c.p}><meshStandardMaterial map={c.map} roughness={.4}/></mesh>)}
  <mesh position={[0,-2.2,.5]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[6,3.4]}/><meshBasicMaterial map={shadow} transparent depthWrite={false}/></mesh></group></group>}
export default function Hero3D({pulse}){const C=useMemo(cv,[]),[on,setOn]=useState(true),[reduce,setReduce]=useState(false),el=useRef()
 useEffect(()=>{const o=new IntersectionObserver(([e])=>setOn(e.isIntersecting));if(el.current)o.observe(el.current);return()=>o.disconnect()},[])
 useEffect(()=>{const q=window.matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReduce(q.matches);sync();q.addEventListener?.('change',sync);return()=>q.removeEventListener?.('change',sync)},[])
 return <div ref={el} className="absolute inset-0"><Canvas flat dpr={[1,1.5]} frameloop={on&&!reduce?'always':'demand'} camera={{position:[0,0,8.5],fov:36}} gl={{antialias:true,alpha:true,powerPreference:'low-power'}}>
  <ambientLight intensity={.7}/><directionalLight position={[3,4,5]} intensity={1.3} color={C.frost}/><pointLight position={[-4,-2,3]} intensity={25} color={C.glow}/><Scene pulse={pulse}/></Canvas></div>}
