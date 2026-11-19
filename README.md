# EPG S.A.S. — Sitio web

Sitio de EPG S.A.S., asesoría y gestión para alcaldías municipales. *Cada decisión, una jugada maestra.*

- **Frontend:** React + Vite, Framer Motion y piezas de ajedrez 3D con Three.js (React Three Fiber).
- **Backend:** Express. En Vercel corre como función serverless (`api/index.js`).
- **Datos:** Supabase. El contenido y los usuarios van en Postgres; las imágenes, en el bucket `uploads` de Storage.
- **Panel en `/admin`:** cuentas con roles. El administrador gestiona usuarios, los empleados editan el contenido y los clientes entran a un portal de solo consulta.

## 1. Preparar Supabase (una sola vez)

1. En el proyecto de Supabase abra **SQL Editor**, pegue el contenido de `supabase/schema.sql` y ejecútelo. Crea las tablas `settings`, `items`, `users` y `requests`, y el bucket público `uploads`. Si agrega funciones nuevas, vuelva a ejecutar el archivo completo: no duplica nada.
2. En **Project Settings → API** copie la **Project URL** y una **Secret key**.

La primera vez que el sitio arranca, carga solo el contenido inicial (servicios, fechas y datos de contacto de ejemplo).

## 2. Variables de entorno

| Variable | Valor |
|---|---|
| `ADMIN_USER` | Usuario del administrador |
| `ADMIN_PASSWORD` | Contraseña del administrador |
| `JWT_SECRET` | Cadena larga y aleatoria para firmar las sesiones |
| `SUPABASE_URL` | Project URL de Supabase |
| `SUPABASE_SECRET_KEY` | Secret key de Supabase (solo servidor) |
| `RESEND_API_KEY` | API key de Resend para enviar correos (opcional) |
| `CONTACT_TO` | Correo de EPG que recibe las solicitudes |
| `RESEND_FROM` | Remitente. Sin dominio verificado: `EPG Web <onboarding@resend.dev>` |
| `RESEND_CONFIRM` | `true` para enviar al solicitante un acuse de recibo (requiere dominio verificado) |

En local van en un archivo `.env` (copie `.env.example`). En Vercel, en **Settings → Environment Variables**.

## Solicitudes y correo

Los formularios de contacto y "Solicitar ayuda" (página de empalme) envían a `POST /api/requests`. Cada solicitud se guarda primero en la tabla `requests` de Supabase y aparece en la pestaña **Solicitudes** del panel; después se avisa por correo con Resend. Si el correo falla, la solicitud no se pierde.

- Sin dominio verificado, Resend solo entrega al correo con el que se creó la cuenta: use ese correo en `CONTACT_TO`.
- Con un dominio verificado (Resend → Domains, registros DNS) se puede usar un remitente propio, como `EPG S.A.S. <web@epgsas.com>`, y activar `RESEND_CONFIRM`.
- Protección contra spam: campo trampa invisible, límite de 5 envíos cada 15 minutos por IP y límites de longitud.
- Cada formulario pide autorización de tratamiento de datos (Ley 1581 de 2012) y enlaza `/privacidad`. Ese texto es una base: debe revisarlo un abogado.

Pruebas de la lógica: `node server/requests.test.js` y `node src/empalme/logic.test.js`.

## 3. Desarrollo local

Requiere Node.js 20 o superior.

```bash
npm install
cp .env.example .env
npm run dev
```

Abre el sitio en http://localhost:5173 y la API en http://localhost:3001.

## 4. Despliegue en Vercel

Importe el repositorio en Vercel. `vercel.json` ya define el preset Vite, el build (`npm run build`), la carpeta `dist` y las rutas de la API. Solo hay que cargar las cinco variables de entorno antes del primer despliegue.

Otra opción es un servidor propio: `npm run build` y luego `npm start`. Express sirve la web compilada y la API en el puerto `PORT`.

## Antes de publicar

- Cambie el dominio `epgsas.com` en `index.html`, `public/robots.txt` y `public/sitemap.xml` por el real.
- Ingrese al panel y actualice WhatsApp, correo y redes en **Información de la web**.

La lista de municipios del formulario de contacto (`public/municipios.json`) proviene de la DIVIPOLA del DANE.
