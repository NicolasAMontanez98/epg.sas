# EPG S.A.S. — Sitio web

Sitio de EPG S.A.S., asesoría y gestión para alcaldías municipales. *Cada decisión, una jugada maestra.*

- **Frontend:** React + Vite, Framer Motion y piezas de ajedrez 3D con Three.js (React Three Fiber).
- **Backend:** Express. Guarda el contenido en `server/data/db.json` y las imágenes en `server/data/uploads/`.
- **Panel en `/admin`:** cuentas con roles. El administrador gestiona usuarios, los empleados editan el contenido y los clientes entran a un portal de solo consulta.

## Requisitos

Node.js 20 o superior.

## Instalación

```bash
npm install
cp .env.example .env
```

Edite `.env` y defina `ADMIN_USER`, `ADMIN_PASSWORD` y un `JWT_SECRET` largo y aleatorio. El servidor no arranca sin esos valores.

## Desarrollo

```bash
npm run dev
```

Abre el sitio en http://localhost:5173 y la API en http://localhost:3001.

## Producción

```bash
npm run build
npm start
```

El servidor sirve la web compilada y la API en el puerto definido en `PORT` (por defecto 3001).

## Antes de publicar

- Cambie el dominio `epgsas.com` en `index.html`, `public/robots.txt` y `public/sitemap.xml` por el real.
- Ingrese al panel y actualice WhatsApp, correo y redes en **Información de la web**.
- Haga copias de seguridad de `server/data/`: ahí están el contenido, los usuarios y las imágenes.

La lista de municipios del formulario de contacto (`public/municipios.json`) proviene de la DIVIPOLA del DANE.
