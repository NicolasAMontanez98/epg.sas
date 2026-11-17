// Fuente única de campos: el servidor valida con esto y el dashboard genera sus formularios con esto.
export const ICONS = ['Landmark', 'GraduationCap', 'Handshake', 'Target', 'ClipboardCheck', 'FileText', 'ShieldCheck', 'TriangleAlert', 'Users']

export const SCHEMA = {
  banners: {
    label: 'Banners',
    title: 'title',
    fields: [
      { key: 'title', label: 'Título', type: 'text', required: true },
      { key: 'text', label: 'Texto', type: 'textarea' },
      { key: 'linkLabel', label: 'Texto del enlace', type: 'text' },
      { key: 'linkUrl', label: 'URL del enlace', type: 'url' },
      { key: 'active', label: 'Visible en la web', type: 'bool' },
    ],
  },
  services: {
    label: 'Servicios',
    title: 'title',
    fields: [
      { key: 'title', label: 'Nombre', type: 'text', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea', required: true },
      { key: 'icon', label: 'Ícono', type: 'select', options: ICONS },
    ],
  },
  team: {
    label: 'Equipo',
    title: 'name',
    fields: [
      { key: 'name', label: 'Nombre', type: 'text', required: true },
      { key: 'role', label: 'Cargo', type: 'text', required: true },
      { key: 'bio', label: 'Perfil', type: 'textarea' },
      { key: 'photo', label: 'Foto', type: 'image' },
    ],
  },
  dates: {
    label: 'Fechas importantes',
    title: 'title',
    fields: [
      { key: 'title', label: 'Título', type: 'text', required: true },
      { key: 'date', label: 'Fecha', type: 'date', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
    ],
  },
  experience: {
    label: 'Experiencia',
    title: 'entity',
    fields: [
      { key: 'entity', label: 'Entidad / Municipio', type: 'text', required: true },
      { key: 'title', label: 'Trabajo realizado', type: 'text', required: true },
      { key: 'year', label: 'Año', type: 'text' },
      { key: 'description', label: 'Detalle', type: 'textarea' },
    ],
  },
  infographics: {
    label: 'Infografías',
    title: 'title',
    fields: [
      { key: 'title', label: 'Título', type: 'text', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'image', label: 'Imagen', type: 'image', required: true },
    ],
  },
}

export const SETTINGS = {
  label: 'Información de la web',
  fields: [
    { key: 'whatsapp', label: 'WhatsApp (solo números con indicativo, ej. 573001234567)', type: 'text' },
    { key: 'email', label: 'Correo de contacto', type: 'text' },
    { key: 'phoneLabel', label: 'Teléfono visible', type: 'text' },
    { key: 'address', label: 'Ubicación', type: 'text' },
    { key: 'facebook', label: 'Facebook (URL)', type: 'url' },
    { key: 'instagram', label: 'Instagram (URL)', type: 'url' },
    { key: 'linkedin', label: 'LinkedIn (URL)', type: 'url' },
    { key: 'tiktok', label: 'TikTok (URL)', type: 'url' },
  ],
}
