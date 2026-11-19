import express from 'express'
import multer from 'multer'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SCHEMA, SETTINGS } from '../shared/schema.js'
import * as db from './db.js'
import { cleanRequest, confirmationEmail, requestEmail, sendEmail, STATUSES } from './requests.js'

const { ADMIN_USER, ADMIN_PASSWORD, JWT_SECRET, SUPABASE_URL, SUPABASE_SECRET_KEY, PORT = 3001 } = process.env
const missing = Object.entries({ ADMIN_USER, ADMIN_PASSWORD, JWT_SECRET, SUPABASE_URL, SUPABASE_SECRET_KEY }).filter(([, v]) => !v).map(([k]) => k)
if (missing.length) throw new Error(`Faltan variables de entorno: ${missing.join(', ')} (ver .env.example)`)

// Error de validación: llega al usuario con su mensaje. Cualquier otro error responde 500 sin detalles.
const bad = (message, status = 400) => Object.assign(new Error(message), { status })
const isId = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

const digest = (v) => crypto.createHash('sha256').update(String(v)).digest()
const same = (a, b) => crypto.timingSafeEqual(digest(a), digest(b))

// ---------- Usuarios: el admin de las variables de entorno gestiona empleados (editan) y clientes (solo consultan) ----------
const ROLES = ['empleado', 'cliente']
const ADMIN = { id: 'admin', role: 'admin', name: 'Administrador', user: ADMIN_USER }
const hashPw = (pw, salt = crypto.randomBytes(16).toString('hex')) => ({ salt, hash: crypto.scryptSync(String(pw), salt, 64).toString('hex') })
const checkPw = (u, pw) => crypto.timingSafeEqual(Buffer.from(u.hash, 'hex'), crypto.scryptSync(String(pw ?? ''), u.salt, 64))
const publicUser = ({ hash, salt, ...u }) => u

function cleanUser(body, existing) {
  const name = String(body?.name ?? '').trim().slice(0, 120)
  const user = String(body?.user ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')
  if (!name) throw bad('El nombre es obligatorio')
  if (!/^[a-z0-9._@-]{3,60}$/.test(user)) throw bad('El usuario debe tener de 3 a 60 caracteres: letras, números, punto, guion o @')
  if (user === ADMIN_USER.toLowerCase()) throw bad('Ese usuario ya existe')
  if (!ROLES.includes(body?.role)) throw bad('Rol no válido')
  if (existing && !password) return { name, user, role: body.role, salt: existing.salt, hash: existing.hash }
  if (password.length < 8) throw bad('La contraseña debe tener al menos 8 caracteres')
  return { name, user, role: body.role, ...hashPw(password) }
}
// El índice único de la tabla users decide los duplicados, también entre peticiones simultáneas.
const dupUser = (e) => { throw e.code === '23505' ? bad('Ese usuario ya existe') : e }

// Lee el usuario en cada petición: si lo borran o le cambian el rol, aplica de inmediato.
async function auth(req, res, next) {
  let sub
  try {
    sub = jwt.verify((req.headers.authorization ?? '').replace('Bearer ', ''), JWT_SECRET).sub
  } catch {
    return res.status(401).json({ error: 'Sesión vencida' })
  }
  const me = sub === 'admin' ? ADMIN : isId(sub) && (await db.getUser(sub))
  if (!me) return res.status(401).json({ error: 'Sesión vencida' })
  req.me = publicUser(me)
  next()
}
const allow = (...roles) => (req, res, next) => (roles.includes(req.me.role) ? next() : res.status(403).json({ error: 'No tiene permiso para esta acción' }))

// Valida y limpia el cuerpo según el esquema compartido.
function clean(fields, body) {
  const out = {}
  for (const f of fields) {
    let v = body?.[f.key]
    if (f.type === 'bool') v = !!v
    else {
      v = typeof v === 'string' ? v.trim().slice(0, 2000) : ''
      if (f.required && !v) throw bad(`"${f.label}" es obligatorio`)
      if (f.type === 'url' && v && !/^(https?:\/\/|\/|#)/i.test(v)) throw bad(`"${f.label}" debe empezar por http(s)://, / o #`)
      if (f.type === 'image' && v && !/^https:\/\//i.test(v)) throw bad(`"${f.label}" no es una imagen válida`)
      if (f.type === 'select' && v && !f.options.includes(v)) throw bad(`"${f.label}" no es válido`)
      if (f.type === 'date' && v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw bad(`"${f.label}" no es una fecha válida`)
    }
    out[f.key] = v
  }
  return out
}

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1) // detrás del proxy de Vercel: el límite de intentos usa la IP real
app.use(express.json({ limit: '100kb' }))

app.get('/api/content', async (_req, res) => {
  const c = await db.getContent()
  res.set('Cache-Control', 'no-store').json({ ...c, banners: c.banners.filter((b) => b.active) })
})

// shortcut: el límite de intentos vive en memoria de cada instancia; en serverless es aproximado. Pasar a un contador en la base si hay abuso.
app.post('/api/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 }), async (req, res) => {
  const { user, password } = req.body ?? {}
  const isAdmin = same(user, ADMIN_USER) & same(password, ADMIN_PASSWORD)
  const u = !isAdmin && (await db.findUser(String(user ?? '').trim().toLowerCase()))
  if (!isAdmin && !(u && checkPw(u, password))) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
  const me = isAdmin ? ADMIN : u
  res.json({ token: jwt.sign({ sub: me.id }, JWT_SECRET, { expiresIn: '8h' }), me: publicUser(me) })
})
app.get('/api/me', auth, (req, res) => res.json(req.me))

// Formularios públicos: primero se guarda la solicitud (no se pierde si el correo falla), después se avisa por correo.
app.post('/api/requests', rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, message: { error: 'Demasiados envíos seguidos. Intente de nuevo en unos minutos o escríbanos por WhatsApp.' } }), async (req, res) => {
  const r = cleanRequest(req.body)
  if (!r) return res.status(201).json({ ok: true }) // robot: se ignora sin decirle por qué
  const id = await db.createRequest(r)
  let emailed = false
  if (process.env.RESEND_API_KEY && process.env.CONTACT_TO) {
    try {
      await sendEmail({ to: process.env.CONTACT_TO, replyTo: r.email || undefined, ...requestEmail(r) })
      await db.markEmailed(id)
      emailed = true
      if (process.env.RESEND_CONFIRM === 'true' && r.email) await sendEmail({ to: r.email, ...confirmationEmail(r) }).catch((e) => console.error('Confirmación no enviada:', e.message))
    } catch (e) {
      console.error('Correo de solicitud no enviado (queda guardada en el panel):', e.message)
    }
  }
  res.status(201).json({ ok: true, emailed })
})

const users = express.Router()
users.use(auth, allow('admin'))
users.get('/', async (_req, res) => res.json((await db.listUsers()).map(publicUser)))
users.post('/', async (req, res) => {
  const u = await db.createUser(cleanUser(req.body)).catch(dupUser)
  res.status(201).json(publicUser(u))
})
users.put('/:id', async (req, res) => {
  const existing = isId(req.params.id) && (await db.getUser(req.params.id))
  if (!existing) throw bad('No existe', 404)
  const u = await db.updateUser(existing.id, cleanUser(req.body, existing)).catch(dupUser)
  res.json(publicUser(u))
})
users.delete('/:id', async (req, res) => {
  if (isId(req.params.id)) await db.deleteUser(req.params.id)
  res.status(204).end()
})
app.use('/api/users', users)

const admin = express.Router()
admin.use(auth, allow('admin', 'empleado'))

// En memoria y máximo 4 MB: Vercel rechaza cuerpos de más de 4,5 MB.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)),
})

