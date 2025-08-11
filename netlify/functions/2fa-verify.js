const otplib = require('otplib');

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

    const { email, secret, code } = JSON.parse(event.body || '{}');

    if (!email || !secret || !code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'email, secret y code son requeridos' })
      };
    }

    // Verificar el código TOTP
    const isValid = otplib.authenticator.verify({
      token: code,
      secret: secret
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Verificando 2FA para:', email, 'Código válido:', isValid);
    }

    if (isValid) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: '2FA activado correctamente'
        })
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Código inválido'
        })
      };
    }

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error verificando 2FA:', error);
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error verificando 2FA',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      })
    };
  }
};
