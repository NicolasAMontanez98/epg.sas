import { useCallback, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api.js'
import { SCHEMA, SETTINGS } from '../shared/schema.js'

function Field({ f, value, onChange }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  if (f.type === 'bool') return <label className="chk"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {f.label}</label>
  if (f.type === 'textarea') return <label>{f.label}<textarea rows="3" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>
  if (f.type === 'select') return <label>{f.label}<select value={value ?? ''} onChange={(e) => onChange(e.target.value)}><option value="">—</option>{f.options.map((o) => <option key={o}>{o}</option>)}</select></label>
  if (f.type === 'image')
    return (
      <label>{f.label}
        {value && <img className="thumb" src={value} alt="" />}
        <input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={async (e) => {
          setBusy(true); setErr('')
          try { onChange((await api.upload(e.target.files[0])).url) } catch (x) { setErr(x.message) }
          setBusy(false)
        }} />
        {busy && <small>Subiendo…</small>}{err && <small className="err">{err}</small>}
      </label>
    )
  return <label>{f.label}<input type={f.type === 'date' || f.type === 'password' ? f.type : 'text'} autoComplete={f.type === 'password' ? 'new-password' : undefined} value={value ?? ''} required={f.required} onChange={(e) => onChange(e.target.value)} /></label>
}

function Form({ fields, initial, onSave, onCancel }) {
  const [v, setV] = useState(initial)
  const [err, setErr] = useState('')
  return (
    <form className="adm-form" onSubmit={async (e) => {
      e.preventDefault(); setErr('')
      try { await onSave(v) } catch (x) { setErr(x.message) }
    }}>
      {fields.map((f) => <Field key={f.key} f={f} value={v[f.key]} onChange={(val) => setV({ ...v, [f.key]: val })} />)}
      {err && <p className="err" role="alert">{err}</p>}
      <div className="row"><button className="btn btn-red sm">Guardar</button>{onCancel && <button type="button" className="btn btn-ghost-d sm" onClick={onCancel}>Cancelar</button>}</div>
    </form>
  )
}

function Collection({ col, items, reload }) {
  const def = SCHEMA[col]
  const [editing, setEditing] = useState(null) // 'new' | item
  const save = async (v) => {
    if (editing === 'new') await api.create(col, v)
    else await api.update(col, editing.id, v)
    setEditing(null); reload()
  }
  if (editing)
    return <Form fields={def.fields} initial={editing === 'new' ? { active: true } : editing} onSave={save} onCancel={() => setEditing(null)} />
  return (
    <>
      <button className="btn btn-red sm" onClick={() => setEditing('new')}>+ Agregar</button>
      <ul className="adm-list">
        {items.length === 0 && <li className="empty">Aún no hay elementos.</li>}
        {items.map((it) => (
          <li key={it.id}>
            <span>{it[def.title]}{it.active === false && <em> (oculto)</em>}</span>
            <span>
              <button className="link" onClick={() => setEditing(it)}>Editar</button>
              <button className="link danger" onClick={async () => { if (confirm('¿Eliminar este elemento?')) { await api.remove(col, it.id); reload() } }}>Eliminar</button>
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

const USER_FIELDS = [
  { key: 'name', label: 'Nombre completo', type: 'text', required: true },
  { key: 'user', label: 'Usuario (para iniciar sesión)', type: 'text', required: true },
  { key: 'role', label: 'Rol', type: 'select', options: ['empleado', 'cliente'] },
  { key: 'password', label: 'Contraseña (mínimo 8 caracteres)', type: 'password' },
]

function Users({ me }) {
  const [list, setList] = useState(null)
  const [editing, setEditing] = useState(null)
  const reload = useCallback(() => api.users().then(setList), [])
  useEffect(() => { reload() }, [reload])
  if (!list) return <p>Cargando…</p>
  if (editing)
    return (
      <>
        {editing !== 'new' && <p className="hint">Deje la contraseña vacía para conservar la actual.</p>}
        <Form
          fields={USER_FIELDS}
          initial={editing === 'new' ? { role: 'empleado' } : { ...editing, password: '' }}
          onCancel={() => setEditing(null)}
          onSave={async (v) => { editing === 'new' ? await api.createUser(v) : await api.updateUser(editing.id, v); setEditing(null); reload() }}
        />
      </>
    )
  return (
    <>
      <p className="hint">Los <b>empleados</b> editan el contenido de la web. Los <b>clientes</b> solo acceden a su portal de consulta. Usted ({me.name}) es el único que gestiona usuarios.</p>
      <button className="btn btn-red sm" onClick={() => setEditing('new')}>+ Agregar usuario</button>
      <ul className="adm-list">
        {list.length === 0 && <li className="empty">Aún no hay usuarios.</li>}
        {list.map((u) => (
          <li key={u.id}>
            <span>{u.name} <em className={`role-tag ${u.role}`}>{u.role}</em> <small>@{u.user}</small></span>
            <span>
              <button className="link" onClick={() => setEditing(u)}>Editar</button>
              <button className="link danger" onClick={async () => { if (confirm(`¿Eliminar la cuenta de ${u.name}? Perderá el acceso de inmediato.`)) { await api.removeUser(u.id); reload() } }}>Eliminar</button>
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

const day = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })

// Portal de clientes: solo lectura.
function Portal({ me, onLogout }) {
  const [c, setC] = useState(null)
  useEffect(() => { api.content().then(setC) }, [])
  const today = new Date().toISOString().slice(0, 10)
  const dates = (c?.dates ?? []).filter((d) => d.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  return (
    <div className="portal">
      <header className="portal-top">
        <img src="/logo.png" alt="" width="48" height="48" />
        <h1>Portal de clientes</h1>
        <button className="btn btn-ghost-d sm" onClick={onLogout}>Cerrar sesión</button>
      </header>
      <section>
        <h2>Bienvenido, {me.name}</h2>
        <p className="hint">Aquí encuentra las fechas clave y el material de apoyo de EPG S.A.S. para su administración.</p>
        {!c ? <p>Cargando…</p> : (
          <>
            <h3>Próximas fechas</h3>
            <ul className="adm-list">
              {dates.length === 0 && <li className="empty">No hay fechas próximas registradas.</li>}
              {dates.map((d) => <li key={d.id}><span><b>{day(d.date)}</b> · {d.title}</span></li>)}
            </ul>
            {c.infographics.length > 0 && (
              <>
                <h3>Infografías</h3>
                <ul className="adm-list">{c.infographics.map((g) => <li key={g.id}><a href={g.image} target="_blank" rel="noopener">{g.title} ↗</a></li>)}</ul>
              </>
            )}
            <h3>¿Necesita a su asesor?</h3>
            <div className="row">
              {c.settings.whatsapp && <a className="btn btn-red sm" href={`https://wa.me/${c.settings.whatsapp}`} target="_blank" rel="noopener">WhatsApp</a>}
              {c.settings.email && <a className="btn btn-ghost-d sm" href={`mailto:${c.settings.email}`}>{c.settings.email}</a>}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function Dashboard({ me, onLogout }) {
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('banners')
  const [saved, setSaved] = useState(false)
  const reload = useCallback(() => api.adminContent().then(setData).catch((e) => e.status === 401 && onLogout()), [onLogout])
  useEffect(() => { reload() }, [reload])
  if (!data) return <p className="loading">Cargando…</p>
  const tabs = [...Object.entries(SCHEMA).map(([k, d]) => [k, d.label]), ['settings', SETTINGS.label], ...(me.role === 'admin' ? [['users', 'Usuarios']] : [])]
  return (
    <div className="adm-wrap">
      <aside>
        <img src="/logo.png" alt="" width="56" height="56" />
        <h1>Panel EPG</h1>
        <p className="who">{me.name} · {me.role}</p>
        {tabs.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); setSaved(false) }}>{l}</button>)}
        <a href="/" target="_blank" rel="noopener">Ver sitio ↗</a>
        <button onClick={onLogout}>Cerrar sesión</button>
      </aside>
      <section>
        <h2>{tabs.find(([k]) => k === tab)[1]}</h2>
        {tab === 'users' ? <Users me={me} /> : tab === 'settings' ? (
          <>
            <Form key="s" fields={SETTINGS.fields} initial={data.settings} onSave={async (v) => { await api.saveSettings(v); setSaved(true); reload() }} />
            {saved && <p className="ok" role="status">Cambios guardados.</p>}
          </>
        ) : <Collection key={tab} col={tab} items={data[tab]} reload={reload} />}
      </section>
    </div>
  )
}

export default function Admin() {
  const [me, setMe] = useState(null)
  const [checking, setChecking] = useState(!!getToken())
  const [err, setErr] = useState('')
  useEffect(() => { document.title = 'Iniciar sesión | EPG S.A.S.'; const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex'; document.head.append(m); return () => m.remove() }, [])
  useEffect(() => { if (getToken()) api.me().then(setMe).catch(() => setToken(null)).finally(() => setChecking(false)) }, [])
  const out = useCallback(() => { setToken(null); setMe(null) }, [])
  if (checking) return <div className="adm login"><p>Cargando…</p></div>
  if (me?.role === 'cliente') return <div className="adm"><Portal me={me} onLogout={out} /></div>
  if (me) return <div className="adm"><Dashboard me={me} onLogout={out} /></div>
  return (
    <div className="adm login">
      <form className="adm-form" onSubmit={async (e) => {
        e.preventDefault(); setErr('')
        const d = new FormData(e.target)
        try { const r = await api.login(d.get('user'), d.get('password')); setToken(r.token); setMe(r.me) } catch (x) { setErr(x.message) }
      }}>
        {/* Vuelve a la página anterior del sitio; si se llegó desde fuera (enlace directo), va al inicio. */}
        <a href="/" className="back-link" onClick={(e) => { if (document.referrer.startsWith(location.origin) && history.length > 1) { e.preventDefault(); history.back() } }}>← Volver</a>
        <img src="/logo-text.png" alt="EPG S.A.S." width="120" height="120" />
        <p className="login-title mono">Acceso para clientes y empleados</p>
        <label>Usuario<input name="user" autoComplete="username" required /></label>
        <label>Contraseña<input name="password" type="password" autoComplete="current-password" required /></label>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn btn-red">Ingresar</button>
      </form>
    </div>
  )
}
