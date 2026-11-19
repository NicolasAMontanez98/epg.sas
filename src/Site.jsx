import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, ArrowUpRight, LogIn, Mail, MapPin, Menu, MessageCircle, X, Landmark, GraduationCap, Handshake, Target, ClipboardCheck, FileText, ShieldCheck, TriangleAlert, Users } from 'lucide-react'
import { api } from './api.js'

// Three.js va en un chunk aparte: el texto carga primero y las piezas llegan después.
export const load = () => import('./three/Scene.jsx')
export const Scene = lazy(load)
const Piece3D = lazy(() => load().then((m) => ({ default: m.Piece })))
const Hero3D = lazy(() => load().then((m) => ({ default: m.HeroPieces })))
export const Safe = lazy(() => load().then((m) => ({ default: m.Safe3D })))
export const Piece = (p) => <Suspense fallback={null}><Safe><Piece3D {...p} /></Safe></Suspense>

const ICONS = { Landmark, GraduationCap, Handshake, Target, ClipboardCheck, FileText, ShieldCheck, TriangleAlert, Users }
const SLOGAN = 'Cada decisión, una jugada maestra.'
const ease = [0.2, 0.8, 0.2, 1]

export const Rise = ({ children, delay = 0, x = 0, y = 40, rotate = 0, className, style, as = 'div' }) => {
  const C = motion[as]
  return (
    <C className={className} style={style} initial={{ opacity: 0, x, y, rotate }} whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.8, delay, ease }}>
      {children}
    </C>
  )
}

// Encabezado de sección como rótulo de plano: número de sección, cota y título.
export const Heading = ({ n, eyebrow, title, intro, dark }) => (
  <header className={`heading ${dark ? 'on-dark' : ''}`}>
    <Rise className="sec-tag mono" x={-30} y={0}>
      <span className="sec-n">{String(n).padStart(2, '0')}</span>
      <span className="dim" aria-hidden><i /></span>
      <span>{eyebrow}</span>
    </Rise>
    <Rise as="h2" delay={0.1}>{title}</Rise>
    {intro && <Rise as="p" delay={0.2} className="intro">{intro}</Rise>}
  </header>
)

// ---------- Regla métrica: reemplaza la barra de scroll ----------
const PX_PER_CM = 96 / 2.54
export function Ruler() {
  const { scrollYProgress } = useScroll()
  const top = useTransform(scrollYProgress, (p) => `clamp(16px, ${p * 100}%, calc(100% - 16px))`)
  const readout = useRef(null)
  const [total, setTotal] = useState(0)
  const range = () => document.documentElement.scrollHeight - innerHeight
  useEffect(() => {
    const ro = new ResizeObserver(() => setTotal(range() / PX_PER_CM))
    ro.observe(document.body)
    return () => ro.disconnect()
  }, [])
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (readout.current) readout.current.textContent = ((p * range()) / PX_PER_CM).toFixed(1).replace('.', ',')
  })
  const jump = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    scrollTo({ top: ((e.clientY - r.top) / r.height) * range(), behavior: 'smooth' })
  }
  return (
    <div className="ruler" onClick={jump} aria-hidden title="Regla de navegación: haga clic para desplazarse">
      {Array.from({ length: 11 }, (_, i) => (
        <span key={i} className="ruler-n mono" style={{ top: `${i * 10}%` }}>{Math.round((total * i) / 10)}</span>
      ))}
      <motion.div className="caliper" style={{ top }}>
        <span className="mono"><b ref={readout}>0,0</b> cm</span>
      </motion.div>
    </div>
  )
}

// ---------- Cinta de anuncios (banners del dashboard) ----------
function Ticker({ banners }) {
  if (!banners.length) return null
  const row = banners.map((b) => (
    <span key={b.id} className="tick-item">
      <b>■ {b.title}</b> {b.text}
      {b.linkUrl && <a href={b.linkUrl}>{b.linkLabel || 'Ver más'} →</a>}
    </span>
  ))
  return (
    <div className="ticker" role="region" aria-label="Anuncios">
      <div className="ticker-track">{row}{row}{row}{row}</div>
    </div>
  )
}

const NAV = [['#servicios', 'Servicios'], ['#metodo', 'Método'], ['#experiencia', 'Experiencia'], ['#equipo', 'Equipo'], ['#fechas', 'Fechas'], ['#infografias', 'Infografías']]

