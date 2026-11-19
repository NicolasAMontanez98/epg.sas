// Reglas de cálculo de la página de empalme. Funciones puras, probadas en logic.test.js.

// Festivos de Colombia en la ventana de entrega del empalme (Ley 51 de 1983, traslados a lunes).
// shortcut: lista fija dic-2027 a jun-2028; ampliarla si se usan fechas fuera de ese rango.
export const HOLIDAYS = new Set([
  '2027-12-08', '2027-12-25',
  '2028-01-01', '2028-01-10', '2028-03-20', '2028-04-13', '2028-04-14',
  '2028-05-01', '2028-05-29', '2028-06-19', '2028-06-26',
])
export const RANGE = { min: '2027-12-01', max: '2028-03-31' }

const iso = (d) => d.toISOString().slice(0, 10)
const parse = (s) => new Date(s + 'T00:00:00Z')

export const isBusinessDay = (s) => {
  const wd = parse(s).getUTCDay()
  return wd !== 0 && wd !== 6 && !HOLIDAYS.has(s)
}

// Suma n días hábiles a partir del día siguiente a `from` (el día del hecho no cuenta).
export function addBusinessDays(from, n) {
  const d = parse(from)
  let left = n
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1)
    if (isBusinessDay(iso(d))) left--
  }
  return iso(d)
}

// Ley 951 de 2005: acta de informe de gestión dentro de los 15 días hábiles siguientes al retiro;
// el servidor entrante la verifica dentro de los 30 días hábiles siguientes a su recibo.
export function ley951(retiro, entregaActa) {
  const acta = addBusinessDays(retiro, 15)
  return { acta, verificacion: addBusinessDays(entregaActa || acta, 30) }
}

// Misma regla que la columna "Nivel" de la hoja D1 Alertas.
export function alertLevel(prob, impact) {
  if ((prob === 'Alta' && impact === 'Alto') || (prob === 'Alta' && impact === 'Medio') || (prob === 'Media' && impact === 'Alto')) return 'Alto'
  if (!prob || !impact) return ''
  if (prob === 'Baja' || impact === 'Bajo') return 'Bajo'
  return 'Medio'
}

// Hoja 02 Índice: entregadas / (hojas que aplican).
export function progress(statuses) {
  const list = Object.values(statuses)
  const total = list.length
  const na = list.filter((s) => s === 'No aplica').length
  const done = list.filter((s) => s === 'Entregado').length
  return { done, applicable: total - na, pct: total - na > 0 ? done / (total - na) : 0 }
}

// Días que faltan para una fecha, contando desde hoy (hora de Colombia, UTC-5).
export function daysUntil(target, now = new Date()) {
  const today = parse(new Date(now.getTime() - 5 * 3600e3).toISOString().slice(0, 10))
  return Math.round((parse(target) - today) / 86400e3)
}

// Texto separado por tabulaciones: al pegarlo en Excel cada valor cae en su celda.
export const toTSV = (rows) => rows.map((r) => r.map((v) => String(v ?? '').replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\n')
