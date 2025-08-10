# 🚀 Guía de Despliegue - Emooti

## Despliegue en Netlify

### 1. Preparar el repositorio
```bash
# Asegúrate de que todos los cambios estén commitados
git add .
git commit -m "Configuración de seguridad y optimizaciones completadas"
git push origin main
```

### 2. Conectar a Netlify
1. Ve a [Netlify](https://netlify.com)
2. Haz clic en "New site from Git"
3. Conecta tu repositorio de GitHub
4. Configura las opciones de build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

### 3. Configurar variables de entorno en Netlify
En el dashboard de Netlify, ve a **Site settings** > **Environment variables** y agrega:

```
VITE_FIREBASE_API_KEY=AIzaSyDoNHSkX2Pk4WFx2ATM9ROwdlfwpPGJ280
VITE_FIREBASE_AUTH_DOMAIN=gestor-de-tareas-emooti.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gestor-de-tareas-emooti
VITE_FIREBASE_STORAGE_BUCKET=gestor-de-tareas-emooti.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=311826433745
VITE_FIREBASE_APP_ID=1:311826433745:web:385b55553db9809ca5a7f0
VITE_FIREBASE_MEASUREMENT_ID=G-WD2NMFBE2P
VITE_API_KEY=tu_gemini_api_key_aqui
SENDGRID_API_KEY=tu_sendgrid_api_key_aqui
```

### 4. Configurar Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** > **Rules**
4. Copia y pega el contenido de `firestore.rules`
5. Haz clic en "Publish"

### 5. Configurar Authentication
1. En Firebase Console, ve a **Authentication**
2. Habilita **Email/Password**
3. Agrega tu dominio de Netlify a los dominios autorizados

### 6. Verificar el despliegue
1. Netlify automáticamente hará deploy cuando hagas push
2. Verifica que la aplicación funcione correctamente
3. Prueba las funciones de autenticación y creación de tareas

## Despliegue en Vercel (Alternativa)

### 1. Conectar a Vercel
1. Ve a [Vercel](https://vercel.com)
2. Importa tu repositorio de GitHub
3. Vercel detectará automáticamente que es un proyecto Vite

### 2. Configurar variables de entorno
En el dashboard de Vercel, agrega las mismas variables de entorno que en Netlify.

### 3. Desplegar
Vercel hará deploy automáticamente en cada push.

## Verificación Post-Despliegue

### ✅ Checklist de verificación
- [ ] La aplicación carga correctamente
- [ ] El registro e inicio de sesión funcionan
- [ ] Se pueden crear proyectos
- [ ] Se pueden crear tareas
- [ ] Las funciones de IA funcionan (si configuraste la API key)
- [ ] Las invitaciones por email funcionan (si configuraste SendGrid)
- [ ] El tema claro/oscuro funciona
- [ ] La aplicación es responsive

### 🔧 Troubleshooting común

**Error: "Firebase not configured"**
- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de que los nombres de las variables coincidan exactamente

**Error: "CORS policy"**
- Verifica que tu dominio esté en la lista de dominios autorizados en Firebase
- Revisa la configuración CORS en las funciones de Netlify

**Error: "API key not found"**
- Verifica que hayas configurado la API key de Gemini AI
- Asegúrate de que la variable se llame `VITE_API_KEY`

## Monitoreo y Mantenimiento

### 1. Logs de producción
- Revisa los logs de Netlify Functions en el dashboard
- Monitorea los errores en Firebase Console

### 2. Actualizaciones
- Mantén las dependencias actualizadas
- Revisa regularmente las reglas de seguridad de Firebase

### 3. Backup
- Configura backups automáticos de Firestore
- Mantén copias de seguridad de las configuraciones importantes