function Header({ banners, shown }) {
  const [open, setOpen] = useState(false)
  const links = NAV.filter(([h]) => shown[h])
  return (
    <header className="hdr">
      <Ticker banners={banners} />
      <nav className="nav" aria-label="Principal">
        <a href="#inicio" className="brand" aria-label="EPG S.A.S., ir al inicio">
          <img src="/logo.png" alt="" width="46" height="46" />
          <span className="brand-name">EPG S.A.S</span>
        </a>
        <button className="burger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menú">{open ? <X /> : <Menu />}</button>
        <ul className={open ? 'open' : ''} onClick={() => setOpen(false)}>
          {links.map(([h, t], i) => <li key={h}><a href={h}><span className="mono">0{i + 1}</span>{t}</a></li>)}
          <li><a href="/empalme"><span className="mono">★</span>Empalme 2028</a></li>
          <li><a href="/admin" className="login"><LogIn size={16} aria-hidden /> Iniciar sesión</a></li>
          <li><a href="#contacto" className="btn btn-red">Contáctenos <ArrowRight size={16} aria-hidden /></a></li>
        </ul>
      </nav>
    </header>
  )
}

function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const circleY = useTransform(scrollYProgress, [0, 1], [0, 160])
  const beamR = useTransform(scrollYProgress, [0, 1], [-28, -18])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60])
  return (
    <section id="inicio" className="hero" ref={ref}>
      <div className="blueprint" aria-hidden />
      <motion.div className="h-circle" style={{ y: circleY }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 1.1, ease }} aria-hidden />
      <motion.div className="h-beam" style={{ rotate: beamR }} initial={{ x: '-120%' }} animate={{ x: 0 }} transition={{ duration: 1, delay: 0.2, ease }} aria-hidden />
      <motion.div className="h-wedge" initial={{ x: 200, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1, delay: 0.4, ease }} aria-hidden />

      <motion.div className="hero-copy" style={{ y: textY }}>
        <motion.p className="tag mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          FIG. 01 — Asesoría integral para alcaldías municipales
        </motion.p>
        <h1 aria-label={SLOGAN}>
          {['Cada', 'decisión,'].map((w, i) => (
            <motion.span key={w} className="h1-line" initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: 0.15 + i * 0.1, ease }}>{w}</motion.span>
          ))}
          <motion.span className="h1-band" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: 0.55, ease }}>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.95 }}>una jugada</motion.span>
          </motion.span>
          <motion.span className="h1-line" initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: 0.45, ease }}>maestra.</motion.span>
        </h1>
        <motion.p className="lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.7 }}>
          Planeamos, construimos y entregamos los planes, informes y procesos que su alcaldía necesita, a tiempo y con rigor técnico. Usted se concentra en gobernar.
        </motion.p>
        <motion.div className="cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.7 }}>
          <a href="#contacto" className="btn btn-red btn-lg">Agende una asesoría <ArrowRight size={18} aria-hidden /></a>
          <a href="#servicios" className="btn btn-line btn-lg">Ver servicios</a>
        </motion.div>
      </motion.div>

      <div className="hero-stage">
        <Suspense fallback={<div className="stage-fallback" />}><Safe><Hero3D className="view" /></Safe></Suspense>
        <motion.div className="annot annot-h mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} aria-hidden>
          <span className="dim-v"><i /></span><span>H = 85 mm</span>
        </motion.div>
        <motion.div className="annot annot-q mono" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6 }}>
          <span className="leader" aria-hidden />
          <span><b>Pieza clave: la reina.</b> Se mueve en todas las direcciones. Nuestro equipo también.</span>
        </motion.div>
      </div>

      <p className="vert mono" aria-hidden>Estrategia — Gestión — Cumplimiento — Estrategia — Gestión</p>
      <p className="sheet mono" aria-hidden>ESC 1:1 · HOJA 01</p>
    </section>
  )
}

function Manifesto() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x1 = useTransform(scrollYProgress, [0, 1], ['5%', '-35%'])
  const x2 = useTransform(scrollYProgress, [0, 1], ['-35%', '5%'])
  return (
    <section className="manifesto" ref={ref} aria-label="La reina se mueve en todas las direcciones. Nosotros también.">
      <motion.p style={{ x: x1 }} aria-hidden>La reina se mueve en todas las direcciones ■ La reina se mueve en todas las direcciones ■</motion.p>
      <motion.p style={{ x: x2 }} className="outline" aria-hidden>Nosotros también ■ Nosotros también ■ Nosotros también ■ Nosotros también ■</motion.p>
    </section>
  )
}

