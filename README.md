# Mundo Fungi

Sitio web en español para un emprendimiento educativo de micología y hongos comestibles. Incluye subpáginas de inicio, catálogo, especies, aprendizaje, talleres, nosotros y contacto; una cesta en USD; fotografías con atribuciones; formulario conectado a una API y panel privado de administración.

## Iniciar en desarrollo

Requiere Node.js 22.13 o posterior.

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite. El catálogo inicial incluye diez variedades comestibles con precios de ejemplo en dólares estadounidenses. En desarrollo, el acceso temporal al panel es `admin` / `mundo2026`; no reutilices estas credenciales en un despliegue.

La API requiere una instancia MongoDB. Copia `.env.example` a `.env`, agrega tu URI de MongoDB Atlas a `MONGODB_URI` y configura `MONGODB_DB`. Al conectar por primera vez, inserta las diez fichas iniciales si aún no existen; no reemplaza productos que ya estén en la colección. Los mensajes de contacto y cambios del catálogo también se guardan en MongoDB.

## Compilar y ejecutar

```bash
npm run lint
npm run build
npm start
```

El servidor sirve la web compilada y la API en el mismo origen, por defecto en `http://localhost:4173`. Configura `MONGODB_URI`, `MONGODB_DB`, `ADMIN_USERNAME` y `ADMIN_PASSWORD` en el entorno del servidor. Usa credenciales propias, largas y únicas; no publiques `.env` ni sus valores. En producción, el inicio de sesión queda deshabilitado si faltan las variables de administración.

La API ofrece `GET /api/health`, `GET /api/products`, `POST /api/contact` y rutas privadas de administración para iniciar/cerrar sesión, revisar consultas y modificar el catálogo. Las sesiones expiran y se invalidan al reiniciar el proceso. El inicio de sesión devuelve un token que se mantiene solo en memoria en el navegador; nunca se guarda en `localStorage`.

La base SQLite local de versiones anteriores no se migra automáticamente. Si contiene consultas o productos que necesites conservar, expórtalos e impórtalos antes de cambiar de base.

## Configurar el correo de contacto

1. Activa la verificación en dos pasos de la cuenta de Google que enviará los mensajes.
2. Crea una contraseña de aplicación en [la configuración de contraseñas de aplicación de Google](https://myaccount.google.com/apppasswords).
3. Copia `.env.example` a `.env` y configura `SMTP_USER` con esa cuenta y `SMTP_APP_PASSWORD` con la contraseña de aplicación, sin espacios. No uses la contraseña normal de Gmail ni compartas la contraseña de aplicación.
4. Configura `CONTACT_TO_EMAIL` con la dirección que recibirá las consultas y reinicia el servidor.

El remitente debe ser la cuenta autenticada en Gmail. El formulario guarda cada consulta aunque el SMTP no esté configurado o falle; en ese caso muestra un error y la consulta permanece en el panel para que no se pierda. Nunca publiques `.env` ni incluyas sus valores en Git.

## Publicar con GitHub Pages, Render y MongoDB Atlas

GitHub Pages publica el frontend; no ejecuta Node.js. Para que el catálogo dinámico, el formulario y el panel funcionen, despliega la API en un servicio Node.js como Render y conecta esa API a MongoDB Atlas. `render.yaml` contiene la configuración inicial del servicio.

### 1. Crear MongoDB Atlas

1. Crea un clúster en [MongoDB Atlas](https://www.mongodb.com/atlas/database) y un usuario de base de datos con contraseña propia.
2. En **Network Access**, permite conexiones desde Render. Para pruebas puedes permitir `0.0.0.0/0`, pero usa una contraseña robusta y limita las conexiones si tu plan/proveedor ofrece una IP de salida fija.
3. Copia la URI de conexión y reemplaza usuario, contraseña y host. Si la contraseña contiene caracteres especiales, codifícala para URL.

### 2. Desplegar la API en Render

1. Sube el proyecto a un repositorio de GitHub.
2. En Render, crea un **Blueprint** desde ese repositorio y acepta `render.yaml`, o crea un servicio web Node.js con `npm ci && npm run build` como comando de compilación y `npm start` como comando de inicio.
3. Configura estas variables en Render: `MONGODB_URI`, `MONGODB_DB` (`mundo_fungi`), `ADMIN_USERNAME`, `ADMIN_PASSWORD` y `FRONTEND_ORIGIN`. Esta última debe ser el origen de Pages, por ejemplo `https://TU_USUARIO.github.io` (sin la ruta del repositorio).
4. Si quieres que el formulario envíe correos, configura también las variables `SMTP_*` y `CONTACT_TO_EMAIL` descritas arriba.
5. Despliega y comprueba `https://TU_API.onrender.com/api/health`; debe responder `{"status":"ok"}`.

### 3. Publicar el frontend en GitHub Pages

1. En GitHub, abre **Settings → Pages** y elige **GitHub Actions** como fuente.
2. Abre **Settings → Secrets and variables → Actions → Variables** y crea `VITE_API_BASE_URL` con la URL de tu API, por ejemplo `https://TU_API.onrender.com` (sin `/` al final).
3. Sube los cambios a la rama `main`. El flujo `.github/workflows/deploy-pages.yml` compilará y publicará el sitio. Si ya había corrido antes de agregar la variable, vuelve a ejecutarlo en **Actions → Deploy to GitHub Pages → Run workflow**.
4. Abre el enlace indicado en **Settings → Pages**, normalmente `https://TU_USUARIO.github.io/TU_REPOSITORIO/`.

Sin `VITE_API_BASE_URL`, Pages presenta el catálogo de ejemplo y oculta las funciones que requieren backend. Al configurarlo, la web se conecta a Render; el servidor solo acepta solicitudes desde el origen definido en `FRONTEND_ORIGIN`.

Antes de usarlo con clientes, revisa textos, moneda, precios, privacidad y datos de contacto, y prueba el formulario y el panel. Las imágenes del catálogo se sirven desde Wikimedia Commons; cada ficha enlaza al archivo original y muestra su autoría y licencia.

## Alcance del asistente

“Guía Fungi” es una demo local de respuestas automáticas basadas en reglas, sin modelo generativo ni envío de preguntas a servicios externos. No ofrece diagnóstico, tratamiento ni asesoría legal. Para incorporar un modelo de IA real, integra un proveedor desde el backend y define límites de privacidad, seguridad y revisión humana; nunca expongas una clave de API en el navegador.

## Información sobre psilocibina

La sección educativa no vende ni recomienda psilocibina ni la presenta como tratamiento. Resume riesgos y remite a:

- [NCCIH — Psilocybin for Mental Health and Addiction: What You Need To Know](https://www.nccih.nih.gov/health/psilocybin-for-mental-health-and-addiction-what-you-need-to-know)
- [NIDA — Psychedelic and Dissociative Drugs](https://nida.nih.gov/research-topics/psychedelic-dissociative-drugs)

El contenido del sitio no sustituye la consulta con profesionales de salud. La situación legal varía según la jurisdicción.
