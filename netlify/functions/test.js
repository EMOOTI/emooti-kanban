const sgMail = require('@sendgrid/mail');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('🔧 Función test iniciada');
    
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

    console.log('🔑 API Key encontrada:', apiKey.substring(0, 10) + '...');
    sgMail.setApiKey(apiKey);

    // Probar con diferentes emails remitentes
    const testEmails = [
      'desarrollo@emooti.com',
      'noreply@emooti.com',
      'test@emooti.com'
    ];

    const results = [];

    for (const fromEmail of testEmails) {
      console.log(`📤 Probando con email remitente: ${fromEmail}`);
      
      const testMsg = {
        to: 'test@example.com', // Email de prueba
        from: fromEmail,
        subject: 'Test Email - ' + fromEmail,
        text: 'Este es un email de prueba desde ' + fromEmail,
        html: '<p>Este es un email de prueba desde <strong>' + fromEmail + '</strong></p>'
      };

      try {
        const result = await sgMail.send(testMsg);
        console.log(`✅ Email enviado exitosamente con ${fromEmail}:`, result);
        results.push({
          fromEmail,
          success: true,
          result: result
        });
      } catch (error) {
        console.error(`❌ Error con ${fromEmail}:`, error.message);
        results.push({
          fromEmail,
          success: false,
          error: error.message
        });
      }
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Prueba de emails completada',
        results: results,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Error general:', error);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Error general: ' + error.message,
        details: error.stack
      })
    };
  }
}; 