import { Component, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, PerspectiveCamera, RoundedBox, View } from '@react-three/drei'

// ---------- Geometría: piezas torneadas (lathe) como una pieza Staunton real ----------
const v2 = (pts) => pts.map(([x, y]) => new THREE.Vector2(x, y))
// Perfil suave (spline) + tramo duro opcional; x se recorta en 0 para que el spline no cruce el eje.
function lathe(smooth, hard = []) {
  const pts = new THREE.SplineCurve(v2(smooth)).getPoints(220).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y))
  return new THREE.LatheGeometry([...pts, ...v2(hard)], 128)
}
const BASE = [[0, 0], [1.0, 0], [1.06, 0.04], [1.07, 0.12], [1.0, 0.18], [0.95, 0.21], [0.97, 0.27], [0.9, 0.34], [0.78, 0.38], [0.72, 0.44], [0.74, 0.5], [0.66, 0.56]]

const G = {
  queen: lathe([...BASE, [0.56, 0.66], [0.46, 0.9], [0.38, 1.25], [0.32, 1.65], [0.29, 2.0], [0.3, 2.14], [0.48, 2.2], [0.5, 2.27], [0.4, 2.32], [0.44, 2.38], [0.34, 2.44], [0.3, 2.5], [0.33, 2.7], [0.42, 2.9], [0.54, 3.06], [0.6, 3.12], [0.56, 3.16], [0.4, 3.18], [0.24, 3.24], [0.12, 3.3], [0, 3.32]]),
  king: lathe([...BASE, [0.56, 0.66], [0.46, 0.9], [0.38, 1.25], [0.32, 1.65], [0.29, 2.0], [0.3, 2.14], [0.48, 2.2], [0.5, 2.27], [0.4, 2.32], [0.44, 2.38], [0.34, 2.44], [0.3, 2.5], [0.34, 2.72], [0.46, 2.96], [0.5, 3.05], [0.46, 3.1], [0.3, 3.16], [0.16, 3.2], [0, 3.22]]),
  rook: lathe([...BASE, [0.6, 0.64], [0.55, 0.85], [0.52, 1.25], [0.5, 1.7], [0.52, 1.98], [0.6, 2.08], [0.63, 2.18], [0.63, 2.3]], [[0.42, 2.3], [0.42, 2.22], [0, 2.22]]),
  pawn: lathe([...BASE, [0.55, 0.64], [0.42, 0.85], [0.34, 1.1], [0.3, 1.3], [0.42, 1.36], [0.44, 1.42], [0.3, 1.48], [0.2, 1.52], [0.05, 1.6], [0, 1.62]]),
  bishop: lathe([...BASE, [0.54, 0.66], [0.42, 0.95], [0.34, 1.4], [0.28, 1.85], [0.28, 2.0], [0.44, 2.06], [0.46, 2.12], [0.34, 2.17], [0.4, 2.22], [0.3, 2.28], [0.22, 2.32], [0.3, 2.42], [0.38, 2.62], [0.36, 2.82], [0.26, 3.0], [0.12, 3.12], [0, 3.15]]),
  knightBase: lathe([...BASE, [0.62, 0.62], [0.6, 0.7]], [[0.6, 0.72], [0, 0.72]]),
  sphere: new THREE.SphereGeometry(1, 48, 32),
}

// Almenas de la torre: sectores de anillo extruidos con bisel.
G.merlon = (() => {
  const s = new THREE.Shape()
  const a = THREE.MathUtils.degToRad(42)
  s.absarc(0, 0, 0.6, -a / 2, a / 2, false)
  s.absarc(0, 0, 0.44, a / 2, -a / 2, true)
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.26, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.025, bevelSegments: 4, curveSegments: 24 })
  g.rotateX(-Math.PI / 2)
  return g
})()

// Cabeza del caballo: silueta extruida con bisel amplio para que se lea como tallada.
G.knightHead = (() => {
  const s = new THREE.Shape()
  s.moveTo(0.5, 0)
  s.bezierCurveTo(0.64, 0.45, 0.68, 0.95, 0.44, 1.38)
  s.bezierCurveTo(0.34, 1.55, 0.24, 1.66, 0.18, 1.88)
  s.lineTo(0.05, 1.68)
  s.bezierCurveTo(-0.18, 1.63, -0.42, 1.42, -0.58, 1.13)
  s.bezierCurveTo(-0.7, 0.96, -0.62, 0.82, -0.48, 0.8)
  s.bezierCurveTo(-0.34, 0.79, -0.2, 0.85, -0.08, 0.9)
  s.bezierCurveTo(-0.24, 0.68, -0.44, 0.38, -0.46, 0)
  s.lineTo(0.5, 0)
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.09, bevelSegments: 10, curveSegments: 64 })
  g.translate(0, 0, -0.21)
  return g
})()

// ---------- Materiales: laca negra, laca roja y marfil con barniz ----------
const MAT = {
  black: { color: '#0c0c0e', roughness: 0.14, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, reflectivity: 0.6 },
  red: { color: '#9a0e16', roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.4, sheenColor: '#ff6060' },
  ivory: { color: '#e9dfcc', roughness: 0.3, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.15 },
}
const Mat = ({ c }) => <meshPhysicalMaterial {...MAT[c]} />
const M = ({ geo, c, ...p }) => <mesh geometry={geo} castShadow receiveShadow {...p}><Mat c={c} /></mesh>

