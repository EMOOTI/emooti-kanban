
import { User, Task } from '../types';

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('❌ Notificaciones push no soportadas en este navegador');
      return false;
    }

    try {
      // Registrar Service Worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registrado:', this.registration);

      // Solicitar permisos
      const permission = await this.requestPermission();
      if (permission === 'granted') {
        console.log('✅ Permisos de notificación concedidos');
        return true;
      } else {
        console.warn('❌ Permisos de notificación denegados');
        return false;
      }
    } catch (error) {
      console.error('❌ Error inicializando notificaciones:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) return 'denied';

    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration || !this.isSupported) {
      return null;
    }

    try {
      // Obtener suscripción existente
      let subscription = await this.registration.pushManager.getSubscription();

      if (!subscription) {
        // Crear nueva suscripción
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.warn('❌ VAPID_PUBLIC_KEY no configurada');
          return null;
        }

        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });

        console.log('✅ Suscripción push creada:', subscription);
      }

      return subscription;
    } catch (error) {
      console.error('❌ Error suscribiendo a push:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('✅ Suscripción push eliminada');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error desuscribiendo de push:', error);
      return false;
    }
  }

  async showNotification(data: NotificationData): Promise<void> {
    if (!this.registration || !this.isSupported) {
      return;
    }

    try {
      await this.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: data.badge || '/icon-72.png',
        tag: data.tag,
        data: data.data,
        actions: data.actions,
        requireInteraction: false,
        silent: false,
        vibrate: [100, 50, 100]
      });
    } catch (error) {
      console.error('❌ Error mostrando notificación:', error);
    }
  }

  async showTaskNotification(taskTitle: string, projectName: string, action: string): Promise<void> {
    const notificationData: NotificationData = {
      title: `Tarea: ${taskTitle}`,
      body: `${action} en proyecto ${projectName}`,
      tag: `task-${taskTitle}`,
      data: {
        type: 'task',
        action: action,
        projectName: projectName
      },
      actions: [
        {
          action: 'view',
          title: 'Ver tarea'
        },
        {
          action: 'dismiss',
          title: 'Cerrar'
        }
      ]
    };

    await this.showNotification(notificationData);
  }

  async showProjectNotification(projectName: string, action: string): Promise<void> {
    const notificationData: NotificationData = {
      title: `Proyecto: ${projectName}`,
      body: `${action}`,
      tag: `project-${projectName}`,
      data: {
        type: 'project',
        action: action,
        projectName: projectName
      }
    };

    await this.showNotification(notificationData);
  }

  async showReminderNotification(taskTitle: string, dueDate: string): Promise<void> {
    const notificationData: NotificationData = {
      title: '⏰ Recordatorio de Tarea',
      body: `La tarea "${taskTitle}" vence el ${dueDate}`,
      tag: `reminder-${taskTitle}`,
      data: {
        type: 'reminder',
        taskTitle: taskTitle,
        dueDate: dueDate
      },
      actions: [
        {
          action: 'view',
          title: 'Ver tarea'
        },
        {
          action: 'snooze',
          title: 'Posponer'
        }
      ]
    };

    await this.showNotification(notificationData);
  }

  // Convertir VAPID key de base64 a Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Verificar si las notificaciones están habilitadas
  isEnabled(): boolean {
    return this.isSupported && Notification.permission === 'granted';
  }

  // Obtener estado de permisos
  getPermissionState(): NotificationPermission {
    return Notification.permission;
  }
}

export const notificationService = new NotificationService();

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
