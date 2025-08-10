import sgMail from '@sendgrid/mail';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // Configurar SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: email,
      from: 'gestion@emooti.com',
      subject: 'Ha sido invitado a participar en los proyectos EMOOTI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #3B82F6; margin-bottom: 20px;">¡Bienvenido a EMOOTI!</h1>
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Has sido invitado a participar en los proyectos EMOOTI.
            </p>
            <p style="font-size: 14px; color: #6B7280; margin-bottom: 30px;">
              Únete a nuestro equipo y comienza a colaborar en proyectos increíbles.
            </p>
            <a href="https://tu-dominio.com/registro" 
               style="background-color: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Crear mi cuenta
            </a>
            <p style="font-size: 12px; color: #9CA3AF; margin-top: 30px;">
              Si no esperabas este email, puedes ignorarlo de forma segura.
            </p>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);

    res.status(200).json({
      success: true,
      message: 'Invitación enviada correctamente'
    });
  } catch (error) {
    console.error('Error enviando invitación:', error);
    res.status(500).json({
      error: 'Error al enviar la invitación. Por favor, inténtalo de nuevo.'
    });
  }
} 