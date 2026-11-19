// Contenido de la página de empalme, tomado de la Guía Práctica de Empalme y del libro Formatos_Empalme_2024-2027.

export const KEY_DATES = [
  { date: '2027-06-30', title: 'Inicia la Ley de Garantías', text: 'Cuatro meses antes de elecciones: sin convenios interadministrativos ni cambios de nómina (Ley 996 de 2005).' },
  { date: '2027-09-30', title: 'Corte de la información', text: 'Fecha de corte de los formatos B y C para el informe de gestión.' },
  { date: '2027-10-31', title: 'Elecciones locales', text: 'Elección de alcaldes y concejos para el periodo 2028-2031.' },
  { date: '2027-12-31', title: 'Fin del periodo 2024-2027', text: 'Último día de la administración saliente.' },
  { date: '2028-01-01', title: 'Posesión', text: 'Inicia la administración 2028-2031. Desde hoy se entregan las credenciales de plataformas.' },
]

export const PHASES = [
  { n: 1, name: 'Alistamiento', when: 'Ene – jun 2027', items: ['Decreto de lineamientos y conformación de la Comisión de Transición', 'Socializar la guía y los formatos con todas las dependencias', 'Diagnóstico documental: TRD y FUID', 'Depurar SECOP e identificar contratos por liquidar', 'Prever las restricciones de la Ley 996 de 2005'] },
  { n: 2, name: 'Informe y rendición de cuentas', when: 'Jul – nov 2027', items: ['Diligenciar los formatos B y C (corte 30 de septiembre)', 'Agendas participativas con la ciudadanía', 'Consolidar el informe de gestión y balance de resultados', 'Rendición de cuentas final con diálogo social'] },
  { n: 3, name: 'Empalme', when: 'Nov – dic 2027', items: ['Instalación con el equipo del mandatario electo', 'Mesas temáticas y actas parciales', 'Sesiones aclaratorias', 'Presupuesto 2028 y cierre fiscal'] },
  { n: 4, name: 'Entrega formal y cierre', when: 'Ene – feb 2028', items: ['Acto protocolario de entrega del informe de gestión', 'Entrega de credenciales de plataformas desde el 1 de enero', 'Acta de informe de gestión (Ley 951 de 2005)', 'Verificación del acta por la administración entrante', 'Sistematizar y publicar el proceso'] },
]

export const MOMENTS = [
  ['Informe de gestión y balance de resultados', 'Qué se hizo en el cuatrienio, con cifras, fuente y fecha de corte.'],
  ['Rendición de cuentas final', 'La administración saliente explica sus resultados a la ciudadanía.'],
  ['Empalme', 'Entrega ordenada de la información y los asuntos en curso al equipo entrante, mesa por mesa.'],
]

export const RISKS = [
  ['Servicios esenciales sin contrato', 'Aseo, PAE o transporte escolar con contratos que vencen el 31 de diciembre sin reemplazo.', 'B06 · C01'],
  ['Presupuesto 2028 insuficiente', 'Un presupuesto aprobado que no cubre los compromisos del primer trimestre.', 'B03'],
  ['Vigencias futuras sin respaldo', 'Compromisos de años siguientes sin fuente de financiación clara.', 'B04'],
  ['Obras con avance financiero mayor al físico', 'Se pagó más de lo que se construyó.', 'B07 · B02'],
  ['Archivos sin inventario', 'Sin FUID no hay forma de probar qué se entregó.', 'B11'],
  ['Plataformas en correos personales', 'SECOP, CHIP u otros sistemas atados a cuentas de funcionarios que se van.', 'B12'],
]

