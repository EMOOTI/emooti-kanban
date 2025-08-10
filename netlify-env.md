# 🔧 Variables de Entorno para Netlify

## Configuración en Netlify Dashboard

Ve a tu proyecto en Netlify Dashboard > Site settings > Environment variables y agrega las siguientes variables:

### Firebase Configuration
```
VITE_FIREBASE_API_KEY=AIzaSyDoNHSkX2Pk4WFx2ATM9ROwdlfwpPGJ280
VITE_FIREBASE_AUTH_DOMAIN=gestor-de-tareas-emooti.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gestor-de-tareas-emooti
VITE_FIREBASE_STORAGE_BUCKET=gestor-de-tareas-emooti.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=311826433745
VITE_FIREBASE_APP_ID=1:311826433745:web:385b55553db9809ca5a7f0
VITE_FIREBASE_MEASUREMENT_ID=G-WD2NMFBE2P
```

### Gemini AI API Key (Opcional)
```
VITE_API_KEY=tu_gemini_api_key_aqui
```

### SendGrid API Key (Opcional)
```
SENDGRID_API_KEY=tu_sendgrid_api_key_aqui
```

### Configuración de Entorno
```
NODE_ENV=production
```

## Pasos para configurar:

1. Ve a https://app.netlify.com
2. Selecciona tu proyecto
3. Ve a **Site settings** > **Environment variables**
4. Haz clic en **Add variable**
5. Agrega cada variable una por una
6. Haz clic en **Save**

## Notas importantes:

- Las variables que empiezan con `VITE_` estarán disponibles en el frontend
- Las variables sin `VITE_` solo estarán disponibles en las funciones de Netlify
- Después de agregar las variables, Netlify hará un nuevo deploy automáticamente