const PILLARS = [
  ['Cumplimiento sin sobresaltos', 'Planes, informes y publicaciones entregados a tiempo y conforme a la normativa vigente. Sin hallazgos por omisión.'],
  ['Rigor de ingeniería', 'Cada entregable se diseña, se calcula y se verifica. Procesos medibles, documentados y trazables.'],
  ['Un solo aliado, todo el tablero', 'Del empalme al informe de seguimiento: una estrategia coherente para toda la administración.'],
]

function Value() {
  return (
    <section id="valor" className="section paper value">
      <div className="wrap">
        <Heading n={1} eyebrow="Propuesta de valor" title={<>Su alcaldía cumple.<br /><mark>Usted gobierna.</mark></>} intro="Convertimos las obligaciones técnicas y legales de la administración municipal en procesos ordenados, oportunos y verificables." />
        <div className="value-grid">
          <div className="pillars">
            {PILLARS.map(([t, d], i) => (
              <Rise key={t} delay={i * 0.12} x={-40} y={0} className="pillar" style={{ '--i': i }}>
                <span className="big-n" aria-hidden>0{i + 1}</span>
                <div><h3>{t}</h3><p>{d}</p></div>
              </Rise>
            ))}
          </div>
          <div className="piece-slot">
            <div className="slot-disc" aria-hidden />
            <Piece kind="pawn" color="red" className="view" />
            <p className="caption mono">FIG. 02 — Peón. Cada paso cuenta.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Services({ items }) {
  return (
    <section id="servicios" className="section ink services">
      <div className="blueprint dark" aria-hidden />
      <div className="wrap">
        <div className="svc-head">
          <Heading dark n={2} eyebrow="Servicios" title="Todas las piezas de su gestión, una sola estrategia" />
          <div className="piece-slot small">
            <div className="slot-tri" aria-hidden />
            <Piece kind="bishop" color="ivory" className="view" />
            <p className="caption mono">FIG. 03 — Alfil. Visión en diagonal.</p>
          </div>
        </div>
        <ol className="svc-list">
          {items.map((s, i) => {
            const Icon = ICONS[s.icon] || Landmark
            return (
              <Rise as="li" key={s.id} delay={(i % 2) * 0.08} y={30}>
                <span className="svc-code mono">SRV-{String(i + 1).padStart(2, '0')}</span>
                <Icon className="svc-ico" aria-hidden />
                <div><h3>{s.title}</h3><p>{s.description}</p></div>
                <ArrowUpRight className="svc-arrow" aria-hidden />
              </Rise>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

const STEPS = [
  ['1. e4', 'Apertura', 'Diagnóstico de la alcaldía y de las obligaciones pendientes. Medimos antes de mover.'],
  ['2. Cf3', 'Desarrollo', 'Plan de trabajo con responsables, productos y fechas. Cada pieza en su casilla.'],
  ['3. Ab5', 'Jugada', 'Elaboración, revisión técnica y publicación de los documentos requeridos.'],
  ['4. O-O', 'Enroque', 'Seguimiento, informes y blindaje de resultados frente a los entes de control.'],
]

function Method() {
  return (
    <section id="metodo" className="section paper method">
      <div className="wrap">
        <div className="method-head">
          <Heading n={3} eyebrow="Método" title="Cuatro movimientos, un objetivo" intro="Nuestra apertura favorita es la de siempre: orden, desarrollo y seguridad del rey. En su alcaldía, el rey es el cumplimiento." />
          <div className="piece-slot">
            <div className="slot-square" aria-hidden />
            <Piece kind="knight" color="black" className="view" />
            <p className="caption mono">FIG. 04 — Caballo. El salto que nadie ve venir.</p>
          </div>
        </div>
        <ol className="stairs">
          {STEPS.map(([note, t, d], i) => (
            <Rise as="li" key={t} delay={i * 0.15} y={60} style={{ '--i': i }}>
              <span className="note mono">{note}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </Rise>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Experience({ items }) {
  return (
    <section id="experiencia" className="section ink">
      <div className="wrap">
        <Heading dark n={4} eyebrow="Experiencia" title="Trayectoria que respalda cada jugada" />
        <ol className="xp">
          {items.map((e, i) => (
            <Rise as="li" key={e.id} delay={(i % 3) * 0.08}>
              <span className="mono xp-year">{e.year || '—'}</span>
              <div><h3>{e.entity}</h3><strong>{e.title}</strong>{e.description && <p>{e.description}</p>}</div>
            </Rise>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Team({ items }) {
  return (
    <section id="equipo" className="section paper">
      <div className="wrap">
        <div className="method-head">
          <Heading n={5} eyebrow="Equipo" title="Las mentes detrás de la estrategia" intro="Profesionales en gestión pública que planean, construyen y acompañan cada entrega. Liderados por una ingeniera, con el rigor que eso implica." />
          <div className="piece-slot">
            <div className="slot-disc" aria-hidden />
            <Piece kind="queen" color="red" className="view" />
            <p className="caption mono">FIG. 05 — Reina. Liderazgo en todas las direcciones.</p>
          </div>
        </div>
        <div className="team">
          {items.map((m, i) => (
            <Rise key={m.id} delay={(i % 3) * 0.1} rotate={i % 2 ? 2 : -2} className="member">
              <div className="photo">{m.photo ? <img src={m.photo} alt={m.name} loading="lazy" /> : <span aria-hidden>{m.name[0]}</span>}</div>
              <span className="mono role">{m.role}</span>
              <h3>{m.name}</h3>
              {m.bio && <p>{m.bio}</p>}
            </Rise>
          ))}
        </div>
      </div>
    </section>
  )
}

const day = (iso) => new Date(iso + 'T12:00:00')
function Dates({ items }) {
  return (
    <section id="fechas" className="section red-sec">
      <div className="wrap">
        <Heading dark n={6} eyebrow="Cronograma" title="Fechas que no puede dejar pasar" intro="Anticípese: cada fecha es una jugada que se prepara con tiempo." />
        <ol className="dates">
          {items.map((d, i) => (
            <Rise as="li" key={d.id} delay={i * 0.1} x={-40} y={0}>
              <time dateTime={d.date}>
                <b>{String(day(d.date).getDate()).padStart(2, '0')}</b>
                <span className="mono">{day(d.date).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}</span>
              </time>
              <div><h3>{d.title}</h3>{d.description && <p>{d.description}</p>}</div>
            </Rise>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Infographics({ items }) {
  return (
    <section id="infografias" className="section paper">
      <div className="wrap">
        <Heading n={7} eyebrow="Infografías" title="Información clara para decidir mejor" />
        <div className="sheets">
          {items.map((g, i) => (
            <Rise key={g.id} delay={(i % 3) * 0.1}>
              <a href={g.image} target="_blank" rel="noopener" className="sheet-card">
                <span className="mono">LÁMINA {String(i + 1).padStart(2, '0')}</span>
                <img src={g.image} alt={g.title} loading="lazy" />
                <h3>{g.title}</h3>{g.description && <p>{g.description}</p>}
              </a>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- Envío de solicitudes al servidor (se guardan en el panel y llegan por correo) ----------
export function useRequest() {
  const [state, setState] = useState({ status: 'idle', error: '' })
  const send = async (body) => {
    setState({ status: 'sending', error: '' })
    try { await api.sendRequest(body); setState({ status: 'sent', error: '' }) } catch (e) { setState({ status: 'error', error: e.message }) }
  }
  return [state, send, () => setState({ status: 'idle', error: '' })]
}
// Campo invisible para personas: si llega lleno, el servidor sabe que es un robot.
export const Trap = ({ value, onChange }) => (
  <input className="trap" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={value} onChange={(e) => onChange(e.target.value)} />
)
export const Consent = ({ id, checked, onChange }) => (
  <label className="consent" htmlFor={id}>
    <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} required />
    <span>Autorizo a EPG S.A.S. a tratar mis datos personales para responder esta solicitud, según la <a href="/privacidad" target="_blank" rel="noopener">política de tratamiento de datos</a> (Ley 1581 de 2012).</span>
  </label>
)

const BLANK_CONTACT = { name: '', town: '', email: '', phone: '', msg: '', consent: false, website: '' }
function Contact({ settings: s }) {
  const [f, setF] = useState(BLANK_CONTACT)
  const [towns, setTowns] = useState([])
  const [req, send, reset] = useRequest()
  // Lista oficial DIVIPOLA (DANE), cargada solo cuando el usuario llega al campo.
  const loadTowns = () => towns.length || fetch('/municipios.json').then((r) => r.json()).then(setTowns).catch(() => {})
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const text = `Hola EPG S.A.S., soy ${f.name}${f.town ? ` de ${f.town}` : ''}. ${f.msg}`
  const socials = [['Facebook', s.facebook], ['Instagram', s.instagram], ['LinkedIn', s.linkedin], ['TikTok', s.tiktok]].filter(([, u]) => u)
  const submit = (e) => {
    e.preventDefault()
    send({ source: 'contacto', name: f.name, town: f.town, email: f.email, phone: f.phone, message: f.msg, consent: f.consent, website: f.website })
  }
  return (
    <section id="contacto" className="section contact">
      <div className="c-wedge" aria-hidden />
      <div className="wrap contact-grid">
        <div>
          <Heading dark n={8} eyebrow="Contáctenos" title="Su turno. Hagamos la próxima jugada." intro="Cuéntenos qué necesita su alcaldía y le responderemos con una propuesta clara." />
          <div className="channels">
            {s.whatsapp && <a className="btn btn-paper btn-lg" href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener"><MessageCircle size={18} aria-hidden /> WhatsApp</a>}
            {s.email && <a className="btn btn-line light btn-lg" href={`mailto:${s.email}`}><Mail size={18} aria-hidden /> {s.email}</a>}
          </div>
          {(s.phoneLabel || s.address) && <p className="meta mono">{[s.phoneLabel, s.address].filter(Boolean).join(' · ')}</p>}
          {socials.length > 0 && <div className="socials">{socials.map(([n, u]) => <a key={n} href={u} target="_blank" rel="noopener" className="mono">{n} ↗</a>)}</div>}
          <div className="piece-slot king-slot">
            <Piece kind="king" color="red" className="view" />
          </div>
        </div>
        <Rise delay={0.15} x={40} y={0}>
          {req.status === 'sent' ? (
            <div className="form sent" role="status">
              <p className="form-title mono">Formulario EPG-01 · Recibido</p>
              <h3>Gracias, {f.name.split(' ')[0]}.</h3>
              <p>Recibimos su solicitud. Le responderemos {f.email ? `a ${f.email}` : `al ${f.phone}`} lo antes posible.</p>
              <button type="button" className="btn btn-line" onClick={() => { reset(); setF(BLANK_CONTACT) }}>Enviar otra solicitud</button>
            </div>
          ) : (
            <form className="form" onSubmit={submit}>
              <p className="form-title mono">Formulario EPG-01 · Solicitud de asesoría</p>
              <label htmlFor="c-name"><span className="mono">01 · Su nombre</span><input id="c-name" value={f.name} onChange={set('name')} required autoComplete="name" /></label>
              <label htmlFor="c-town"><span className="mono">02 · Municipio</span><input id="c-town" value={f.town} onChange={set('town')} onFocus={loadTowns} list="municipios" placeholder="Escriba para buscar…" autoComplete="off" /></label>
              <datalist id="municipios">{towns.map((t) => <option key={t} value={t} />)}</datalist>
              <div className="form-row">
                <label htmlFor="c-email"><span className="mono">03 · Correo</span><input id="c-email" type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>
                <label htmlFor="c-phone"><span className="mono">04 · Teléfono</span><input id="c-phone" type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" /></label>
              </div>
              <label htmlFor="c-msg"><span className="mono">05 · ¿En qué le ayudamos?</span><textarea id="c-msg" rows="4" value={f.msg} onChange={set('msg')} required /></label>
              <Trap value={f.website} onChange={(v) => setF({ ...f, website: v })} />
              <Consent id="c-consent" checked={f.consent} onChange={(v) => setF({ ...f, consent: v })} />
              {req.status === 'error' && <p className="form-error" role="alert">{req.error}</p>}
              <div className="channels">
                <button className="btn btn-red" disabled={req.status === 'sending'}>{req.status === 'sending' ? 'Enviando…' : 'Enviar solicitud'}</button>
                {s.whatsapp && <a className="btn btn-line" href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener"><MessageCircle size={16} aria-hidden /> Mejor por WhatsApp</a>}
              </div>
              <small className="form-note">Deje un correo o un teléfono para responderle.</small>
            </form>
          )}
        </Rise>
      </div>
    </section>
  )
}

export function Footer({ settings: s, links }) {
  const y = new Date().getFullYear()
  const socials = [['Facebook', s.facebook], ['Instagram', s.instagram], ['LinkedIn', s.linkedin], ['TikTok', s.tiktok]].filter(([, u]) => u)
  return (
    <footer className="footer">
      <div className="wrap foot-grid">
        <div className="foot-brand">
          <img src="/logo-text.png" alt="EPG S.A.S." width="96" height="96" />
          <div>
            <p className="foot-slogan">{SLOGAN}</p>
            <p className="foot-desc">Asesoría, capacitación y apoyo a la gestión para alcaldías municipales de Colombia.</p>
          </div>
        </div>
        <nav aria-label="Pie de página">
          <h3 className="mono">Navegación</h3>
          <ul>
            <li><a href="/#inicio">Inicio</a></li>
            {links.map(([h, t]) => <li key={h}><a href={'/' + h}>{t}</a></li>)}
            <li><a href="/empalme">Empalme 2028</a></li>
            <li><a href="/#contacto">Contáctenos</a></li>
          </ul>
        </nav>
        <div>
          <h3 className="mono">Contacto</h3>
          <ul>
            {s.whatsapp && <li><a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener"><MessageCircle size={16} aria-hidden /> WhatsApp</a></li>}
            {s.email && <li><a href={`mailto:${s.email}`}><Mail size={16} aria-hidden /> {s.email}</a></li>}
            {s.phoneLabel && <li>{s.phoneLabel}</li>}
            {s.address && <li><MapPin size={16} aria-hidden /> {s.address}</li>}
          </ul>
        </div>
        <div>
          {socials.length > 0 && (
            <>
              <h3 className="mono">Síganos</h3>
              <ul className="foot-socials">{socials.map(([n, u]) => <li key={n}><a href={u} target="_blank" rel="noopener">{n} ↗</a></li>)}</ul>
            </>
          )}
          <h3 className="mono">Clientes y empleados</h3>
          <ul>
            <li><a href="/admin"><LogIn size={16} aria-hidden /> Iniciar sesión</a></li>
          </ul>
        </div>
      </div>
      <div className="wrap foot-bottom mono">
        <span>© {y} EPG S.A.S. Todos los derechos reservados.</span>
        <span><a href="/privacidad">Política de tratamiento de datos</a> · Hecho en Colombia</span>
      </div>
    </footer>
  )
}

const EMPTY = { settings: {}, banners: [], services: [], team: [], dates: [], experience: [], infographics: [] }

export default function Site() {
  const [c, setC] = useState(null)
  useEffect(() => { api.content().then(setC).catch(() => setC(EMPTY)) }, [])
  // El contenido llega después de cargar: si la URL trae #seccion (p. ej. desde /empalme), bajar cuando exista.
  useEffect(() => { if (c && location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView() }, [c])
  if (!c) return <div className="loading mono" role="status">EPG S.A.S. — cargando plano…</div>
  const today = new Date().toISOString().slice(0, 10)
  const dates = c.dates.filter((d) => d.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const shown = { '#servicios': c.services.length, '#metodo': 1, '#experiencia': c.experience.length, '#equipo': 1, '#fechas': dates.length, '#infografias': c.infographics.length }
  return (
    <>
      <Ruler />
      <Header banners={c.banners} shown={shown} />
      <main>
        <Hero />
        <Manifesto />
        <Value />
        {c.services.length > 0 && <Services items={c.services} />}
        <Method />
        {c.experience.length > 0 && <Experience items={c.experience} />}
        <Team items={c.team} />
        {dates.length > 0 && <Dates items={dates} />}
        {c.infographics.length > 0 && <Infographics items={c.infographics} />}
        <Contact settings={c.settings} />
      </main>
      <Footer settings={c.settings} links={NAV.filter(([h]) => shown[h])} />
      <Suspense fallback={null}><Safe><Scene /></Safe></Suspense>
    </>
  )
}
