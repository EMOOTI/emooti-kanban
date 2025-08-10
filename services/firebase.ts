
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDoNHSkX2Pk4WFx2ATM9ROwdlfwpPGJ280",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gestor-de-tareas-emooti.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gestor-de-tareas-emooti",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gestor-de-tareas-emooti.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "311826433745",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:311826433745:web:385b55553db9809ca5a7f0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-WD2NMFBE2P"
};

// Validar configuración crítica
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Configuración de Firebase incompleta. Verifica las variables de entorno.');
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar los servicios que vamos a usar
export const db = getFirestore(app);
export const auth = getAuth(app);