const PIECES = {
  queen: ({ c }) => (
    <>
      <M geo={G.queen} c={c} />
      <M geo={G.sphere} c={c} position={[0, 3.44, 0]} scale={0.14} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2
        return <M key={i} geo={G.sphere} c={c} position={[Math.cos(a) * 0.56, 3.16, Math.sin(a) * 0.56]} scale={0.075} />
      })}
    </>
  ),
  king: ({ c }) => (
    <>
      <M geo={G.king} c={c} />
      <RoundedBox args={[0.15, 0.56, 0.15]} radius={0.04} position={[0, 3.48, 0]} castShadow><Mat c={c} /></RoundedBox>
      <RoundedBox args={[0.42, 0.15, 0.15]} radius={0.04} position={[0, 3.56, 0]} castShadow><Mat c={c} /></RoundedBox>
    </>
  ),
  rook: ({ c }) => (
    <>
      <M geo={G.rook} c={c} />
      {Array.from({ length: 5 }, (_, i) => <M key={i} geo={G.merlon} c={c} position={[0, 2.3, 0]} rotation={[0, (i / 5) * Math.PI * 2, 0]} />)}
    </>
  ),
  pawn: ({ c }) => (
    <>
      <M geo={G.pawn} c={c} />
      <M geo={G.sphere} c={c} position={[0, 1.84, 0]} scale={0.36} />
    </>
  ),
  bishop: ({ c }) => (
    <>
      <M geo={G.bishop} c={c} />
      <M geo={G.sphere} c={c} position={[0, 3.22, 0]} scale={0.085} />
    </>
  ),
  knight: ({ c }) => (
    <>
      <M geo={G.knightBase} c={c} />
      <M geo={G.knightHead} c={c} position={[0, 0.66, 0]} scale={1.08} />
    </>
  ),
}
const HEIGHT = { queen: 3.6, king: 3.75, rook: 2.6, pawn: 2.2, bishop: 3.3, knight: 2.7 }

const still = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------- Estudio fotográfico: softboxes reflejados en la laca + sombra de contacto ----------
function Studio({ shadowScale = 8 }) {
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[3, 7, 5]} intensity={2} />
      <directionalLight position={[-6, 3, -4]} intensity={0.8} color="#ffd9d0" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={5} position={[0, 6, 1]} scale={[8, 3, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={3} position={[-5, 2, 1]} scale={[2, 7, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={3} position={[5, 2, -1]} scale={[2, 7, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" color="#ff2a2a" intensity={2.2} position={[0, 2, 7]} scale={2.5} />
        <Lightformer form="rect" intensity={1} position={[0, 1, -6]} scale={[10, 2, 1]} />
      </Environment>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.6} scale={shadowScale} blur={2.2} far={4} resolution={512} color="#1a0003" />
    </>
  )
}

function Turntable({ speed = 0.25, children, ...p }) {
  const ref = useRef()
  useFrame((_, d) => { if (!still) ref.current.rotation.y += d * speed })
  return <group ref={ref} {...p}>{children}</group>
}

// Inclina el grupo siguiendo el puntero, con amortiguación.
function Tilt({ amount = 0.18, children }) {
  const ref = useRef()
  useFrame(({ pointer }, d) => {
    if (still) return
    const k = 1 - Math.exp(-d * 3)
    ref.current.rotation.y += (pointer.x * amount - ref.current.rotation.y) * k
    ref.current.rotation.x += (-pointer.y * amount * 0.35 - ref.current.rotation.x) * k
  })
  return <group ref={ref}>{children}</group>
}

const Cam = ({ h, dist = 8 }) => (
  <PerspectiveCamera makeDefault fov={30} position={[0, h * 0.62, dist]} onUpdate={(c) => c.lookAt(0, h * 0.46, 0)} />
)

// Una pieza sola, girando sobre su eje.
export function Piece({ kind = 'queen', color = 'black', className }) {
  const P = PIECES[kind]
  const h = HEIGHT[kind]
  return (
    <View className={className}>
      <Cam h={h} dist={h * 2.6 + 1.5} />
      <Studio />
      <Tilt amount={0.25}>
        <Turntable speed={0.3}><P c={color} /></Turntable>
      </Tilt>
    </View>
  )
}

// En vistas angostas (móvil) aleja la cámara para que los caballos no se corten.
function HeroCam() {
  const width = useThree((s) => s.size.width) // ancho del canvas completo, no de la vista
  const z = 15 * Math.max(1, 560 / (width || 560))
  return <PerspectiveCamera makeDefault fov={28} position={[0, 2.8, z]} onUpdate={(c) => c.lookAt(0, 1.6, 0)} />
}

// El logo de EPG en 3D: reina al frente, torres rojas, caballos negros mirando hacia afuera.
export function HeroPieces({ className }) {
  return (
    <View className={className}>
      <HeroCam />
      <Studio shadowScale={12} />
      <Tilt amount={0.22}>
        <Turntable speed={0.18} position={[0, 0, 0.9]} scale={1.12}><PIECES.queen c="black" /></Turntable>
        <group position={[-1.25, 0, -0.3]} scale={0.88}><PIECES.rook c="red" /></group>
        <group position={[1.25, 0, -0.3]} scale={0.88}><PIECES.rook c="red" /></group>
        <group position={[-2.75, 0, -0.6]} scale={1.02} rotation={[0, 0.35, 0]}><PIECES.knight c="black" /></group>
        <group position={[2.75, 0, -0.6]} scale={1.02} rotation={[0, Math.PI - 0.35, 0]}><PIECES.knight c="black" /></group>
      </Tilt>
    </View>
  )
}

// Si el equipo no soporta WebGL, la web sigue funcionando sin las piezas.
export class Safe3D extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

export default function Scene() {
  return (
    <Canvas
      className="gl"
      eventSource={document.getElementById('root')}
      eventPrefix="client"
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
    >
      <View.Port />
    </Canvas>
  )
}
