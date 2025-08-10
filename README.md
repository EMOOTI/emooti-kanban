# Emooti - Gestor de Tareas Inteligente

Un gestor de tareas moderno y colaborativo con integración de IA para la gestión eficiente de proyectos.

## 🚀 Características

- **Gestión Visual de Tareas**: Tableros Kanban intuitivos y personalizables
- **IA Integrada**: Generación automática de tareas y sugerencias inteligentes
- **Colaboración en Tiempo Real**: Trabajo en equipo con sincronización instantánea
- **Dashboard Analítico**: Reportes y métricas de productividad
- **Diseño Responsive**: Funciona perfectamente en desktop, tablet y móvil
- **Temas Claro/Oscuro**: Interfaz adaptable a tus preferencias
- **Accesibilidad**: Cumple con estándares WCAG para usuarios con discapacidades

## 📋 Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Firebase
- API Key de Google Gemini AI
- API Key de SendGrid (opcional, para invitaciones por email)

## 🔧 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd kanbangoogle
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Copia el archivo de ejemplo:
   ```bash
   cp env.example .env
   ```
   
   Edita `.env` con tus credenciales:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=tu_api_key_de_firebase
   VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu_project_id
   VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
   VITE_FIREBASE_APP_ID=tu_app_id
   VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id

   # Gemini AI API Key
   VITE_API_KEY=tu_gemini_api_key

   # SendGrid API Key (opcional)
   SENDGRID_API_KEY=tu_sendgrid_api_key
   ```

4. **Configurar Firebase**
   
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilita Authentication y Firestore
   - Configura las reglas de seguridad de Firestore
   - Obtén las credenciales de configuración

5. **Configurar Gemini AI**
   
   - Obtén tu API key en [Google AI Studio](https://makersuite.google.com/app/apikey)

6. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## 🚀 Despliegue

### Netlify (Recomendado)

1. **Conectar repositorio a Netlify**
2. **Configurar variables de entorno en Netlify Dashboard**
3. **Configurar build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

### Vercel

1. **Conectar repositorio a Vercel**
2. **Configurar variables de entorno**
3. **Deploy automático**

## 🔒 Seguridad

### Variables de Entorno
- **NUNCA** commits credenciales en el código
- Usa variables de entorno para todas las API keys
- El archivo `.env` está en `.gitignore`

### Firebase Security Rules
```javascript
// Ejemplo de reglas de seguridad básicas
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios solo pueden leer/escribir sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Proyectos solo para miembros
    match /projects/{projectId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.members;
    }
    
    // Tareas solo para miembros del proyecto
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.members;
    }
  }
}
```

### CORS
- Configurado para dominios específicos
- No permite acceso desde cualquier origen

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run preview      # Vista previa de la build

# Linting y formateo
npm run lint         # Ejecuta ESLint
npm run format       # Formatea código con Prettier
```

## 📁 Estructura del Proyecto

```
kanbangoogle/
├── components/          # Componentes React
├── hooks/              # Custom hooks
├── services/           # Servicios (Firebase, AI, etc.)
├── types/              # Definiciones de TypeScript
├── netlify/functions/  # Funciones serverless
├── public/             # Archivos estáticos
└── dist/               # Build de producción
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si encuentras algún problema o tienes preguntas:

1. Revisa la documentación
2. Busca en los issues existentes
3. Crea un nuevo issue con detalles del problema

## 🔄 Changelog

### v1.4.0
- ✅ Mejoras de seguridad implementadas
- ✅ Optimización de rendimiento
- ✅ Mejoras de accesibilidad
- ✅ Corrección de tipos TypeScript
- ✅ Limpieza de console.logs en producción
