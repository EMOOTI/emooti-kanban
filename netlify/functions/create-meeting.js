const sgMail = require('@sendgrid/mail');

exports.handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': 'https://gestoremooti.netlify.app,http://localhost:3000,http://localhost:5173',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    const { taskId, taskTitle, projectName } = JSON.parse(event.body || '{}');

    if (!taskId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'taskId es requerido' })
      };
    }

    // Generar URL de Jitsi
    const meetingId = `Emooti_${taskId}_${Date.now()}`;
    const meetingUrl = `https://meet.jit.si/${meetingId}`;
    
    // Crear título descriptivo para la reunión
    const meetingTitle = taskTitle ? `${taskTitle} - ${projectName || 'Emooti'}` : `Reunión Emooti - ${projectName || 'Proyecto'}`;

    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 Creando reunión:', { taskId, meetingId, meetingUrl, meetingTitle });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        meetingUrl,
        meetingId,
        meetingTitle,
        provider: 'jitsi'
      })
    };

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error creando reunión:', error);
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      })
    };
  }
};
