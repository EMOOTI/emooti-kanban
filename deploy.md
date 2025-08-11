# 🚀 Guía de Despliegue - Emooti en Netlify

## ✅ Estado Actual
- ✅ Aplicación compilada en `/dist`
- ✅ Funciones de Netlify configuradas
- ✅ Configuración de seguridad implementada
- ✅ Optimizaciones de rendimiento aplicadas

## 📋 Pasos para Desplegar

### 1. Subir a GitHub (si tienes Git configurado)

```bash
# Si Git está disponible:
git add .
git commit -m "Configuración completa para despliegue en Netlify"
git push origin main
```

### 2. Desplegar en Netlify

#### Opción A: Desde GitHub (Recomendado)
1. Ve a [Netlify](https://app.netlify.com)
2. Haz clic en **"New site from Git"**
3. Conecta tu repositorio de GitHub
4. Configura las opciones de build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
5. Haz clic en **"Deploy site"**

#### Opción B: Drag & Drop
1. Ve a [Netlify](https://app.netlify.com)
2. Arrastra la carpeta `dist` al área de deploy
3. Netlify detectará automáticamente que es un sitio estático

### 3. Configurar Variables de Entorno

**IMPORTANTE**: Después del primer deploy, configura las variables de entorno:

1. En tu proyecto de Netlify, ve a **Site settings** > **Environment variables**
2. Agrega las variables del archivo `netlify-env.md`
3. Haz clic en **Save**

### 4. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/project/gestor-de-tareas-emooti)
2. En **Authentication** > **Settings**, agrega tu dominio de Netlify a "Authorized domains"
3. En **Firestore Database** > **Rules**, aplica las reglas del archivo `firestore.rules`

### 5. Verificar el Despliegue

- [ ] La aplicación carga correctamente
- [ ] El registro e inicio de sesión funcionan
- [ ] Se pueden crear proyectos
- [ ] Se pueden crear tareas
- [ ] Las funciones de IA funcionan (si configuraste la API key)
- [ ] Las invitaciones por email funcionan (si configuraste SendGrid)

## 🔧 Troubleshooting

### Error: "Firebase not configured"
- Verifica que las variables de entorno estén configuradas
- Asegúrate de que los nombres coincidan exactamente

### Error: "CORS policy"
- Verifica que tu dominio esté en Firebase Authentication > Authorized domains
- Revisa la configuración CORS en `netlify.toml`

### Error: "Functions not found"
- Verifica que la carpeta `netlify/functions` esté en el repositorio
- Asegúrate de que las funciones tengan permisos de ejecución

## 📊 Monitoreo

### Logs de Netlify
- Ve a **Functions** en tu dashboard de Netlify
- Revisa los logs de las funciones para detectar errores

### Firebase Console
- Monitorea los errores en **Authentication** y **Firestore**
- Revisa las reglas de seguridad

## 🎯 URLs Importantes

- **Aplicación**: `https://tu-sitio.netlify.app`
- **Netlify Dashboard**: `https://app.netlify.com`
- **Firebase Console**: `https://console.firebase.google.com/project/gestor-de-tareas-emooti`

## 📝 Notas de Seguridad

- ✅ API keys protegidas en variables de entorno
- ✅ CORS configurado para dominios específicos
- ✅ Reglas de Firestore implementadas
- ✅ Headers de seguridad configurados
- ✅ Console.logs eliminados en producción
