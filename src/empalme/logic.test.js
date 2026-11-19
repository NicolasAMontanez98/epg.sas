// Ejecutar con: node src/empalme/logic.test.js
import assert from 'node:assert/strict'
import { addBusinessDays, alertLevel, daysUntil, isBusinessDay, ley951, progress, toTSV } from './logic.js'

// Festivos y fines de semana no cuentan.
assert.equal(isBusinessDay('2028-01-10'), false) // Reyes trasladado al lunes
assert.equal(isBusinessDay('2028-01-08'), false) // sábado
assert.equal(isBusinessDay('2028-01-11'), true)

// Retiro el viernes 31-dic-2027: 15 hábiles desde el 3-ene saltando el 10-ene → lunes 24-ene-2028.
assert.equal(addBusinessDays('2027-12-31', 15), '2028-01-24')
// 30 hábiles desde el 24-ene-2028 (2028 es bisiesto: cuenta el 29-feb) → 6-mar-2028.
assert.deepEqual(ley951('2027-12-31'), { acta: '2028-01-24', verificacion: '2028-03-06' })
assert.equal(ley951('2027-12-31', '2028-01-14').verificacion, '2028-02-25')

// Nivel de alerta: misma tabla que la fórmula de D1.
const cases = [
  ['Alta', 'Alto', 'Alto'], ['Alta', 'Medio', 'Alto'], ['Media', 'Alto', 'Alto'],
  ['Media', 'Medio', 'Medio'], ['Alta', 'Bajo', 'Bajo'], ['Baja', 'Alto', 'Bajo'], ['', 'Alto', ''],
]
for (const [p, i, want] of cases) assert.equal(alertLevel(p, i), want, `${p}/${i}`)

assert.deepEqual(progress({ a: 'Entregado', b: 'No aplica', c: 'Sin iniciar', d: 'Entregado' }), { done: 2, applicable: 3, pct: 2 / 3 })
assert.deepEqual(progress({ a: 'No aplica' }), { done: 0, applicable: 0, pct: 0 })

assert.equal(daysUntil('2028-01-01', new Date('2027-12-31T12:00:00-05:00')), 1)
assert.equal(daysUntil('2028-01-01', new Date('2028-01-01T02:00:00Z')), 1) // aún es 31-dic en Colombia

assert.equal(toTSV([['a\tb', 'c'], ['d', null]]), 'a b\tc\nd\t')
console.log('OK: lógica de empalme')
