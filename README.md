# Mundo Fungi

Sitio web en español para un emprendimiento educativo de micología y hongos comestibles. Incluye subpáginas de inicio, catálogo, especies, aprendizaje, talleres, nosotros y contacto; una cesta en USD; fotografías con atribuciones; formulario conectado a una API y panel privado de administración.

## Iniciar en desarrollo

Requiere Node.js 22.13 o posterior.

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite. El catálogo inicial incluye diez variedades comestibles con precios de ejemplo en dólares estadounidenses. En desarrollo, el acceso temporal al panel es `admin` / `mundo2026`; no reutilices estas credenciales en un despliegue.

Los mensajes de contacto y los cambios del catálogo se guardan en SQLite, en `data/mundo-fungi.sqlite`. Los mensajes también se envían a `CONTACT_TO_EMAIL` por SMTP cuando el servidor tiene credenciales configuradas. Esa carpeta está excluida de Git porque puede contener datos personales.

## Compilar y ejecutar

```bash
npm run lint
npm run build
npm start
```

El servidor sirve la web compilada y la API en el mismo origen, por defecto en `http://localhost:4173`. Para un despliegue, configura en el entorno del servidor `ADMIN_USERNAME` y `ADMIN_PASSWORD` con valores propios, largos y únicos. Puedes copiar `.env.example` a `.env` para pruebas locales; no publiques ese archivo ni sus credenciales. En producción, el inicio de sesión queda deshabilitado si faltan esas variables.

La API ofrece `GET /api/health`, `GET /api/products`, `POST /api/contact` y rutas privadas de administración para iniciar/cerrar sesión, revisar consultas y modificar el catálogo. Los productos y las consultas se guardan en SQLite. Las sesiones usan una cookie `HttpOnly` y expiran; se invalidan al reiniciar el proceso.

## Configurar el correo de contacto

1. Activa la verificación en dos pasos de la cuenta de Google que enviará los mensajes.
2. Crea una contraseña de aplicación en [la configuración de contraseñas de aplicación de Google](https://myaccount.google.com/apppasswords).
3. Copia `.env.example` a `.env` y configura `SMTP_USER` con esa cuenta y `SMTP_APP_PASSWORD` con la contraseña de aplicación, sin espacios. No uses la contraseña normal de Gmail ni compartas la contraseña de aplicación.
4. Mantén `CONTACT_TO_EMAIL=kg109867@gmail.com` para recibir ahí las consultas y reinicia el servidor.

El remitente debe ser la cuenta autenticada en Gmail. El formulario guarda cada consulta aunque el SMTP no esté configurado o falle; en ese caso muestra un error y la consulta permanece en el panel para que no se pierda. Nunca publiques `.env` ni incluyas sus valores en Git.

## Antes de publicar

- Publica el proyecto en un hosting que ejecute Node.js y sirva la API, no solo archivos estáticos. GitHub Pages por sí solo no ejecuta el backend.
- Configura las variables de entorno de administración en el proveedor y usa HTTPS.
- Configura almacenamiento persistente para `data/`; algunos hostings borran archivos locales al reiniciar o volver a desplegar.
- Revisa los textos, moneda, precios, disponibilidad, privacidad y datos de contacto para tu emprendimiento real. Verifica que el SMTP entregue correctamente los mensajes antes de usar el formulario en producción.
- Las imágenes del catálogo se sirven desde Wikimedia Commons. Cada ficha enlaza a su archivo original y muestra autoría y licencia; verifica la atribución antes de reutilizarlas fuera del sitio.
- El acceso de desarrollo no es un sistema de identidad empresarial. Antes de usar datos reales, añade controles de acceso, políticas de privacidad, copias de seguridad y un almacenamiento administrado acorde con la normativa local.

## Alcance del asistente

“Guía Fungi” es una demo local de respuestas automáticas basadas en reglas, sin modelo generativo ni envío de preguntas a servicios externos. No ofrece diagnóstico, tratamiento ni asesoría legal. Para incorporar un modelo de IA real, integra un proveedor desde el backend y define límites de privacidad, seguridad y revisión humana; nunca expongas una clave de API en el navegador.

## Información sobre psilocibina

La sección educativa no vende ni recomienda psilocibina ni la presenta como tratamiento. Resume riesgos y remite a:

- [NCCIH — Psilocybin for Mental Health and Addiction: What You Need To Know](https://www.nccih.nih.gov/health/psilocybin-for-mental-health-and-addiction-what-you-need-to-know)
- [NIDA — Psychedelic and Dissociative Drugs](https://nida.nih.gov/research-topics/psychedelic-dissociative-drugs)

El contenido del sitio no sustituye la consulta con profesionales de salud. La situación legal varía según la jurisdicción.
