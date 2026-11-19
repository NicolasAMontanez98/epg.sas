import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Copy, LogIn, Mail, Menu, MessageCircle, Search, X } from 'lucide-react'
import { api } from './api.js'
import { Consent, Footer, Heading, load, Piece, Rise, Ruler, Safe, Scene, Trap, useRequest } from './Site.jsx'
import { ALERT_TYPES, GENERAL_FIELDS, GROUPS, INDEX_STATUSES, KEY_DATES, MOMENTS, PHASES, RISKS, SHEETS } from './empalme/data.js'
import { alertLevel, daysUntil, ley951, progress, RANGE, toTSV } from './empalme/logic.js'
import './empalme/empalme.css'

const Empalme3D = lazy(() => load().then((m) => ({ default: m.EmpalmePieces })))
const ease = [0.2, 0.8, 0.2, 1]
const fmt = (s, opts = { day: 'numeric', month: 'long', year: 'numeric' }) => (s ? new Date(s + 'T12:00:00').toLocaleDateString('es-CO', opts) : '')

// Lo que la persona escribe en el asistente queda en su navegador para retomarlo después.
const KEY = 'epg-empalme-v1'
function useSaved(name, initial) {
  const [v, setV] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY))?.[name] ?? initial } catch { return initial }
  })
  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem(KEY) || '{}')
      localStorage.setItem(KEY, JSON.stringify({ ...all, [name]: v }))
    } catch { /* sin almacenamiento: el asistente funciona igual, solo no recuerda */ }
  }, [name, v])
  return [v, setV]
}

// Copia al portapapeles; si el navegador lo impide, muestra el texto seleccionado para copiarlo a mano.
function CopyButton({ text, label }) {
  const [state, setState] = useState('idle')
  return (
    <span className="copy-wrap">
      <button type="button" className="btn btn-red" disabled={!text} onClick={() => {
        navigator.clipboard?.writeText(text).then(() => { setState('ok'); setTimeout(() => setState('idle'), 2500) }, () => setState('manual'))
          ?? setState('manual')
      }}>
        {state === 'ok' ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />} {state === 'ok' ? 'Copiado' : label}
      </button>
      {state === 'manual' && <textarea className="manual-copy" readOnly value={text} rows={4} onFocus={(e) => e.target.select()} autoFocus aria-label="Texto para copiar con Ctrl + C" />}
    </span>
  )
}

const NAV = [['#que-es', 'Qué es'], ['#ruta', 'Ruta'], ['#formatos', 'Formatos'], ['#asistente', 'Asistente'], ['#alertas', 'Alertas']]

function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="hdr">
      <nav className="nav" aria-label="Empalme">
        <a href="/" className="brand" aria-label="EPG S.A.S., ir a la página principal">
          <img src="/logo.png" alt="" width="46" height="46" />
          <span className="brand-name">EPG S.A.S</span>
        </a>
        <button className="burger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menú">{open ? <X /> : <Menu />}</button>
        <ul className={open ? 'open' : ''} onClick={() => setOpen(false)}>
          {NAV.map(([h, t], i) => <li key={h}><a href={h}><span className="mono">0{i + 1}</span>{t}</a></li>)}
          <li><a href="/"><ArrowLeft size={15} aria-hidden /> Web EPG</a></li>
          <li><a href="/admin" className="login"><LogIn size={16} aria-hidden /> Iniciar sesión</a></li>
          <li><a href="#contacto" className="btn btn-red">Acompañamiento <ArrowRight size={16} aria-hidden /></a></li>
        </ul>
      </nav>
    </header>
  )
}

function Countdown() {
  const items = [['2027-10-31', 'para las elecciones'], ['2028-01-01', 'para la posesión']]
  return (
    <div className="countdown">
      {items.map(([d, label]) => {
        const n = daysUntil(d)
        return (
          <div key={d} className="cd">
            <b>{n > 0 ? n.toLocaleString('es-CO') : '✓'}</b>
            <span className="mono">{n > 0 ? `días ${label}` : `${label.replace('para ', '')}: ${fmt(d)}`}</span>
          </div>
        )
      })}
    </div>
  )
}

