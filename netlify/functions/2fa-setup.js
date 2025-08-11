const otplib = require('otplib');
const QRCode = require('qrcode');

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
    // Solo permitir GET
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Método no permitido' })
      };
    }

    // Obtener email del usuario desde query params
    const { email } = event.queryStringParameters || {};
    
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email es requerido' })
      };
    }

    // Generar secreto único para el usuario
    const secret = otplib.authenticator.generateSecret();
    
    // Crear URL para QR code
    const otpauthUrl = otplib.authenticator.keyuri(
      email, 
      'Emooti', 
      secret
    );

    // Generar QR code como data URL
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Configurando 2FA para:', email);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        secret: secret,
        qrCode: qrDataUrl,
        otpauthUrl: otpauthUrl
      })
    };

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error configurando 2FA:', error);
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error configurando 2FA',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      })
    };
  }
};
