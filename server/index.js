import express from 'express'
import multer from 'multer'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SCHEMA, SETTINGS } from '../shared/schema.js'
import { seed } from './seed.js'

const { ADMIN_USER, ADMIN_PASSWORD, JWT_SECRET, PORT = 3001 } = process.env
if (!ADMIN_USER || !ADMIN_PASSWORD || !JWT_SECRET) {
  console.error('Faltan ADMIN_USER, ADMIN_PASSWORD o JWT_SECRET en .env (ver .env.example)')
  process.exit(1)
}

const here = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(here, 'data')
const uploadDir = path.join(dataDir, 'uploads')
const dbFile = path.join(dataDir, 'db.json')
fs.mkdirSync(uploadDir, { recursive: true })

// shortcut: JSON en disco con escritura atómica, suficiente para un sitio de un solo admin; pasar a SQLite/Postgres si hay escrituras concurrentes.
const db = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile, 'utf8')) : seed()
const save = () => {
  fs.writeFileSync(dbFile + '.tmp', JSON.stringify(db, null, 2))
  fs.renameSync(dbFile + '.tmp', dbFile)
}
for (const col of Object.keys(SCHEMA)) db[col].forEach((x) => (x.id ??= crypto.randomUUID()))
db.users ??= []
save()

const digest = (v) => crypto.createHash('sha256').update(String(v)).digest()
const same = (a, b) => crypto.timingSafeEqual(digest(a), digest(b))

// ---------- Usuarios: el admin del .env gestiona cuentas de empleados (editan) y clientes (solo consultan) ----------
const ROLES = ['empleado', 'cliente']
const ADMIN = { id: 'admin', role: 'admin', name: 'Administrador', user: ADMIN_USER }
const hashPw = (pw, salt = crypto.randomBytes(16).toString('hex')) => ({ salt, hash: crypto.scryptSync(String(pw), salt, 64).toString('hex') })
const checkPw = (u, pw) => crypto.timingSafeEqual(Buffer.from(u.hash, 'hex'), crypto.scryptSync(String(pw ?? ''), u.salt, 64))
const publicUser = ({ hash, salt, ...u }) => u
// Nunca enviar la colección de usuarios (contiene hashes) junto con el contenido.
const contentOnly = () => { const { users, ...c } = db; return c }