// Hojas del libro: [código, nombre, contenido, dependencia responsable, mesa, ayuda]
const C_TIP = 'Cinco bloques: indicadores con línea base 2023 y meta del cuatrienio, instrumentos y obligaciones del sector, proyectos que deben continuar, alertas (se llevan a D1) y preguntas estratégicas que responde la administración saliente.'
export const SHEETS = [
  ['00', 'Instructivo', 'Propósito del libro, convenciones y reglas', 'Secretaría técnica', '—', 'Léalo antes de empezar: explica los colores de las celdas, cómo agregar filas y qué no se escribe nunca en el libro.'],
  ['01', 'Datos generales', 'Datos de la entidad territorial', 'Secretaría técnica', '—', 'Llénela primero. Municipio, departamento y fecha de corte alimentan los encabezados de todas las hojas. Puede prepararla con el asistente de esta página.'],
  ['02', 'Índice', 'Índice y control de avance', 'Secretaría técnica', '—', 'Asigna cada hoja a una dependencia y a su par entrante. El estado de cada hoja calcula el porcentaje de avance del libro.'],
  ['A1', 'Cronograma', 'Cronograma del proceso de transición', 'Secretaría técnica (Planeación)', '—', 'Trae 18 actividades sugeridas en 4 fases. Ajuste las fechas: los días calendario se calculan solos.'],
  ['A2', 'Comisión y mesas', 'Comisión de transición y mesas temáticas', 'Secretaría técnica (Planeación)', '—', 'Una fila por integrante de la comisión saliente y del equipo entrante. Abajo están las 20 mesas temáticas con las hojas que revisa cada una.'],
  ['A3', 'Sesiones y actas', 'Registro de sesiones y compromisos', 'Secretaría técnica (Planeación)', '—', 'Cada sesión termina con un acta parcial firmada por ambas administraciones. Tipos de sesión: instalación, entrega, aclaratoria y cierre.'],
  ['A4', 'Lista de entregables', 'Entregables mínimos (MIPG)', 'Todas las dependencias', '—', '50 entregables mínimos. Marque Entregado, Parcial, Pendiente o No aplica, e indique dónde está el soporte.'],
  ['B01', 'Plan de desarrollo', 'Balance del Plan de Desarrollo 2024-2027', 'Planeación', 'Mesa 1', 'Avance de metas con la fuente de cada cifra. Es la línea base del próximo plan.'],
  ['B02', 'Banco de proyectos', 'Banco de proyectos e inversión (incluye SGR)', 'Planeación', 'Mesa 1', 'Cada proyecto con código BPIN, fuente de financiación y estado.'],
  ['B03', 'Hacienda y presupuesto', 'Ingresos, gastos, indicadores fiscales y cierre', 'Hacienda', 'Mesa 2', 'Incluya el presupuesto 2028 aprobado. Alerta típica: no alcanza para los compromisos del primer trimestre.'],
  ['B04', 'Deuda y pasivos', 'Deuda pública, pasivos y contingencias', 'Hacienda', 'Mesa 2', 'Revise las vigencias futuras: cada una debe tener su respaldo.'],
  ['B05', 'Contable', 'Estados financieros y pendientes contables', 'Hacienda – Contabilidad', 'Mesa 2', 'Estados financieros con notas y los pendientes de depuración contable.'],
  ['B06', 'Contratación', 'Contratos, vencimientos, procesos y liquidaciones', 'Contratación / Jurídica', 'Mesa 3', 'Cada contrato con su número SECOP, modalidad, valores y estado. El valor total y el saldo por pagar se calculan solos. Revise los contratos que vencen entre diciembre de 2027 y marzo de 2028.'],
  ['B07', 'Obras públicas', 'Obras públicas y su estado', 'Obras / Infraestructura', 'Mesa 3', 'Compare el avance físico con el financiero de cada obra: si se pagó más de lo construido, es una alerta.'],
  ['B08', 'Talento humano', 'Planta, situaciones y asuntos laborales', 'Talento humano', 'Mesa 4', 'Planta de personal, situaciones administrativas y concursos en curso.'],
  ['B09', 'Defensa jurídica', 'Procesos judiciales, fallos y conciliaciones', 'Jurídica', 'Mesa 5', 'Relación de procesos con su estado y las contingencias que pueden costarle al municipio.'],
  ['B10', 'Bienes', 'Bienes muebles, inmuebles y parque automotor', 'Almacén / Sec. General', 'Mesa 6', 'Inventario de bienes con su estado y ubicación.'],
  ['B11', 'Gestión documental', 'Instrumentos archivísticos y FUID', 'Gestión documental', 'Mesa 6', 'Sin inventario documental (FUID) no hay cómo probar qué se entregó. Empiece en el alistamiento.'],
  ['B12', 'TIC y plataformas', 'Plataformas, sistemas y gobierno digital', 'TIC', 'Mesa 7', 'Relacione cada plataforma, pero nunca escriba usuarios ni contraseñas: se entregan en sobre sellado desde el 1 de enero. Las cuentas deben ser institucionales, no personales.'],
  ['B13', 'Control interno', 'Planes de mejoramiento y evaluación', 'Control interno (informativo)', 'Mesa 7', 'Control Interno informa con voz y sin voto. No aprueba ni refrenda el informe.'],
  ['B14', 'Transparencia y PQRSD', 'PQRSD, transparencia y rendición de cuentas', 'Atención al ciudadano', 'Mesa 7', 'Peticiones abiertas y su estado, y los informes de rendición de cuentas.'],
  ['B15', 'Instancias', 'Comités, consejos y juntas', 'Todas', 'Mesa 7', 'Cada instancia con su acto de creación y su última sesión.'],
  ['B16', 'Reportes', 'Calendario de informes y reportes', 'Todas', 'Mesa 7', 'Qué informes vencen en los primeros meses de 2028 y ante quién.'],
  ['B17', 'Planes y políticas', 'Planes y políticas públicas', 'Planeación', 'Mesa 1', 'Planes y políticas vigentes con su acto de adopción.'],
  ['C01', 'Educación', 'Educación y alimentación escolar', 'Educación', 'Mesa 8', C_TIP + ' Pregunta clave: cómo se garantizan el PAE y el transporte escolar al iniciar 2028.'],
  ['C02', 'Salud', 'Salud y protección social', 'Salud', 'Mesa 9', C_TIP],
  ['C03', 'Agua y servicios públicos', 'Agua potable, saneamiento básico y servicios públicos', 'Servicios públicos', 'Mesa 10', C_TIP],
  ['C04', 'Ordenamiento y vivienda', 'Ordenamiento territorial, vivienda, catastro y espacio público', 'Planeación', 'Mesa 11', C_TIP],
  ['C05', 'Vías y movilidad', 'Infraestructura vial, transporte y movilidad', 'Obras / Infraestructura', 'Mesa 12', C_TIP],
  ['C06', 'Rural y ambiente', 'Desarrollo rural, agropecuario y ambiente', 'Desarrollo rural / ambiente', 'Mesa 13', C_TIP],
  ['C07', 'Gestión del riesgo', 'Gestión del riesgo de desastres', 'Gestión del riesgo', 'Mesa 14', C_TIP],
  ['C08', 'Gobierno y seguridad', 'Gobierno, seguridad, convivencia y justicia', 'Gobierno', 'Mesa 15', C_TIP],
  ['C09', 'Inclusión social', 'Inclusión social y atención a poblaciones', 'Desarrollo social', 'Mesa 16', C_TIP],
  ['C10', 'Víctimas y paz', 'Víctimas, construcción de paz y derechos humanos', 'Gobierno / Desarrollo social', 'Mesa 17', C_TIP],
  ['C11', 'Cultura, deporte y turismo', 'Cultura, deporte, recreación y turismo', 'Cultura y deporte', 'Mesa 18', C_TIP],
  ['C12', 'Desarrollo económico', 'Desarrollo económico, empleo, ciencia, tecnología e innovación', 'Desarrollo económico', 'Mesa 19', C_TIP],
  ['C13', 'Participación', 'Participación ciudadana y acción comunal', 'Gobierno / Participación', 'Mesa 19', C_TIP],
  ['C14', 'Descentralizadas', 'Entidades descentralizadas y esquemas asociativos', 'Despacho / gerentes', 'Mesa 20', C_TIP],
  ['D1', 'Alertas', 'Matriz consolidada de alertas y riesgos', 'Secretaría técnica', '—', 'Reúne las alertas de nivel Alto y Medio de las hojas B y C. El nivel sale de probabilidad × impacto: puede calcularlo con el asistente.'],
  ['D2', 'Entrega del despacho', 'Fichas de entrega por dependencia', 'Cada secretario(a)', '—', 'Una ficha por secretario: cómo encontró y cómo entrega la dependencia, logros, asuntos en trámite, lecciones y recomendaciones al sucesor.'],
].map(([code, name, content, owner, mesa, tip]) => ({ code, name, content, owner, mesa, tip, group: /^\d/.test(code) ? 'Inicio' : code[0] }))

