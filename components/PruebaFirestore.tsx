import React from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase"; // Ajusta la ruta si tu archivo firebase.ts está en otra carpeta

export default function PruebaFirestore() {
  const crearDoc = async () => {
    console.log("🔵 El botón fue pulsado");
    try {
      console.log("CONFIG DE FIREBASE:", db.app.options);
      await setDoc(doc(db, "users", "prueba-manual"), {
        email: "test@ejemplo.com",
        nombre: "Prueba Manual",
        creadoEn: new Date(),
      });
      alert("✅ Documento de prueba creado en Firestore");
    } catch (e: any) {
      alert("🔥 Error creando documento manual: " + (e.message || e));
      console.error(e);
    }
  };

  return (
    <button
      style={{
        marginTop: 24,
        padding: 12,
        background: "#1976d2",
        color: "white",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
      }}
      onClick={crearDoc}
    >
      Probar creación manual en Firestore
    </button>
  );
}