function Hero() {
  return (
    <section id="inicio" className="hero e-hero">
      <div className="blueprint" aria-hidden />
      <motion.div className="h-circle" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 1.1, ease }} aria-hidden />
      <motion.div className="h-beam" style={{ rotate: 16 }} initial={{ x: '120%' }} animate={{ x: 0 }} transition={{ duration: 1, delay: 0.2, ease }} aria-hidden />
      <div className="hero-copy">
        <motion.p className="tag mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>FIG. E — Transición de gobierno 2024-2027 → 2028-2031</motion.p>
        <h1 aria-label="Entregue con orden. Reciba con certeza.">
          <motion.span className="h1-line" initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease }}>Entregue</motion.span>
          <motion.span className="h1-band" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: 0.45, ease }}>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}>con orden.</motion.span>
          </motion.span>
          <motion.span className="h1-line" initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: 0.35, ease }}>Reciba con certeza.</motion.span>
        </h1>
        <motion.p className="lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          Todo lo que su alcaldía necesita para el empalme: qué es, cuándo hacer cada cosa y cómo diligenciar el libro de formatos, hoja por hoja.
        </motion.p>
        <motion.div className="cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}>
          <a href="#asistente" className="btn btn-red btn-lg">Empezar a diligenciar <ArrowRight size={18} aria-hidden /></a>
          <a href="#ruta" className="btn btn-line btn-lg">Ver la ruta</a>
        </motion.div>
        <Countdown />
      </div>
      <div className="hero-stage">
        <Suspense fallback={null}><Safe><Empalme3D className="view" /></Safe></Suspense>
        <p className="annot annot-q mono"><b>Saliente → Entrante</b> El rey cambia de color; el tablero sigue en orden.</p>
      </div>
    </section>
  )
}

function WhatIs() {
  return (
    <section id="que-es" className="section paper">
      <div className="wrap">
        <div className="method-head">
          <Heading n={1} eyebrow="Qué es el empalme" title="Tres momentos, una sola transición" intro="El empalme no empieza después de las elecciones. Su calidad depende de cómo se organice la información durante 2027." />
          <div className="piece-slot small-slot">
            <div className="slot-disc" aria-hidden />
            <Piece kind="rook" color="blue" className="view" />
            <p className="caption mono">FIG. E1 — Torre. Lo que se entrega queda en firme.</p>
          </div>
        </div>
        <ol className="stairs">
          {MOMENTS.map(([t, d], i) => (
            <Rise as="li" key={t} delay={i * 0.12} style={{ '--i': i }}>
              <span className="note mono">Momento {i + 1}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </Rise>
          ))}
        </ol>
        <div className="law-grid">
          <Rise className="law"><span className="mono">Ley 951 de 2005</span><h3>Es obligatorio</h3><p>Entregar y recibir es un deber legal. El acta de informe de gestión se firma dentro de los 15 días hábiles siguientes al retiro, y el entrante tiene 30 días hábiles para verificarla.</p></Rise>
          <Rise className="law" delay={0.1}><span className="mono">20 mesas temáticas</span><h3>Se trabaja por mesas</h3><p>Una mesa por competencia municipal. Cada una revisa sus hojas del libro y cierra cada sesión con un acta parcial firmada por ambas administraciones.</p></Rise>
          <Rise className="law" delay={0.2}><span className="mono">Control Interno</span><h3>Voz, sin voto</h3><p>Asesora, verifica y alerta. No aprueba ni refrenda el informe de gestión.</p></Rise>
        </div>
      </div>
    </section>
  )
}

function Route() {
  return (
    <section id="ruta" className="section ink">
      <div className="blueprint dark" aria-hidden />
      <div className="wrap">
        <Heading dark n={2} eyebrow="Ruta" title="Cuatro fases, de enero de 2027 a febrero de 2028" />
        <ol className="phases">
          {PHASES.map((p, i) => (
            <Rise as="li" key={p.n} delay={i * 0.12} y={50}>
              <span className="phase-n">{p.n}</span>
              <span className="mono phase-when">{p.when}</span>
              <h3>{p.name}</h3>
              <ul>{p.items.map((t) => <li key={t}>{t}</li>)}</ul>
            </Rise>
          ))}
        </ol>
        <h3 className="sub-h mono">Fechas críticas</h3>
        <ol className="key-dates">
          {KEY_DATES.map((d, i) => (
            <Rise as="li" key={d.date} delay={i * 0.08} x={-30} y={0}>
              <time dateTime={d.date}><b>{fmt(d.date, { day: '2-digit' })}</b><span className="mono">{fmt(d.date, { month: 'short', year: 'numeric' })}</span></time>
              <div><h4>{d.title}</h4><p>{d.text}</p></div>
            </Rise>
          ))}
        </ol>
        <p className="disclaimer mono">Fechas sugeridas según el calendario electoral publicado. Confírmelas con el calendario oficial de la Registraduría.</p>
      </div>
    </section>
  )
}

