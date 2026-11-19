// Solicitudes de los formularios públicos: validación, contenido del correo y envío con Resend.
import { GENERAL_FIELDS } from '../src/empalme/data.js'

export const SOURCES = ['contacto', 'empalme-ayuda']
export const STATUSES = ['Nueva', 'En gestión', 'Atendida']
const MAX = { name: 120, role: 120, email: 160, phone: 30, town: 160, topic: 160, sheet: 10, message: 3000 }
const bad = (message) => Object.assign(new Error(message), { status: 400 })
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

// Devuelve null si es un robot (llenó el campo trampa): se responde "ok" sin guardar nada.
export function cleanRequest(b) {
  if (b?.website) return null
  const r = Object.fromEntries(Object.entries(MAX).map(([k, max]) => [k, str(b?.[k], max)]))
  r.source = SOURCES.includes(b?.source) ? b.source : 'contacto'
  r.email = r.email.toLowerCase()
  if (!r.name) throw bad('Escriba su nombre')
  if (!r.message) throw bad('Cuéntenos en qué le ayudamos')
  if (!r.email && !r.phone) throw bad('Deje un correo o un teléfono para responderle')
  if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(r.email)) throw bad('Revise el correo: no parece válido')
  if (r.phone && !/^[+\d][\d\s()-]{6,}$/.test(r.phone)) throw bad('Revise el teléfono: use solo números')
  if (b?.consent !== true) throw bad('Para enviar la solicitud debe autorizar el tratamiento de sus datos')
  r.payload = cleanPayload(b?.payload)
  return r
}

// Lo diligenciado en el asistente del empalme: solo campos conocidos y con tamaño acotado.
function cleanPayload(p) {
  if (!p || typeof p !== 'object') return null
  const general = Object.fromEntries(GENERAL_FIELDS.map((f) => [f.key, str(p.general?.[f.key], 200)]).filter(([, v]) => v))
  const alerts = (Array.isArray(p.alerts) ? p.alerts : []).slice(0, 100).map((a) => ({
    origin: str(a?.origin, 60), text: str(a?.text, 300), type: str(a?.type, 40), prob: str(a?.prob, 10),
    impact: str(a?.impact, 10), level: str(a?.level, 10), date: str(a?.date, 10), action: str(a?.action, 300),
  }))
  const pr = p.progress
  const progress = pr && Number.isFinite(pr.done) && Number.isFinite(pr.applicable) ? { done: pr.done, applicable: pr.applicable } : null
  return Object.keys(general).length || alerts.length || progress ? { general, alerts, progress } : null
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const SOURCE_LABEL = { contacto: 'Formulario de contacto', 'empalme-ayuda': 'Ayuda con el empalme' }

// ---------- Plantilla de marca para correo ----------
// HTML de correo: tablas y estilos en línea (Outlook y Gmail ignoran CSS moderno). Colores de la web: negro, rojo y papel.
const C = { ink: '#111012', red: '#b3121b', paper: '#ece6da', muted: '#5d5850', line: '#d9d1c3' }
const F = 'Arial,Helvetica,sans-serif'
const mono = "'Courier New',Courier,monospace"

const button = (href, label, primary = true) =>
  `<a href="${esc(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 20px;font:bold 13px ${F};letter-spacing:1px;text-transform:uppercase;text-decoration:none;border:2px solid ${C.ink};${primary ? `background:${C.red};color:#ffffff` : `background:#ffffff;color:${C.ink}`}">${esc(label)}</a>`

const section = (title, inner) =>
  `<tr><td style="padding:22px 32px 0"><p style="margin:0 0 10px;font:bold 11px ${mono};letter-spacing:2px;text-transform:uppercase;color:${C.red}">${esc(title)}</p>${inner}</td></tr>`

const dataTable = (list) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${list.map(([k, v]) => `<tr><td style="padding:8px 12px 8px 0;border-bottom:1px solid ${C.line};font:12px ${F};color:${C.muted};width:38%;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid ${C.line};font:bold 14px ${F};color:${C.ink};vertical-align:top">${esc(v)}</td></tr>`).join('')}</table>`

function layout({ base, preheader, tag, title, body }) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title.replace(/<br>/g, " "))}</title></head>
<body style="margin:0;padding:0;background:${C.paper}">
<div style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:2px solid ${C.ink}">
  <tr><td style="background:${C.ink};padding:18px 32px">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle"><img src="${esc(base)}/logo.png" width="44" height="44" alt="EPG S.A.S." style="display:block;border:0;border-radius:50%;background:#ffffff"></td>
      <td style="vertical-align:middle;padding-left:12px;font:bold 22px Georgia,'Times New Roman',serif;color:#ffffff">EPG S.A.S</td>
    </tr></table>
  </td></tr>
  <tr><td style="background:${C.red};height:6px;line-height:6px;font-size:0">&nbsp;</td></tr>
  <tr><td style="padding:28px 32px 0">
    <span style="display:inline-block;background:${C.ink};color:${C.paper};padding:5px 10px;font:bold 11px ${mono};letter-spacing:2px;text-transform:uppercase">${esc(tag)}</span>
    <h1 style="margin:16px 0 0;font:900 24px/1.15 'Arial Black',${F};text-transform:uppercase;color:${C.ink}">${title}</h1>
  </td></tr>
  ${body}
  <tr><td style="padding:28px 32px 0"></td></tr>
  <tr><td style="background:${C.ink};padding:18px 32px">
    <p style="margin:0;font:bold 13px ${F};text-transform:uppercase;letter-spacing:1px;color:#ffffff">Cada decisión, una jugada maestra.</p>
    <p style="margin:6px 0 0;font:12px ${F};color:#b9b2a6">Asesoría y gestión para alcaldías municipales · <a href="${esc(base)}" style="color:#ffffff">${esc(base.replace(/^https?:\/\//, ''))}</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

const waLink = (phone) => {
  const d = phone.replace(/\D/g, '')
  return `https://wa.me/${d.length === 10 && d.startsWith('3') ? '57' + d : d}`
}
const LEVEL_COLOR = { Alto: '#c0392b', Medio: '#e3a33b', Bajo: '#4f9a5b' }