admin.get('/content', async (_req, res) => res.set('Cache-Control', 'no-store').json(await db.getContent()))
admin.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) throw bad('Use una imagen PNG, JPG o WebP de máximo 4 MB')
  res.json({ url: await db.uploadImage(req.file.buffer, req.file.mimetype) })
})
admin.put('/settings', async (req, res) => res.json(await db.saveSettings(clean(SETTINGS.fields, req.body))))

admin.get('/requests', async (_req, res) => res.set('Cache-Control', 'no-store').json(await db.listRequests()))
admin.put('/requests/:id', async (req, res) => {
  if (!STATUSES.includes(req.body?.status)) throw bad('Estado no válido')
  if (!isId(req.params.id) || !(await db.setRequestStatus(req.params.id, req.body.status))) throw bad('No existe', 404)
  res.json({ ok: true })
})
admin.delete('/requests/:id', allow('admin'), async (req, res) => {
  if (isId(req.params.id)) await db.deleteRequest(req.params.id)
  res.status(204).end()
})

admin.use('/:col', (req, _res, next) => next(SCHEMA[req.params.col] ? undefined : bad('No existe', 404)))
admin.post('/:col', async (req, res) => res.status(201).json(await db.createItem(req.params.col, clean(SCHEMA[req.params.col].fields, req.body))))
admin.put('/:col/:id', async (req, res) => {
  const data = clean(SCHEMA[req.params.col].fields, req.body)
  const item = isId(req.params.id) && (await db.updateItem(req.params.col, req.params.id, data))
  if (!item) throw bad('No existe', 404)
  res.json(item)
})
admin.delete('/:col/:id', async (req, res) => {
  // shortcut: la imagen del elemento queda en el bucket; limpiar archivos huérfanos si crece.
  if (isId(req.params.id)) await db.deleteItem(req.params.col, req.params.id)
  res.status(204).end()
})
app.use('/api/admin', admin)

app.use('/api', (_req, _res, next) => next(bad('No existe', 404)))

// Fuera de Vercel (local o un servidor propio) Express también sirve la web compilada.
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
if (!process.env.VERCEL && fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') err = bad('Use una imagen PNG, JPG o WebP de máximo 4 MB')
  if (!err.status) console.error(err)
  res.status(err.status ?? 500).json({ error: err.status ? err.message : 'Error del servidor. Intente de nuevo.' })
})

if (!process.env.VERCEL) app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`))

export default app
