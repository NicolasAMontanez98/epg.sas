const s = (title, description, icon) => ({ title, description, icon })

export const seed = () => ({
  settings: {
    whatsapp: '573000000000',
    email: 'contacto@epgsas.com',
    phoneLabel: '',
    address: 'Colombia',
    facebook: '',
    instagram: '',
    linkedin: '',
    tiktok: '',
  },
  banners: [
    { title: 'Empalme 2028', text: 'Prepare desde hoy el relevo de su administración municipal.', linkLabel: 'Hablemos', linkUrl: '#contacto', active: true },
  ],
  services: [
    s('Asesorías en gestión pública', 'Acompañamiento estratégico para tomar decisiones con respaldo técnico y normativo.', 'Landmark'),
    s('Capacitaciones', 'Formación práctica para secretarios, jefes de oficina y equipos de la alcaldía.', 'GraduationCap'),
    s('Empalmes municipales', 'Diseño y documentación del empalme para un relevo ordenado y sin vacíos.', 'Handshake'),
    s('Programa de gobierno', 'Estructuración del programa de gobierno y su articulación con el plan de desarrollo.', 'Target'),
    s('Seguimiento a planes de mejoramiento', 'Informes de seguimiento que evidencian avances y cierran hallazgos a tiempo.', 'ClipboardCheck'),
    s('Los 12 planes institucionales', 'Elaboración y publicación oportuna de los 12 planes institucionales.', 'FileText'),
    s('Plan Anticorrupción', 'Construcción del plan y de sus informes de seguimiento de atención al ciudadano.', 'ShieldCheck'),
    s('Mapa de riesgos', 'Identificación, valoración e informe de seguimiento del mapa de riesgos institucional.', 'TriangleAlert'),
    s('Apoyo a la gestión', 'Un equipo aliado que respalda a su administración en la operación del día a día.', 'Users'),
  ],
  team: [],
  experience: [],
  infographics: [],
  dates: [
    { title: 'Elecciones locales', date: '2027-10-31', description: 'Elección de alcaldes, concejos y gobernaciones.' },
    { title: 'Posesión de nuevas administraciones', date: '2028-01-01', description: 'Inicio del periodo 2028-2031. El empalme debe estar listo.' },
    { title: 'Publicación de planes institucionales', date: '2027-01-31', description: 'Fecha límite anual para publicar los planes institucionales.' },
  ],
})