export function requestEmail(r, base = 'https://epgsas.com') {
  const rows = [['Nombre', r.name], ['Cargo / dependencia', r.role], ['Municipio', r.town], ['Correo', r.email], ['Teléfono', r.phone], ['Tema', r.topic], ['Hoja del libro', r.sheet]].filter(([, v]) => v)
  const p = r.payload
  const general = p ? GENERAL_FIELDS.filter((f) => p.general[f.key]).map((f) => [f.label, p.general[f.key]]) : []
  const alerts = p?.alerts.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${p.alerts.map((a) => `<tr><td style="padding:8px 0;border-bottom:1px solid ${C.line};width:70px;vertical-align:top"><span style="display:inline-block;padding:3px 8px;font:bold 11px ${mono};text-transform:uppercase;color:#ffffff;background:${LEVEL_COLOR[a.level] || C.muted}">${esc(a.level || '—')}</span></td><td style="padding:8px 0;border-bottom:1px solid ${C.line};font:14px ${F};color:${C.ink}"><b>${esc(a.origin)}</b> · ${esc(a.text)}${a.date ? `<br><span style="font:12px ${F};color:${C.muted}">Fecha límite: ${esc(a.date)}</span>` : ''}</td></tr>`).join('')}</table>`
    : ''
  const actions = [
    r.email && button(`mailto:${r.email}?subject=${encodeURIComponent('Re: su solicitud a EPG S.A.S.')}`, `Responder a ${r.name.split(' ')[0]}`),
    r.phone && button(waLink(r.phone), 'WhatsApp', false),
    button(`${base}/admin`, 'Abrir el panel', false),
  ].filter(Boolean).join('')
  const body = [
    section('Datos de contacto', dataTable(rows)),
    section('Mensaje', `<div style="border-left:4px solid ${C.red};background:${C.paper};padding:14px 16px;font:15px/1.5 ${F};color:${C.ink};white-space:pre-wrap">${esc(r.message)}</div>`),
    general.length ? section('Datos generales diligenciados (hoja 01)', dataTable(general)) : '',
    alerts ? section(`Alertas del semáforo (${p.alerts.length})`, alerts) : '',
    p?.progress ? section('Avance del libro', `<p style="margin:0;font:bold 15px ${F};color:${C.ink}">${p.progress.done} de ${p.progress.applicable} hojas entregadas</p>`) : '',
    section('Siguiente paso', `${actions}<p style="margin:4px 0 0;font:12px ${F};color:${C.muted}">${r.email ? `También puede responder este correo: le llega directo a ${esc(r.name)}.` : 'La persona dejó solo su teléfono.'}</p>`),
  ].join('')
  const subject = `${SOURCE_LABEL[r.source]}: ${r.name}${r.town ? ` (${r.town})` : ''}`
  const html = layout({ base, preheader: r.message.slice(0, 120), tag: SOURCE_LABEL[r.source], title: 'Nueva solicitud<br>desde la web', body })
  const text = [subject, '', ...rows.map(([k, v]) => `${k}: ${v}`), '', r.message, '', `Panel: ${base}/admin`].join('\n')
  return { subject, html, text }
}

export function confirmationEmail(r, base = 'https://epgsas.com') {
  const body = [
    section('Su mensaje', `<p style="margin:0 0 12px;font:15px/1.5 ${F};color:${C.ink}">Hola ${esc(r.name.split(' ')[0])}, recibimos su solicitud. Un asesor de EPG S.A.S. le responderá pronto.</p><div style="border-left:4px solid ${C.red};background:${C.paper};padding:14px 16px;font:14px/1.5 ${F};color:${C.ink};white-space:pre-wrap">${esc(r.message)}</div>`),
    section('Mientras tanto', `${button(`${base}/empalme`, 'Guía de empalme 2028')}${button(base, 'Conozca EPG', false)}`),
  ].join('')
  const html = layout({ base, preheader: 'Recibimos su solicitud y le responderemos pronto.', tag: 'Solicitud recibida', title: 'Gracias por<br>escribirnos', body })
  return { subject: 'Recibimos su solicitud – EPG S.A.S.', html, text: `Hola ${r.name},\n\nRecibimos su solicitud y le responderemos pronto.\n\n${r.message}\n\nEPG S.A.S. · Cada decisión, una jugada maestra.\n${base}` }
}

// API REST de Resend. RESEND_FROM debe usar un dominio verificado; sin dominio, onboarding@resend.dev solo entrega al correo de la cuenta.
export async function sendEmail({ to, subject, html, text, replyTo }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.RESEND_FROM || 'EPG Web <onboarding@resend.dev>', to: [to], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
  })
  if (!res.ok) throw new Error(`Resend respondió ${res.status}: ${(await res.text()).slice(0, 300)}`)
}

// Cloudflare Turnstile: sin TURNSTILE_SECRET_KEY no se exige (útil en local). Si Cloudflare no responde, se rechaza.
export async function verifyCaptcha(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token || typeof token !== 'string') return false
  const body = new URLSearchParams({ secret, response: token.slice(0, 2048), ...(ip ? { remoteip: ip } : {}) })
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
    return (await res.json()).success === true
  } catch {
    return false
  }
}
