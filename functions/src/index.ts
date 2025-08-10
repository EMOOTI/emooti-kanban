/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sgMail = require("@sendgrid/mail");
import * as functions from "firebase-functions";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

// Inicializar Firebase Admin
admin.initializeApp();

// Configurar SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY ||
  functions.config().sendgrid?.key;
// Cambia por tu email verificado en SendGrid
const FROM_EMAIL = "gestion@emooti.com";

// Configurar SendGrid solo si tenemos la API Key
if (SENDGRID_API_KEY && sgMail && typeof sgMail.setApiKey === "function") {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log("SendGrid configurado correctamente");
} else {
  console.warn(
    "SENDGRID_API_KEY no está configurada o SendGrid no está disponible",
  );
}

// Función de prueba simple
export const testFunction = onCall(async () => {
  return {
    success: true,
    message: "Función de prueba funcionando correctamente",
  };
});

// Función completamente nueva
export const helloWorld = onCall(async () => {
  return {
    message: "Hello World!",
    timestamp: new Date().toISOString(),
  };
});

// Función extremadamente simple
export const simpleTest = onCall(async () => {
  return "OK";
});

// Función para enviar invitaciones por email
export const sendInvitationV2 = onCall({
  cors: true,
}, async (request) => {
  try {
    const {email} = request.data;

    if (!email) {
      throw new Error("Email requerido");
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Formato de email inválido");
    }

    // Crear el mensaje
    const msg = {
      to: email,
      from: FROM_EMAIL,
      subject: "Ha sido invitado a participar en los proyectos EMOOTI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; 
             margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; 
               border-radius: 10px; text-align: center;">
            <h1 style="color: #3B82F6; margin-bottom: 20px;">
              ¡Bienvenido a EMOOTI!
            </h1>
            
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Has sido invitado a participar en los proyectos EMOOTI.
            </p>
            
            <p style="font-size: 14px; color: #6B7280; margin-bottom: 30px;">
              Únete a nuestro equipo y comienza a colaborar en 
              proyectos increíbles.
            </p>
            
            <a href="https://tu-dominio.com/registro" 
               style="background-color: #3B82F6; color: white; 
                      padding: 12px 30px; text-decoration: none; 
                      border-radius: 5px; font-weight: bold; 
                      display: inline-block;">
              Crear mi cuenta
            </a>
            
            <p style="font-size: 12px; color: #9CA3AF; margin-top: 30px;">
              Si no esperabas este email, puedes ignorarlo de forma segura.
            </p>
          </div>
        </div>
      `,
      text: `
        ¡Bienvenido a EMOOTI!
        
        Has sido invitado a participar en los proyectos EMOOTI.
        Únete a nuestro equipo y comienza a colaborar en proyectos increíbles.
        
        Crear mi cuenta: https://tu-dominio.com/registro
        
        Si no esperabas este email, puedes ignorarlo de forma segura.
      `,
    };

    // Enviar el email
    await sgMail.send(msg);

    logger.info(`Invitación enviada exitosamente a: ${email}`);

    return {
      success: true,
      message: "Invitación enviada correctamente",
    };
  } catch (error) {
    logger.error("Error enviando invitación:", error);
    throw new Error(
      "Error al enviar la invitación. Por favor, inténtalo de nuevo.",
    );
  }
});

// Función de prueba extremadamente simple
export const ultraSimpleTest = onCall(async () => {
  return "OK";
});

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
