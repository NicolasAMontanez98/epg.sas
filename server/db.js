// Acceso a Supabase (Postgres + Storage). Solo el servidor usa la secret key; nunca llega al navegador.
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { SCHEMA } from '../shared/schema.js'
import { seed } from './seed.js'

// Se crea al primer uso, así server/index.js puede validar antes las variables de entorno.
let client
const sb = () => (client ??= createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } }))
const BUCKET = 'uploads'

const must = ({ data, error }) => {
  if (error) {
    const e = new Error(error.message)
    e.code = error.code
    throw e
  }
  return data
}

// La primera vez carga el contenido inicial. ignoreDuplicates evita sembrar dos veces si arrancan dos instancias a la vez.
let seeding
export function ensureSeed() {
  seeding ??= (async () => {
    const s = seed()
    const created = must(await sb().from('settings').upsert({ id: 1, data: s.settings }, { onConflict: 'id', ignoreDuplicates: true }).select('id'))
    if (!created.length) return
    const items = Object.keys(SCHEMA).flatMap((collection) => s[collection].map((data, position) => ({ collection, data, position })))
    if (items.length) must(await sb().from('items').insert(items))
  })().catch((e) => { seeding = null; throw e })
  return seeding
}

export async function getContent() {
  await ensureSeed()
  const [settings, items] = await Promise.all([
    sb().from('settings').select('data').eq('id', 1).single(),
    sb().from('items').select('id, collection, data').order('created_at').order('position'),
  ])
  const out = { settings: must(settings).data }
  for (const col of Object.keys(SCHEMA)) out[col] = []
  for (const r of must(items)) out[r.collection]?.push({ ...r.data, id: r.id })
  return out
}

export async function createItem(collection, data) {
  const [r] = must(await sb().from('items').insert({ collection, data }).select('id'))
  return { ...data, id: r.id }
}

export async function updateItem(collection, id, data) {
  const rows = must(await sb().from('items').update({ data }).eq('id', id).eq('collection', collection).select('id'))
  return rows.length ? { ...data, id } : null
}

export async function deleteItem(collection, id) {
  must(await sb().from('items').delete().eq('id', id).eq('collection', collection))
}

export async function saveSettings(data) {
  must(await sb().from('settings').upsert({ id: 1, data, updated_at: new Date().toISOString() }))
  return data
}

// ---------- Usuarios ----------
const toUser = (r) => r && { id: r.id, name: r.name, user: r.username, role: r.role, salt: r.salt, hash: r.hash }
const toRow = (u) => ({ name: u.name, username: u.user, role: u.role, salt: u.salt, hash: u.hash })

export const listUsers = async () => must(await sb().from('users').select('*').order('created_at')).map(toUser)
export const findUser = async (username) => toUser(must(await sb().from('users').select('*').eq('username', username).maybeSingle()))
export const getUser = async (id) => toUser(must(await sb().from('users').select('*').eq('id', id).maybeSingle()))
export const createUser = async (u) => toUser(must(await sb().from('users').insert(toRow(u)).select('*').single()))
export async function updateUser(id, u) {
  return toUser(must(await sb().from('users').update(toRow(u)).eq('id', id).select('*').maybeSingle()))
}
export async function deleteUser(id) {
  must(await sb().from('users').delete().eq('id', id))
}

// ---------- Imágenes ----------
const EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' }
export async function uploadImage(buffer, mimetype) {
  const name = crypto.randomUUID() + EXT[mimetype]
  must(await sb().storage.from(BUCKET).upload(name, buffer, { contentType: mimetype, cacheControl: '31536000' }))
  return sb().storage.from(BUCKET).getPublicUrl(name).data.publicUrl
}

// ---------- Solicitudes ----------
export async function createRequest(r) {
  const { payload, ...cols } = r
  return must(await sb().from('requests').insert({ ...cols, payload, consent_at: new Date().toISOString() }).select('id').single()).id
}
export async function markEmailed(id) {
  must(await sb().from('requests').update({ emailed: true }).eq('id', id))
}
export const listRequests = async () => must(await sb().from('requests').select('*').order('created_at', { ascending: false }).limit(500))
export async function setRequestStatus(id, status) {
  return must(await sb().from('requests').update({ status }).eq('id', id).select('id')).length > 0
}
export async function deleteRequest(id) {
  must(await sb().from('requests').delete().eq('id', id))
}
