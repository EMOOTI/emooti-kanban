
import { User, Task } from '../types';

/**
 * Simula el envío de un correo electrónico de notificación de asignación de tarea.
 * En una aplicación real, esto se conectaría a un servicio de correo electrónico (p. ej., SendGrid, Mailgun).
 * @param user El usuario al que se le notifica.
 * @param task La tarea que ha sido asignada.
 * @param projectName El nombre del proyecto al que pertenece la tarea.
 */
export const sendTaskAssignmentEmail = (user: User, task: Task, projectName: string): void => {
    const projectUrl = window.location.origin;
    const taskUrl = `${projectUrl}/projects/${task.projectId}/tasks/${task.id}`; // URL hipotética
    const userTasksUrl = `${projectUrl}/my-tasks`; // URL hipotética

    const emailBody = `
        Hola ${user.firstName},

        Has sido asignado a una nueva tarea en el proyecto "${projectName}".

        Tarea: "${task.title}"
        Fecha de vencimiento: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES') : 'No especificada'}
        Prioridad: ${task.priority}

        Puedes ver los detalles de la tarea aquí:
        ${taskUrl}

        O ver todas tus tareas asignadas aquí:
        ${userTasksUrl}

        Saludos,
        El equipo de Flujo Kanban
    `;

    console.log(`
        =====================================================
        |  SIMULACIÓN DE NOTIFICACIÓN POR CORREO ELECTRÓNICO  |
        =====================================================
        Destinatario: ${user.email}
        Asunto: Se te ha asignado la tarea: "${task.title}"
        -----------------------------------------------------
        Cuerpo del correo:
        ${emailBody.trim()}
        -----------------------------------------------------
    `);
};

/**
 * Simula el envío de un correo electrónico de restablecimiento de contraseña.
 * @param user El usuario que solicita el restablecimiento.
 * @param tempPassword La contraseña temporal generada.
 */
export const sendPasswordResetEmail = (user: User, tempPassword: string): void => {
    const emailBody = `
        Hola ${user.firstName},

        Recibimos una solicitud para restablecer tu contraseña.

        Tu contraseña temporal es: ${tempPassword}

        Inicia sesión con esta contraseña. Se te pedirá que establezcas una nueva contraseña permanente por tu seguridad.
        Si no solicitaste esto, puedes ignorar este correo electrónico de forma segura.

        Saludos,
        El equipo de Flujo Kanban
    `;

    console.log(`
        ========================================================
        |  SIMULACIÓN DE CORREO DE RECUPERACIÓN DE CONTRASEÑA  |
        ========================================================
        Destinatario: ${user.email}
        Asunto: Tu contraseña temporal de Flujo Kanban
        --------------------------------------------------------
        Cuerpo del correo:
        ${emailBody.trim()}
        --------------------------------------------------------
    `);
};

/**
 * Simula el envío de un correo electrónico cuando un usuario es añadido a un proyecto EMOOTI.
 * @param user El usuario añadido.
 * @param projectName El nombre del proyecto (por defecto EMOOTI).
 */
export const sendUserAddedToProjectEmail = (user: User, projectName: string = 'EMOOTI'): void => {
    const projectUrl = window.location.origin;
    const emailBody = `
        Hola ${user.firstName},

        Has sido añadido al proyecto "${projectName}" en la plataforma EMOOTI.

        Ahora puedes acceder y colaborar en el proyecto.

        Accede aquí: ${projectUrl}

        Saludos,
        El equipo de EMOOTI
    `;

    console.log(`
        =====================================================
        |  SIMULACIÓN DE NOTIFICACIÓN POR CORREO ELECTRÓNICO  |
        =====================================================
        Destinatario: ${user.email}
        Asunto: Has sido añadido al proyecto ${projectName}
        -----------------------------------------------------
        Cuerpo del correo:
        ${emailBody.trim()}
        -----------------------------------------------------
    `);
};