const LEGEND = [
  ['#fff6c2', 'Amarillo claro', 'Celda de captura: aquí se escribe.'],
  ['#e1e1e1', 'Gris', 'Fórmula: no se toca, se calcula sola.'],
  ['#dbe8ff', 'Azul claro', 'Listado sugerido: elija de la lista.'],
  ['linear-gradient(90deg,#d64545 0 33%,#e3a33b 33% 66%,#4f9a5b 66%)', 'Semáforo', 'Nivel de alerta calculado.'],
]
const RULES = [
  'Llene primero la hoja 01: sus datos aparecen en el encabezado de todas las demás.',
  'Toda cifra lleva su fuente (sistema, informe o acto) y su fecha de corte.',
  'Valores en pesos corrientes, sin decimales, salvo que el encabezado diga otra cosa.',
  'Para agregar filas, insértelas dentro de la tabla (clic derecho → Insertar fila): así se conservan formatos y fórmulas.',
  'Nunca escriba usuarios ni contraseñas en el libro. Las credenciales se entregan en sobre sellado desde el 1 de enero.',
]

function Formats() {
  const [group, setGroup] = useState('Todas')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState('01')
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return SHEETS.filter((s) => (group === 'Todas' || s.group === group) && (!t || `${s.code} ${s.name} ${s.content} ${s.owner}`.toLowerCase().includes(t)))
  }, [group, q])
  const cur = SHEETS.find((s) => s.code === sel)
  return (
    <section id="formatos" className="section paper">
      <div className="wrap">
        <Heading n={3} eyebrow="Libro de formatos" title="40 hojas, explicadas una por una" intro="Cada dependencia diligencia las hojas que le asigna el índice. Elija una hoja para ver qué contiene, quién la llena y en qué fijarse." />
        <div className="legend">
          {LEGEND.map(([c, t, d]) => (
            <div key={t} className="swatch"><i style={{ background: c }} aria-hidden /><div><b>{t}</b><span>{d}</span></div></div>
          ))}
        </div>
        <ul className="rules">{RULES.map((r) => <li key={r}>{r}</li>)}</ul>

        <div className="explorer">
          <div className="ex-list">
            <div className="ex-tools">
              <label className="search"><Search size={16} aria-hidden /><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar hoja, tema o dependencia" aria-label="Buscar hoja" /></label>
              <div className="chips" role="group" aria-label="Filtrar por grupo">
                {[['Todas', 'Todas'], ...GROUPS.map(([k, l]) => [k, l.split(' · ')[0]])].map(([k, l]) => (
                  <button key={k} type="button" className={group === k ? 'on' : ''} aria-pressed={group === k} onClick={() => setGroup(k)}>{l}</button>
                ))}
              </div>
            </div>
            <ul className="sheet-list">
              {list.map((s) => (
                <li key={s.code}>
                  <button type="button" className={sel === s.code ? 'on' : ''} aria-pressed={sel === s.code} onClick={() => setSel(s.code)}>
                    <span className="mono code">{s.code}</span><span>{s.name}</span>
                  </button>
                </li>
              ))}
              {list.length === 0 && <li className="empty">Ninguna hoja coincide con “{q}”.</li>}
            </ul>
          </div>
          {cur && (
            <motion.article key={cur.code} className="ex-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }} aria-live="polite">
              <span className="mono">{GROUPS.find(([k]) => k === cur.group)?.[1]} · Hoja {cur.code}</span>
              <h3>{cur.name}</h3>
              <p className="ex-content">{cur.content}</p>
              <dl>
                <div><dt className="mono">Responsable</dt><dd>{cur.owner}</dd></div>
                <div><dt className="mono">Mesa</dt><dd>{cur.mesa}</dd></div>
              </dl>
              <p className="ex-tip"><b>Cómo diligenciarla.</b> {cur.tip}</p>
            </motion.article>
          )}
        </div>
      </div>
    </section>
  )
}

