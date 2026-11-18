# EPG S.A.S. — Sitio web

Sitio de EPG S.A.S., asesoría y gestión para alcaldías municipales. *Cada decisión, una jugada maestra.*

- **Frontend:** React + Vite, Framer Motion y piezas de ajedrez 3D con Three.js (React Three Fiber).
- **Backend:** Express. En Vercel corre como función serverless (`api/index.js`).
- **Datos:** Supabase. El contenido y los usuarios van en Postgres; las imágenes, en el bucket `uploads` de Storage.
- **Panel en `/admin`:** cuentas con roles. El administrador gestiona usuarios, los empleados editan el contenido y los clientes entran a un portal de solo consulta.

## 1. Preparar Supabase (una sola vez)

1. En el proyecto de Supabase abra **SQL Editor**, pegue el contenido de `supabase/schema.sql` y ejecútelo. Crea las tablas `settings`, `items` y `users`, y el bucket público `uploads`.
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

En local van en un archivo `.env` (copie `.env.example`). En Vercel, en **Settings → Environment Variables**.

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