export const GROUPS = [
  ['Inicio', 'Inicio', 'Instructivo, datos generales e índice'],
  ['A', 'A · Organización', 'Cronograma, comisión, actas y entregables'],
  ['B', 'B · Transversales', 'Ley 951 de 2005 y MIPG, por dependencia'],
  ['C', 'C · Sectoriales', 'Cada competencia municipal, mesa por mesa'],
  ['D', 'D · Cierre', 'Alertas consolidadas y entrega del despacho'],
]

// Hoja 01: una fila por campo, en el orden de la columna C (filas 5 a 25).
export const GENERAL_FIELDS = [
  { key: 'municipio', label: 'Municipio' },
  { key: 'departamento', label: 'Departamento' },
  { key: 'dane', label: 'Código DANE', pattern: '\\d{5}', hint: '5 dígitos' },
  { key: 'categoria', label: 'Categoría (Ley 617 de 2000 / Ley 1551 de 2012)', options: ['Especial', '1', '2', '3', '4', '5', '6'] },
  { key: 'nit', label: 'NIT', pattern: '\\d{9}(-\\d)?', hint: '9 dígitos y dígito de verificación, ej. 891800000-1' },
  { key: 'corte', label: 'Fecha de corte de la información', type: 'date', value: '2027-11-30' },
  { key: 'saliente', label: 'Alcalde(sa) saliente 2024-2027' },
  { key: 'electo', label: 'Alcalde(sa) electo(a) 2028-2031' },
  { key: 'eleccion', label: 'Fecha de elección', type: 'date', value: '2027-10-31' },
  { key: 'posesion', label: 'Fecha de posesión del nuevo mandatario', type: 'date', value: '2028-01-01' },
  { key: 'acto', label: 'Acto administrativo de conformación de la Comisión de Empalme' },
  { key: 'coordSal', label: 'Coordinador(a) de empalme – administración saliente' },
  { key: 'coordEnt', label: 'Coordinador(a) de empalme – administración entrante' },
  { key: 'oci', label: 'Jefe de la Oficina de Control Interno' },
  { key: 'personero', label: 'Personero(a) municipal' },
  { key: 'poblacion', label: 'Población proyectada DANE (año de corte)', type: 'number' },
  { key: 'secretarias', label: 'Número de secretarías / dependencias del nivel central', type: 'number' },
  { key: 'descentralizadas', label: 'Entidades descentralizadas (número)', type: 'number' },
  { key: 'pdet', label: '¿Municipio PDET?', options: ['Sí', 'No'] },
  { key: 'pdt', label: 'Plan de Desarrollo 2024-2027 (nombre y acuerdo)' },
  { key: 'correo', label: 'Correo institucional de contacto del empalme', type: 'email' },
]

// Listas de la hoja D1 Alertas.
export const ALERT_TYPES = ['Legal', 'Financiero', 'Prestación del servicio', 'Contractual', 'Judicial', 'Documental', 'Reputacional']
export const INDEX_STATUSES = ['Sin iniciar', 'En diligenciamiento', 'En revisión', 'Entregado', 'No aplica']
