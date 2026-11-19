// Ejecutar con: node server/requests.test.js
import assert from 'node:assert/strict'
import { cleanRequest, requestEmail } from './requests.js'

const ok = { name: 'Ana Pérez', email: 'Ana@Alcaldia.gov.co', message: 'Necesitamos apoyo con la hoja B06', consent: true }

assert.equal(cleanRequest({ ...ok, website: 'http://spam' }), null, 'el campo trampa descarta robots')
const r = cleanRequest({ ...ok, source: 'empalme-ayuda', town: 'Sogamoso, Boyacá' })
assert.equal(r.email, 'ana@alcaldia.gov.co')
assert.equal(r.source, 'empalme-ayuda')
assert.equal(cleanRequest({ ...ok, source: 'otro' }).source, 'contacto')
assert.equal(cleanRequest({ ...ok, name: 'x'.repeat(500) }).name.length, 120)

const fails = (body, msg) => assert.throws(() => cleanRequest(body), (e) => e.status === 400 && e.message.includes(msg))
fails({ ...ok, name: '' }, 'nombre')
fails({ ...ok, message: '  ' }, 'ayudamos')
fails({ ...ok, email: '', phone: '' }, 'correo o un teléfono')
fails({ ...ok, email: 'sin-arroba' }, 'correo')
fails({ ...ok, email: '', phone: 'abc' }, 'teléfono')
fails({ ...ok, consent: 'true' }, 'autorizar')
assert.equal(cleanRequest({ ...ok, email: '', phone: '+57 310 000 0000' }).phone, '+57 310 000 0000')

// Lo diligenciado: solo campos conocidos.
const p = cleanRequest({ ...ok, payload: { general: { municipio: 'Sogamoso', hack: '<script>' }, alerts: [{ text: 'Aseo vence', level: 'Alto', extra: 1 }], progress: { done: 3, applicable: 30 } } }).payload
assert.deepEqual(p.general, { municipio: 'Sogamoso' })
assert.equal(p.alerts[0].text, 'Aseo vence')
assert.equal('extra' in p.alerts[0], false)
assert.equal(cleanRequest({ ...ok, payload: { general: {} } }).payload, null)

// El correo escapa HTML.
const mail = requestEmail(cleanRequest({ ...ok, message: '<img src=x onerror=alert(1)>', town: 'Tunja' }))
assert.ok(!mail.html.includes('<img'))
assert.ok(mail.html.includes('&lt;img'))
assert.equal(mail.subject, 'Formulario de contacto: Ana Pérez (Tunja)')
console.log('OK: solicitudes')
