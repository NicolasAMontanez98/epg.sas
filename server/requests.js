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

export function requestEmail(r) {
  const rows = [['Origen', SOURCE_LABEL[r.source]], ['Nombre', r.name], ['Cargo / dependencia', r.role], ['Municipio', r.town], ['Correo', r.email], ['Teléfono', r.phone], ['Tema', r.topic], ['Hoja', r.sheet]].filter(([, v]) => v)
  const p = r.payload
  const general = p ? GENERAL_FIELDS.filter((f) => p.general[f.key]).map((f) => [f.label, p.general[f.key]]) : []
  const td = 'padding:6px 10px;border-bottom:1px solid #ddd;vertical-align:top'
  const table = (list) => `<table style="border-collapse:collapse;font:14px Arial,sans-serif">${list.map(([k, v]) => `<tr><td style="${td};color:#666">${esc(k)}</td><td style="${td}">${esc(v)}</td></tr>`).join('')}</table>`
  const html = [
    `<h2 style="font:bold 18px Arial,sans-serif">Nueva solicitud desde la web</h2>`,
    table(rows),
    `<h3 style="font:bold 15px Arial,sans-serif;margin-top:18px">Mensaje</h3><p style="font:14px Arial,sans-serif;white-space:pre-wrap">${esc(r.message)}</p>`,
    general.length ? `<h3 style="font:bold 15px Arial,sans-serif">Datos generales diligenciados</h3>${table(general)}` : '',
    p?.alerts.length ? `<h3 style="font:bold 15px Arial,sans-serif">Alertas (${p.alerts.length})</h3><ul style="font:14px Arial,sans-serif">${p.alerts.map((a) => `<li><b>${esc(a.level || '—')}</b> · ${esc(a.origin)} · ${esc(a.text)}${a.date ? ` (vence ${esc(a.date)})` : ''}</li>`).join('')}</ul>` : '',
    p?.progress ? `<p style="font:14px Arial,sans-serif">Avance del libro: ${p.progress.done} de ${p.progress.applicable} hojas entregadas.</p>` : '',
    r.email ? `<p style="font:13px Arial,sans-serif;color:#666">Responda este correo para contestarle directamente a ${esc(r.name)}.</p>` : '',
  ].join('')
  const text = [...rows.map(([k, v]) => `${k}: ${v}`), '', r.message].join('\n')
  return { subject: `${SOURCE_LABEL[r.source]}: ${r.name}${r.town ? ` (${r.town})` : ''}`, html, text }
}

export function confirmationEmail(r) {
  const html = `<p style="font:14px Arial,sans-serif">Hola ${esc(r.name)},</p><p style="font:14px Arial,sans-serif">Recibimos su solicitud y le responderemos pronto. Este es el mensaje que nos envió:</p><blockquote style="font:14px Arial,sans-serif;white-space:pre-wrap;border-left:3px solid #999;margin:0;padding-left:12px">${esc(r.message)}</blockquote><p style="font:14px Arial,sans-serif">EPG S.A.S. · Cada decisión, una jugada maestra.</p>`
  return { subject: 'Recibimos su solicitud – EPG S.A.S.', html, text: `Hola ${r.name},\n\nRecibimos su solicitud y le responderemos pronto.\n\n${r.message}\n\nEPG S.A.S.` }
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
