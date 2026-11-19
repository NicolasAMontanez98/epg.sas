import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { api } from './api.js'

// Texto base de la política (Ley 1581 de 2012 y Decreto 1377 de 2013). Debe revisarlo un abogado antes de publicar la versión definitiva.
export default function Privacy() {
  const [s, setS] = useState({})
  useEffect(() => {
    document.title = 'Política de tratamiento de datos | EPG S.A.S.'
    api.content().then((c) => setS(c.settings)).catch(() => {})
  }, [])
  const contact = [s.email, s.phoneLabel].filter(Boolean).join(' · ') || 'los canales publicados en este sitio'
  return (
    <main className="privacy">
      <a href="/" className="back-link"><ArrowLeft size={14} aria-hidden /> Volver a EPG S.A.S.</a>
      <p className="mono">Ley 1581 de 2012 · Decreto 1377 de 2013</p>
      <h1>Política de tratamiento de datos personales</h1>

      <h2>Responsable</h2>
      <p>EPG S.A.S. es responsable del tratamiento de los datos personales que se recogen en este sitio. Contacto: {contact}.</p>

      <h2>Qué datos recogemos</h2>
      <p>Los que usted escribe en los formularios: nombre, cargo o dependencia, municipio, correo, teléfono y el contenido de su consulta. En la página de empalme, si usted lo decide, también la información que diligenció en el asistente.</p>

      <h2>Para qué los usamos</h2>
      <ul>
        <li>Responder su solicitud y hacerle seguimiento.</li>
        <li>Enviarle información sobre los servicios de asesoría que pidió.</li>
      </ul>
      <p>No vendemos ni cedemos sus datos a terceros para fines comerciales.</p>

      <h2>Quién más los procesa</h2>
      <p>Para operar el sitio usamos proveedores que actúan como encargados del tratamiento: alojamiento web (Vercel), base de datos (Supabase) y envío de correos (Resend). Sus servidores pueden estar fuera de Colombia; con ellos solo compartimos lo necesario para prestar el servicio.</p>

      <h2>Sus derechos</h2>
      <p>Usted puede conocer, actualizar, rectificar y pedir la supresión de sus datos, revocar la autorización y presentar quejas ante la Superintendencia de Industria y Comercio. Para ejercerlos, escríbanos a {contact}. Respondemos consultas en máximo 10 días hábiles y reclamos en máximo 15 días hábiles.</p>

      <h2>Cuánto tiempo los guardamos</h2>
      <p>Mientras sea necesario para atender su solicitud y la relación de asesoría, o hasta que usted pida su supresión, salvo que una norma exija conservarlos por más tiempo.</p>

      <p className="mono privacy-date">Vigente desde noviembre de 2026.</p>
    </main>
  )
}