function cleanUser(body, existing) {
  const name = String(body?.name ?? '').trim().slice(0, 120)
  const user = String(body?.user ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')
  if (!name) throw new Error('El nombre es obligatorio')
  if (!/^[a-z0-9._@-]{3,60}$/.test(user)) throw new Error('El usuario debe tener de 3 a 60 caracteres: letras, números, punto, guion o @')
  if (user === ADMIN_USER.toLowerCase() || db.users.some((u) => u.user === user && u.id !== existing?.id)) throw new Error('Ese usuario ya existe')
  if (!ROLES.includes(body?.role)) throw new Error('Rol no válido')
  if (existing && !password) return { name, user, role: body.role, salt: existing.salt, hash: existing.hash }
  if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres')
  return { name, user, role: body.role, ...hashPw(password) }
}

// Lee el usuario en cada petición: si lo borran o le cambian el rol, aplica de inmediato.
function auth(req, res, next) {
  try {
    const { sub } = jwt.verify((req.headers.authorization ?? '').replace('Bearer ', ''), JWT_SECRET)
    const me = sub === 'admin' ? ADMIN : db.users.find((u) => u.id === sub)
    if (!me) throw new Error()
    req.me = publicUser(me)
    next()
  } catch {
    res.status(401).json({ error: 'Sesión vencida' })
  }
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
      if (f.required && !v) throw new Error(`"${f.label}" es obligatorio`)
      if (f.type === 'url' && v && !/^(https?:\/\/|\/|#)/i.test(v)) throw new Error(`"${f.label}" debe empezar por http(s)://, / o #`)
      if (f.type === 'image' && v && !/^(https?:\/\/|\/uploads\/)/i.test(v)) throw new Error(`"${f.label}" no es una imagen válida`)
      if (f.type === 'select' && v && !f.options.includes(v)) throw new Error(`"${f.label}" no es válido`)
      if (f.type === 'date' && v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error(`"${f.label}" no es una fecha válida`)
    }
    out[f.key] = v
  }
  return out
}

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))
app.use('/uploads', express.static(uploadDir, { setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff') }))

const publicContent = () => ({ ...contentOnly(), banners: db.banners.filter((b) => b.active) })
app.get('/api/content', (_req, res) => res.json(publicContent()))

app.post('/api/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 }), (req, res) => {
  const { user, password } = req.body ?? {}
  const isAdmin = same(user, ADMIN_USER) & same(password, ADMIN_PASSWORD)
  const u = !isAdmin && db.users.find((x) => x.user === String(user ?? '').trim().toLowerCase())
  if (!isAdmin && !(u && checkPw(u, password))) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
  const me = isAdmin ? ADMIN : u
  res.json({ token: jwt.sign({ sub: me.id }, JWT_SECRET, { expiresIn: '8h' }), me: publicUser(me) })
})
app.get('/api/me', auth, (req, res) => res.json(req.me))

const users = express.Router()
users.use(auth, allow('admin'))
users.get('/', (_req, res) => res.json(db.users.map(publicUser)))
users.post('/', (req, res) => {
  try {
    const u = { id: crypto.randomUUID(), ...cleanUser(req.body) }
    db.users.push(u)
    save()
    res.status(201).json(publicUser(u))
  } catch (e) { res.status(400).json({ error: e.message }) }
})
users.put('/:id', (req, res) => {
  const i = db.users.findIndex((u) => u.id === req.params.id)
  if (i < 0) return res.status(404).json({ error: 'No existe' })
  try {
    db.users[i] = { id: req.params.id, ...cleanUser(req.body, db.users[i]) }
    save()
    res.json(publicUser(db.users[i]))
  } catch (e) { res.status(400).json({ error: e.message }) }
})
users.delete('/:id', (req, res) => {
  db.users = db.users.filter((u) => u.id !== req.params.id)
  save()
  res.status(204).end()
})
app.use('/api/users', users)

const admin = express.Router()
admin.use(auth, allow('admin', 'empleado'))

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => cb(null, crypto.randomUUID() + { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' }[file.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)),
})

admin.get('/content', (_req, res) => res.json(contentOnly()))
admin.post('/upload', upload.single('file'), (req, res) =>
  req.file ? res.json({ url: '/uploads/' + req.file.filename }) : res.status(400).json({ error: 'Use una imagen PNG, JPG o WebP de máximo 5 MB' }))

admin.put('/settings', (req, res) => {
  try {
    db.settings = clean(SETTINGS.fields, req.body)
    save()
    res.json(db.settings)
  } catch (e) { res.status(400).json({ error: e.message }) }
})

admin.use('/:col', (req, res, next) => (SCHEMA[req.params.col] ? next() : res.status(404).json({ error: 'No existe' })))
admin.post('/:col', (req, res) => {
  try {
    const item = { id: crypto.randomUUID(), ...clean(SCHEMA[req.params.col].fields, req.body) }
    db[req.params.col].push(item)
    save()
    res.status(201).json(item)
  } catch (e) { res.status(400).json({ error: e.message }) }
})
admin.put('/:col/:id', (req, res) => {
  const i = db[req.params.col].findIndex((x) => x.id === req.params.id)
  if (i < 0) return res.status(404).json({ error: 'No existe' })
  try {
    db[req.params.col][i] = { id: req.params.id, ...clean(SCHEMA[req.params.col].fields, req.body) }
    save()
    res.json(db[req.params.col][i])
  } catch (e) { res.status(400).json({ error: e.message }) }
})
admin.delete('/:col/:id', (req, res) => {
  db[req.params.col] = db[req.params.col].filter((x) => x.id !== req.params.id)
  save() // shortcut: la imagen subida queda en disco; limpiar uploads huérfanos si crece.
  res.status(204).end()
})
app.use('/api/admin', admin)

app.use('/api', (_req, res) => res.status(404).json({ error: 'No existe' }))
app.use((err, _req, res, _next) => res.status(400).json({ error: err.message }))

const dist = path.join(here, '..', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`))