// ---------- Asistente ----------
function GeneralData() {
  const init = Object.fromEntries(GENERAL_FIELDS.map((f) => [f.key, f.value ?? '']))
  const [v, setV] = useSaved('general', init)
  const [towns, setTowns] = useState([])
  const loadTowns = () => towns.length || fetch('/divipola.json').then((r) => r.json()).then(setTowns).catch(() => {})
  const set = (k, val) => {
    const next = { ...v, [k]: val }
    // Al elegir un municipio de la lista oficial se completan departamento y código DANE.
    if (k === 'municipio') {
      const hit = towns.find(([n, d]) => `${n}, ${d}` === val)
      if (hit) Object.assign(next, { municipio: hit[0], departamento: hit[1], dane: hit[2] })
    }
    setV(next)
  }
  const invalid = GENERAL_FIELDS.filter((f) => f.pattern && v[f.key] && !new RegExp(`^${f.pattern}$`).test(v[f.key]))
  const filled = GENERAL_FIELDS.filter((f) => String(v[f.key] ?? '').trim()).length
  const tsv = toTSV(GENERAL_FIELDS.map((f) => [v[f.key]]))
  return (
    <div className="tool">
      <p className="tool-intro">Complete los datos aquí y péguelos en la hoja <b>01 Datos generales</b>: seleccione la celda <b>C5</b> y pegue. Cada dato cae en su fila. <span className="mono">{filled} / {GENERAL_FIELDS.length} campos</span></p>
      <div className="form-grid">
        {GENERAL_FIELDS.map((f, i) => {
          const id = `g-${f.key}`
          const bad = invalid.includes(f)
          return (
            <label key={f.key} htmlFor={id} className={bad ? 'bad' : ''}>
              <span className="mono">C{i + 5} · {f.label}</span>
              {f.options ? (
                <select id={id} value={v[f.key]} onChange={(e) => set(f.key, e.target.value)}>
                  <option value="">—</option>{f.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input id={id} type={f.type || 'text'} value={v[f.key]} onChange={(e) => set(f.key, e.target.value)}
                  {...(f.key === 'municipio' ? { list: 'divipola', onFocus: loadTowns, autoComplete: 'off', placeholder: 'Escriba para buscar…' } : {})}
                  inputMode={f.pattern ? 'numeric' : undefined} />
              )}
              {bad && <small>Formato esperado: {f.hint}</small>}
            </label>
          )
        })}
        <datalist id="divipola">{towns.map(([n, d]) => <option key={`${n}-${d}`} value={`${n}, ${d}`} />)}</datalist>
      </div>
      <div className="tool-actions">
        <CopyButton text={filled ? tsv : ''} label="Copiar para la hoja 01" />
        <button type="button" className="btn btn-line" onClick={() => setV(init)}>Limpiar</button>
      </div>
    </div>
  )
}

const BLANK_ALERT = { origin: 'B06 Contratación', text: '', type: '', prob: '', impact: '', date: '', action: '', owner: '', status: 'Abierta' }
const ORIGINS = SHEETS.filter((s) => /^[BC]/.test(s.code)).map((s) => `${s.code} ${s.name}`)

function Alerts() {
  const [list, setList] = useSaved('alerts', [])
  const [a, setA] = useState(BLANK_ALERT)
  const level = alertLevel(a.prob, a.impact)
  const set = (k) => (e) => setA({ ...a, [k]: e.target.value })
  const add = (e) => { e.preventDefault(); setList([...list, { ...a, id: Date.now() }]); setA({ ...BLANK_ALERT, origin: a.origin }) }
  const left = toTSV(list.map((x) => [x.origin, x.text, x.type, x.prob, x.impact]))
  const right = toTSV(list.map((x) => [x.date, x.action, x.owner, x.status]))
  return (
    <div className="tool">
      <p className="tool-intro">Califique cada alerta como en la hoja <b>D1 Alertas</b>: el nivel sale de cruzar probabilidad e impacto, con la misma regla del Excel.</p>
      <div className="alert-layout">
        <form className="form-grid" onSubmit={add}>
          <label htmlFor="a-origin"><span className="mono">Mesa / hoja de origen</span><select id="a-origin" value={a.origin} onChange={set('origin')}>{ORIGINS.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label htmlFor="a-type"><span className="mono">Tipo</span><select id="a-type" value={a.type} onChange={set('type')} required><option value="">—</option>{ALERT_TYPES.map((o) => <option key={o}>{o}</option>)}</select></label>
          <label htmlFor="a-text" className="wide"><span className="mono">Alerta o riesgo</span><input id="a-text" value={a.text} onChange={set('text')} required placeholder="Ej.: el contrato de aseo vence el 31-dic-2027 sin proceso nuevo" /></label>
          <label htmlFor="a-prob"><span className="mono">Probabilidad</span><select id="a-prob" value={a.prob} onChange={set('prob')} required><option value="">—</option>{['Alta', 'Media', 'Baja'].map((o) => <option key={o}>{o}</option>)}</select></label>
          <label htmlFor="a-impact"><span className="mono">Impacto</span><select id="a-impact" value={a.impact} onChange={set('impact')} required><option value="">—</option>{['Alto', 'Medio', 'Bajo'].map((o) => <option key={o}>{o}</option>)}</select></label>
          <label htmlFor="a-date"><span className="mono">Fecha límite</span><input id="a-date" type="date" value={a.date} onChange={set('date')} /></label>
          <label htmlFor="a-owner"><span className="mono">Responsable entrante</span><input id="a-owner" value={a.owner} onChange={set('owner')} /></label>
          <label htmlFor="a-action" className="wide"><span className="mono">Acción recomendada</span><input id="a-action" value={a.action} onChange={set('action')} /></label>
          <div className="wide tool-actions">
            <span className={`level lv-${level || 'none'}`} aria-live="polite">Nivel: <b>{level || '—'}</b></span>
            <button className="btn btn-red">Agregar a la matriz</button>
          </div>
        </form>
        <div className="matrix" aria-label="Matriz de probabilidad e impacto">
          <span className="mono m-y">Probabilidad</span>
          <div className="m-grid">
            {['Alta', 'Media', 'Baja'].map((p) => ['Bajo', 'Medio', 'Alto'].map((i) => {
              const l = alertLevel(p, i)
              return <span key={p + i} className={`cell lv-${l}${a.prob === p && a.impact === i ? ' cur' : ''}`} title={`${p} × ${i} = ${l}`}>{l}</span>
            }))}
          </div>
          <span className="mono m-x">Impacto →</span>
        </div>
      </div>
      {list.length > 0 && (
        <>
          <div className="table-box">
            <table>
              <thead><tr><th>Hoja</th><th>Alerta</th><th>Nivel</th><th>Fecha límite</th><th><span className="sr-only">Quitar</span></th></tr></thead>
              <tbody>
                {list.map((x) => (
                  <tr key={x.id}>
                    <td className="mono">{x.origin.split(' ')[0]}</td>
                    <td>{x.text}</td>
                    <td><span className={`level lv-${alertLevel(x.prob, x.impact)}`}>{alertLevel(x.prob, x.impact)}</span></td>
                    <td>{fmt(x.date, { day: '2-digit', month: 'short', year: 'numeric' }) || '—'}</td>
                    <td><button type="button" className="link-btn" onClick={() => setList(list.filter((y) => y.id !== x.id))} aria-label={`Quitar alerta ${x.text}`}><X size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tool-intro">En D1 la columna <b>Nivel</b> es una fórmula. Por eso se pega en dos partes: primero desde la celda <b>C</b> de la primera fila libre, después desde la <b>I</b> de la misma fila.</p>
          <div className="tool-actions">
            <CopyButton text={left} label="Copiar columnas C a G" />
            <CopyButton text={right} label="Copiar columnas I a L" />
          </div>
        </>
      )}
    </div>
  )
}

const TRACKED = SHEETS.filter((s) => !/^\d/.test(s.code))
function Progress() {
  const [st, setSt] = useSaved('index', Object.fromEntries(TRACKED.map((s) => [s.code, 'Sin iniciar'])))
  const p = progress(st)
  return (
    <div className="tool">
      <p className="tool-intro">Lleve el estado de cada hoja como en la columna <b>Estado</b> del <b>02 Índice</b>. El avance se calcula igual que en el Excel: hojas entregadas sobre hojas que aplican.</p>
      <div className="progress-ruler" role="progressbar" aria-valuenow={Math.round(p.pct * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Avance del libro">
        <span style={{ width: `${p.pct * 100}%` }} />
        <b className="mono">{Math.round(p.pct * 100)} % · {p.done} de {p.applicable} hojas</b>
      </div>
      {GROUPS.slice(1).map(([g, label]) => (
        <fieldset key={g} className="status-group">
          <legend className="mono">{label}</legend>
          {TRACKED.filter((s) => s.group === g).map((s) => (
            <label key={s.code} htmlFor={`st-${s.code}`} className={`status st-${st[s.code]?.replace(/\s/g, '-')}`}>
              <span><b className="mono">{s.code}</b> {s.name}</span>
              <select id={`st-${s.code}`} value={st[s.code]} onChange={(e) => setSt({ ...st, [s.code]: e.target.value })}>
                {INDEX_STATUSES.map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  )
}

function Deadlines() {
  const [retiro, setRetiro] = useSaved('retiro', '2027-12-31')
  const [entrega, setEntrega] = useSaved('entrega', '')
  const ok = retiro >= RANGE.min && retiro <= RANGE.max && (!entrega || (entrega >= retiro && entrega <= RANGE.max))
  const r = ok ? ley951(retiro, entrega) : null
  return (
    <div className="tool">
      <p className="tool-intro">Calcule los plazos de la Ley 951 de 2005 contando días hábiles, sin fines de semana ni festivos de Colombia.</p>
      <div className="form-grid">
        <label htmlFor="d-retiro"><span className="mono">Fecha de retiro del servidor</span><input id="d-retiro" type="date" min={RANGE.min} max={RANGE.max} value={retiro} onChange={(e) => setRetiro(e.target.value)} /></label>
        <label htmlFor="d-entrega"><span className="mono">Fecha en que se entregó el acta (opcional)</span><input id="d-entrega" type="date" min={retiro} max={RANGE.max} value={entrega} onChange={(e) => setEntrega(e.target.value)} /></label>
      </div>
      {r ? (
        <div className="deadlines">
          <div className="dl"><span className="mono">Firmar el acta de informe de gestión</span><b>{fmt(r.acta)}</b><small>15 días hábiles después del retiro</small></div>
          <div className="dl"><span className="mono">Verificación del entrante</span><b>{fmt(r.verificacion)}</b><small>30 días hábiles desde {entrega ? 'la entrega del acta' : 'el plazo del acta'}</small></div>
        </div>
      ) : (
        <p className="err" role="alert">Use fechas entre el {fmt(RANGE.min)} y el {fmt(RANGE.max)}, y una entrega posterior al retiro.</p>
      )}
      <p className="disclaimer mono">Cálculo de referencia. Confirme el plazo con la oficina jurídica de la alcaldía.</p>
    </div>
  )
}

const TOOLS = [
  ['datos', 'Datos generales', 'Hoja 01', GeneralData],
  ['alertas', 'Semáforo de alertas', 'Hoja D1', Alerts],
  ['avance', 'Avance del libro', 'Hoja 02', Progress],
  ['plazos', 'Plazos Ley 951', 'Acta de gestión', Deadlines],
]

// Solicitar ayuda: llega a EPG por correo y queda en el panel. Puede adjuntar lo diligenciado en el asistente.
const TOPICS = [...TOOLS.map(([, l, s]) => `${l} (${s})`), 'Otra hoja del libro', 'Acompañamiento completo al empalme']
const saved = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } }
function assistantData() {
  const d = saved()
  // Las fechas que vienen prellenadas no cuentan como "diligenciado".
  const general = d.general && GENERAL_FIELDS.some((f) => String(d.general[f.key] ?? '').trim() && d.general[f.key] !== f.value) ? d.general : null
  const alerts = (d.alerts || []).map((x) => ({ ...x, level: alertLevel(x.prob, x.impact) }))
  const p = d.index ? progress(d.index) : null
  return { general, alerts, progress: p && p.done > 0 ? { done: p.done, applicable: p.applicable } : null }
}
const BLANK_HELP = { name: '', role: '', email: '', phone: '', topic: '', sheet: '', msg: '', attach: true, consent: false, website: '' }

function HelpBox({ settings: s, tab }) {
  const [open, setOpen] = useState(false)
  const [h, setH] = useState(BLANK_HELP)
  const [req, send, reset] = useRequest()
  const set = (k) => (e) => setH({ ...h, [k]: e.target.value })
  const data = open ? assistantData() : { alerts: [] }
  const g = data.general
  const town = g?.municipio ? `${g.municipio}${g.departamento ? ', ' + g.departamento : ''}` : ''
  const hasData = !!(g || data.alerts.length || data.progress)
  const attachLabel = [town || (g && 'datos generales'), data.alerts.length && `${data.alerts.length} alertas`, data.progress && `${data.progress.done} hojas entregadas`].filter(Boolean).join(', ')
  const tool = TOOLS.find(([k]) => k === tab)
  const topic = h.topic || (tool ? `${tool[1]} (${tool[2]})` : TOPICS[0])
  const waText = ['Hola EPG S.A.S., necesito ayuda con el empalme.', h.name && `Soy ${h.name}${h.role ? `, ${h.role}` : ''}.`, town && `Municipio: ${town}.`, `Tema: ${topic}${h.sheet ? ` – hoja ${h.sheet}` : ''}.`, h.msg].filter(Boolean).join('\n')
  const submit = (e) => {
    e.preventDefault()
    send({
      source: 'empalme-ayuda', name: h.name, role: h.role, email: h.email, phone: h.phone, town, topic, sheet: h.sheet,
      message: h.msg, consent: h.consent, website: h.website, payload: h.attach && hasData ? data : null,
    })
  }
  return (
    <div className="help">
      <div className="help-bar">
        <p><b>¿Tiene dudas con algún formato?</b> Nuestro equipo le ayuda a diligenciarlo.</p>
        <button type="button" className="btn btn-paper" aria-expanded={open} aria-controls="help-form" onClick={() => setOpen(!open)}>
          {open ? <X size={16} aria-hidden /> : <MessageCircle size={16} aria-hidden />} {open ? 'Cerrar' : 'Solicitar ayuda'}
        </button>
      </div>
      {open && req.status === 'sent' && (
        <div className="help-form help-sent" role="status">
          <h4>Solicitud enviada</h4>
          <p>Gracias{h.name ? `, ${h.name.split(' ')[0]}` : ''}. Un asesor de EPG le responderá {h.email ? `a ${h.email}` : `al ${h.phone}`}.</p>
          <button type="button" className="btn btn-line" onClick={() => { reset(); setH(BLANK_HELP) }}>Hacer otra consulta</button>
        </div>
      )}
      {open && req.status !== 'sent' && (
        <motion.form id="help-form" className="help-form form-grid" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit}>
          <label htmlFor="h-name"><span className="mono">Su nombre</span><input id="h-name" value={h.name} onChange={set('name')} autoComplete="name" required /></label>
          <label htmlFor="h-role"><span className="mono">Cargo / dependencia</span><input id="h-role" value={h.role} onChange={set('role')} placeholder="Ej.: Secretaría de Planeación" /></label>
          <label htmlFor="h-email"><span className="mono">Correo</span><input id="h-email" type="email" value={h.email} onChange={set('email')} autoComplete="email" /></label>
          <label htmlFor="h-phone"><span className="mono">Teléfono</span><input id="h-phone" type="tel" value={h.phone} onChange={set('phone')} autoComplete="tel" /></label>
          <label htmlFor="h-topic"><span className="mono">Tema</span><select id="h-topic" value={topic} onChange={set('topic')}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label htmlFor="h-sheet"><span className="mono">Hoja del libro (opcional)</span><select id="h-sheet" value={h.sheet} onChange={set('sheet')}><option value="">—</option>{SHEETS.map((x) => <option key={x.code} value={x.code}>{x.code} {x.name}</option>)}</select></label>
          <label htmlFor="h-msg" className="wide"><span className="mono">¿En qué le ayudamos?</span><textarea id="h-msg" rows={3} value={h.msg} onChange={set('msg')} required placeholder="Ej.: no sabemos cómo registrar los contratos con prórroga en la hoja B06" /></label>
          {hasData && (
            <label htmlFor="h-attach" className="wide check">
              <input id="h-attach" type="checkbox" checked={h.attach} onChange={(e) => setH({ ...h, attach: e.target.checked })} />
              <span>Adjuntar lo que diligencié en el asistente ({attachLabel})</span>
            </label>
          )}
          <Trap value={h.website} onChange={(v) => setH({ ...h, website: v })} />
          <div className="wide"><Consent id="h-consent" checked={h.consent} onChange={(v) => setH({ ...h, consent: v })} /></div>
          {req.status === 'error' && <p className="wide form-error" role="alert">{req.error}</p>}
          <div className="wide tool-actions">
            <button className="btn btn-red" disabled={req.status === 'sending'}>{req.status === 'sending' ? 'Enviando…' : 'Enviar solicitud'}</button>
            {s.whatsapp && <a className="btn btn-line" href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener"><MessageCircle size={16} aria-hidden /> Mejor por WhatsApp</a>}
            <small className="mono">Deje un correo o un teléfono para responderle.</small>
          </div>
        </motion.form>
      )}
    </div>
  )
}

// Qué pasa con la información después de usar el asistente, siguiendo la ruta del empalme.
const NEXT = [
  ['Pegue los datos en el libro', 'Lo que preparó aquí va al Excel oficial: datos generales en la hoja 01, alertas en la D1 y el estado de cada hoja en el 02 Índice.'],
  ['Revisión interna', 'La Secretaría Técnica revisa que cada hoja tenga fuente y fecha de corte. Control Interno verifica y alerta, sin aprobar.'],
  ['Mesas temáticas', 'Cada mesa presenta sus hojas al equipo entrante y cierra la sesión con un acta parcial firmada por ambas administraciones (hoja A3).'],
  ['Entrega formal', 'Con el libro completo se consolida el informe de gestión y se firma el acta de la Ley 951. El entrante tiene 30 días hábiles para verificarla.'],
]

function Assistant({ settings }) {
  const [tab, setTab] = useSaved('tab', 'datos')
  const Tool = (TOOLS.find(([k]) => k === tab) ?? TOOLS[0])[3]
  return (
    <section id="asistente" className="section ink assistant">
      <div className="wrap">
        <Heading dark n={4} eyebrow="Asistente de diligenciamiento" title="Prepare el libro sin perderse" intro="Cuatro herramientas que trabajan con la misma estructura del Excel. Lo que escriba queda guardado en este navegador, y puede enviárnoslo si necesita ayuda." />
        <div className="tabs" role="tablist" aria-label="Herramientas">
          {TOOLS.map(([k, l, s], i) => (
            <button key={k} role="tab" type="button" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
              <span className="mono">0{i + 1} · {s}</span>{l}
            </button>
          ))}
        </div>
        <div className="tool-panel" role="tabpanel"><Tool /></div>
        <HelpBox settings={settings} tab={tab} />
        <h3 className="sub-h mono">Después de diligenciar: qué sigue</h3>
        <ol className="next-steps">
          {NEXT.map(([t, d], i) => (
            <Rise as="li" key={t} delay={i * 0.1} y={30}>
              <span className="phase-n">{i + 1}</span>
              <h4>{t}</h4>
              <p>{d}</p>
            </Rise>
          ))}
        </ol>
        <p className="disclaimer">Lo que escribe en el asistente queda en este navegador. Solo llega a EPG si usted lo adjunta al solicitar ayuda. Si usa otro equipo, no lo verá allí.</p>
      </div>
    </section>
  )
}

function Risks() {
  return (
    <section id="alertas" className="section paper">
      <div className="wrap">
        <Heading n={5} eyebrow="Alertas típicas" title="Lo que más se complica en un empalme" intro="Revise estos puntos desde el alistamiento: son los que más exponen al alcalde saliente y más frenan al entrante." />
        <div className="risks">
          {RISKS.map(([t, d, where], i) => (
            <Rise key={t} delay={(i % 3) * 0.1} className="risk">
              <span className="mono risk-where">{where}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  )
}

function Contact({ settings: s }) {
  const text = 'Hola EPG S.A.S., quiero información sobre el acompañamiento al empalme de mi alcaldía.'
  return (
    <section id="contacto" className="section contact">
      <div className="c-wedge" aria-hidden />
      <div className="wrap contact-grid">
        <div>
          <Heading dark n={6} eyebrow="Acompañamiento" title="Hagamos juntos su empalme" intro="Acompañamos a la administración saliente y a la entrante: organización de la información, mesas temáticas, actas y cierre." />
          <div className="channels">
            {s.whatsapp && <a className="btn btn-paper btn-lg" href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener"><MessageCircle size={18} aria-hidden /> WhatsApp</a>}
            {s.email && <a className="btn btn-line light btn-lg" href={`mailto:${s.email}?subject=${encodeURIComponent('Acompañamiento al empalme')}`}><Mail size={18} aria-hidden /> {s.email}</a>}
          </div>
        </div>
        <div className="piece-slot king-slot">
          <Piece kind="king" color="blue" className="view" />
        </div>
      </div>
      <p className="wrap disclaimer mono on-dark-note">Herramienta de apoyo basada en las guías DNP–Función Pública (2023), el Archivo General de la Nación y la Ley 951 de 2005. No sustituye las normas vigentes ni los lineamientos que expidan las entidades competentes.</p>
    </section>
  )
}

export default function Empalme() {
  const [settings, setSettings] = useState({})
  useEffect(() => {
    document.title = 'Empalme 2027-2028 | EPG S.A.S.'
    const m = document.querySelector('meta[name="description"]')
    const prev = m?.content
    m?.setAttribute('content', 'Guía y asistente para el empalme municipal 2027-2028: ruta, fechas críticas, explicación de los 40 formatos y herramientas para diligenciarlos.')
    api.content().then((c) => setSettings(c.settings)).catch(() => {})
    return () => { if (m && prev) m.setAttribute('content', prev) }
  }, [])
  return (
    <div className="theme-empalme">
      <Ruler />
      <Header />
      <main>
        <Hero />
        <WhatIs />
        <Route />
        <Formats />
        <Assistant settings={settings} />
        <Risks />
        <Contact settings={settings} />
      </main>
      <Footer settings={settings} links={[]} />
      <Suspense fallback={null}><Safe><Scene /></Safe></Suspense>
    </div>
  )
}
