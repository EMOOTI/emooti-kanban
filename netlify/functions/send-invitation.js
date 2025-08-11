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

  // Manejar preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    // Solo log en desarrollo
    if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Función send-invitation iniciada');
    console.log('Event body:', event.body);
    }
    
    const { email } = JSON.parse(event.body);

    if (!email) {
      if (process.env.NODE_ENV === 'development') {
      console.log('❌ Email no proporcionado');
      }
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Email requerido' })
      };
    }

    if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email a enviar:', email);
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      if (process.env.NODE_ENV === 'development') {
      console.log('❌ Formato de email inválido:', email);
      }
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Formato de email inválido' })
      };
    }

    // Verificar si la API key está configurada
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'SENDGRID_API_KEY no está configurada',
          success: false 
        })
      };
    }

    if (process.env.NODE_ENV === 'development') {
    console.log('🔑 API Key configurada:', apiKey.substring(0, 10) + '...');
    }
    sgMail.setApiKey(apiKey);

    // Email remitente verificado
    const fromEmail = 'desarrollo@emooti.com';
    if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email remitente verificado:', fromEmail);
    }

    // Crear el mensaje
    const msg = {
      to: email,
      from: fromEmail,
      subject: 'Invitación a Emooti - Gestor de Tareas',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">¡Bienvenido a Emooti!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Tu gestor de tareas inteligente</p>
            </div>
            
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin-top: 0;">¡Has sido invitado!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Has recibido una invitación para unirte a nuestro equipo en Emooti, 
              una plataforma moderna para la gestión de tareas y proyectos.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #333; margin-top: 0;">Características principales:</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>🎯 Gestión visual de tareas con tableros Kanban</li>
                <li>🤖 Generación automática de tareas con IA</li>
                <li>👥 Colaboración en tiempo real</li>
                <li>📊 Dashboard con análisis y reportes</li>
                <li>📱 Diseño responsive para todos los dispositivos</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
            <a href="https://gestoremooti.netlify.app" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                🚀 Acceder a Emooti
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
              Si tienes alguna pregunta, no dudes en contactarnos.
              </p>
            </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© 2024 Emooti. Todos los derechos reservados.</p>
          </div>
        </div>
      `,
      text: `
        ¡Bienvenido a Emooti!
        
        Has recibido una invitación para unirte a nuestro equipo en Emooti, 
        una plataforma moderna para la gestión de tareas y proyectos.
        
        Características principales:
        - Gestión visual de tareas con tableros Kanban
        - Generación automática de tareas con IA
        - Colaboración en tiempo real
        - Dashboard con análisis y reportes
        - Diseño responsive para todos los dispositivos
        
        Accede a Emooti: https://gestoremooti.netlify.app
        
        Si tienes alguna pregunta, no dudes en contactarnos.
        
        © 2024 Emooti. Todos los derechos reservados.
      `
    };

    if (process.env.NODE_ENV === 'development') {
    console.log('📤 Enviando email a:', email);
    console.log('📤 Desde:', fromEmail);
    console.log('📤 Asunto:', msg.subject);
    console.log('📤 Contenido HTML:', msg.html.substring(0, 100) + '...');
    }
    
      const result = await sgMail.send(msg);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Email enviado exitosamente:', result);
      console.log('📊 Respuesta de SendGrid:', JSON.stringify(result, null, 2));
      console.log('📊 Status code de SendGrid:', result[0]?.statusCode);
      console.log('📊 Headers de SendGrid:', result[0]?.headers);
    }

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
        message: 'Invitación enviada exitosamente',
        email: email,
        sendGridResponse: {
          statusCode: result[0]?.statusCode,
          headers: result[0]?.headers
        }
      })
    };

    } catch (sendError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error específico de SendGrid:', sendError);
      console.error('❌ Error message:', sendError.message);
      console.error('❌ Error code:', sendError.code);
      console.error('❌ Error response:', sendError.response);
    }
      
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Error al enviar la invitación: ' + sendError.message,
        details: process.env.NODE_ENV === 'development' ? sendError.stack : undefined,
        sendGridError: process.env.NODE_ENV === 'development' ? {
            message: sendError.message,
            code: sendError.code,
            response: sendError.response
        } : undefined
        })
      };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error completo:', error);
    console.error('❌ Stack trace:', error.stack);
    }
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Error al enviar la invitación: ' + error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
}; 