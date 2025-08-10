const sgMail = require('@sendgrid/mail');

exports.handler = async function(event, context) {
  // Configurar CORS de forma más segura
  const allowedOrigins = [
    'https://gestoremooti.netlify.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  const origin = event.headers.origin || event.headers.Origin;
  const isAllowedOrigin = allowedOrigins.includes(origin);
  
  const headers = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400', // 24 horas
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Función de diagnóstico de SendGrid iniciada');
    }
    
    // Verificar API key
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'SENDGRID_API_KEY no está configurada',
          success: false 
        })
      };
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 API Key encontrada:', apiKey.substring(0, 10) + '...');
    }
    sgMail.setApiKey(apiKey);

    // Información de diagnóstico
    const diagnostic = {
      apiKeyConfigured: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'No configurada',
      timestamp: new Date().toISOString()
    };

    // Probar diferentes configuraciones
    const testConfigs = [
      {
        name: 'Email verificado (desarrollo@emooti.com)',
        from: 'desarrollo@emooti.com',
        to: 'test@example.com',
        subject: 'Test - Email verificado'
      },
      {
        name: 'Email no verificado (test@emooti.com)',
        from: 'test@emooti.com',
        to: 'test@example.com',
        subject: 'Test - Email no verificado'
      },
      {
        name: 'Email genérico (noreply@emooti.com)',
        from: 'noreply@emooti.com',
        to: 'test@example.com',
        subject: 'Test - Email genérico'
      }
    ];

    const results = [];

    for (const config of testConfigs) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`📤 Probando: ${config.name}`);
      }
      
      const testMsg = {
        to: config.to,
        from: config.from,
        subject: config.subject,
        text: `Este es un email de prueba desde ${config.from}`,
        html: `<p>Este es un email de prueba desde <strong>${config.from}</strong></p>`
      };

      try {
        const result = await sgMail.send(testMsg);
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Éxito con ${config.name}:`, result);
        }
        results.push({
          config: config.name,
          success: true,
          result: result,
          statusCode: result[0]?.statusCode
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ Error con ${config.name}:`, error.message);
        }
        results.push({
          config: config.name,
          success: false,
          error: error.message,
          errorCode: error.code
        });
      }
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Diagnóstico de SendGrid completado',
        diagnostic: diagnostic,
        results: results,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error general:', error);
    }
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Error general: ' + error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
}; 