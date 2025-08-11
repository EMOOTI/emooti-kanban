const webpush = require('web-push');

exports.handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': 'https://gestoremooti.netlify.app,http://localhost:3000,http://localhost:5173',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  // Manejar preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Solo permitir POST
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Método no permitido' })
      };
    }

    const { subscription, notification } = JSON.parse(event.body || '{}');

    if (!subscription || !notification) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'subscription y notification son requeridos' })
      };
    }

    // Configurar VAPID
    const vapidKeys = {
      publicKey: process.env.VITE_VAPID_PUBLIC_KEY,
      privateKey: process.env.VITE_VAPID_PRIVATE_KEY
    };

    if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'VAPID keys no configuradas' })
      };
    }

    webpush.setVapidDetails(
      'mailto:info@emooti.com',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    // Enviar notificación
    const payload = JSON.stringify(notification);
    const result = await webpush.sendNotification(subscription, payload);

    if (process.env.NODE_ENV === 'development') {
      console.log('📱 Notificación push enviada:', { notification, result });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Notificación enviada correctamente'
      })
    };

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error enviando notificación push:', error);
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error enviando notificación',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      })
    };
  }
};
