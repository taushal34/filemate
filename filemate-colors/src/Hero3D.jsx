import {useRef,useMemo,useEffect,useState} from 'react'
import {Canvas,useFrame} from '@react-three/fiber'
import * as THREE from 'three'
const v=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim()
const cv=()=>({acc:v('--acc'),glow:v('--glow'),frost:v('--frost'),dk:v('--dk')})
const tex=(t,bg)=>{const c=document.createElement('canvas');c.width=256;c.height=340;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,256,340);g.fillStyle=v('--dk');g.font='700 64px "Space Grotesk",sans-serif';g.fillText(t,24,300);return new THREE.CanvasTexture(c)}
function Scene({pulse}){
 const C=useMemo(cv,[]),FILES=useMemo(()=>[['PDF',C.glow],['JPG',C.acc],['DOCX',C.frost]],[C]),root=useRef(),ring=useRef(),orb=useRef(),boost=useRef(0),last=useRef(pulse),maps=useMemo(()=>FILES.map(([t,c])=>tex(t,c)),[FILES])
 useFrame(({pointer,clock},dt)=>{
  if(last.current!==pulse){last.current=pulse;boost.current=1}
  boost.current=Math.max(0,boost.current-dt*.8);const b=boost.current,t=clock.elapsedTime
  root.current.rotation.y+=(pointer.x*.5-root.current.rotation.y)*.05;root.current.rotation.x+=(-pointer.y*.3-root.current.rotation.x)*.05
  ring.current.rotation.y+=dt*(.35+b*4);orb.current.scale.setScalar(1+Math.sin(t*2)*.03+b*.35)})
 return <group ref={root}>
  <mesh ref={orb}><icosahedronGeometry args={[.9,3]}/><meshStandardMaterial color={C.acc} emissive={C.glow} emissiveIntensity={.6} roughness={.25} metalness={.3}/></mesh>
  <mesh rotation={[1.3,0,0]}><torusGeometry args={[1.25,.012,8,96]}/><meshBasicMaterial color={C.frost}/></mesh>
  <group ref={ring}>{FILES.map((f,i)=>{const a=i/3*Math.PI*2;return <group key={f[0]} position={[Math.cos(a)*2.3,Math.sin(i*2)*.4,Math.sin(a)*2.3]} rotation={[0,-a+Math.PI/2,0]}>
   <mesh><boxGeometry args={[1,1.32,.08]}/><meshStandardMaterial map={maps[i]} roughness={.3} emissive={f[1]} emissiveIntensity={.12}/></mesh></group>})}</group>
  <mesh position={[0,-2,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[2.2,48]}/><meshBasicMaterial color={C.glow} transparent opacity={.08}/></mesh></group>}
export default function Hero3D({pulse}){const C=useMemo(cv,[]),[on,setOn]=useState(true),el=useRef()
 useEffect(()=>{const o=new IntersectionObserver(([e])=>setOn(e.isIntersecting));o.observe(el.current);return()=>o.disconnect()},[])
 return <div ref={el} className="absolute inset-0"><Canvas dpr={[1,1.5]} frameloop={on?'always':'never'} camera={{position:[0,.6,6.5],fov:42}} gl={{antialias:true,alpha:true,powerPreference:'low-power'}}>
  <ambientLight intensity={.7}/><pointLight position={[3,3,4]} intensity={40} color={C.frost}/><pointLight position={[-4,-1,-2]} intensity={30} color={C.glow}/><Scene pulse={pulse}/></Canvas></div>}
