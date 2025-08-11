# 🔥 Configurar Firebase para Emooti en Netlify

## ✅ **Después del despliegue exitoso en Netlify**

### **1. Obtener la URL de tu sitio**
Tu sitio está disponible en: `https://TU-URL.netlify.app`

## **2. Configurar Firebase Authentication**

### **Paso 1: Ir a Firebase Console**
1. Ve a: https://console.firebase.google.com/project/gestor-de-tareas-emooti
2. En el menú lateral, haz clic en **"Authentication"**

### **Paso 2: Configurar dominios autorizados**
1. Haz clic en la pestaña **"Settings"**
2. Baja hasta la sección **"Authorized domains"**
3. Haz clic en **"Add domain"**
4. Agrega tu dominio de Netlify: `TU-URL.netlify.app`
5. Haz clic en **"Add"**

### **Paso 3: Verificar métodos de autenticación**
1. En la pestaña **"Sign-in method"**
2. Asegúrate de que **"Email/Password"** esté habilitado
3. Si no está habilitado, haz clic en **"Email/Password"** y luego **"Enable"**

## **3. Configurar Firestore Database**

### **Paso 1: Ir a Firestore**
1. En el menú lateral, haz clic en **"Firestore Database"**
2. Si no existe la base de datos, haz clic en **"Create database"**

### **Paso 2: Aplicar reglas de seguridad**
1. Haz clic en la pestaña **"Rules"**
2. Reemplaza todo el contenido con las reglas del archivo `firestore.rules`
3. Haz clic en **"Publish"**

## **4. Probar la aplicación**

### **Paso 1: Abrir tu sitio**
1. Ve a tu URL de Netlify: `https://TU-URL.netlify.app`
2. Deberías ver la página de login de Emooti

### **Paso 2: Probar registro de usuarios**
1. Haz clic en **"Crear cuenta"**
2. Completa el formulario con:
   - Email: `test@emooti.com`
   - Contraseña: `123456`
3. Haz clic en **"Crear cuenta"**

### **Paso 3: Probar inicio de sesión**
1. Si el registro fue exitoso, deberías estar logueado
2. Si no, usa las credenciales que acabas de crear

## **5. Verificar que todo funcione**

### **Funciones a probar:**
- ✅ Registro de usuarios
- ✅ Inicio de sesión
- ✅ Crear proyectos
- ✅ Crear tareas
- ✅ Mover tareas entre columnas
- ✅ Invitar usuarios (si configuraste SendGrid)

## **6. Troubleshooting**

### **Error: "Firebase not configured"**
- Verifica que las variables de entorno estén configuradas en Netlify
- Asegúrate de que los nombres coincidan exactamente

### **Error: "CORS policy"**
- Verifica que tu dominio esté en Firebase Authentication > Authorized domains
- Revisa la configuración CORS en `netlify.toml`

### **Error: "Permission denied"**
- Verifica que las reglas de Firestore estén aplicadas correctamente
- Asegúrate de que el usuario esté autenticado

## **🎉 ¡Tu aplicación Emooti está lista!**

Una vez que hayas completado estos pasos, tu aplicación estará completamente funcional en producción.

**URL de tu aplicación**: `https://TU-URL.netlify.app`
**Firebase Console**: https://console.firebase.google.com/project/gestor-de-tareas-emooti

