const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la petición');
      }

      return data;
    } catch (error) {
      console.error('Error en API request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  // Función de prueba
  static async testFunction(): Promise<ApiResponse> {
    return this.request('/api/test');
  }

  // Enviar invitación
  static async sendInvitation(email: string): Promise<ApiResponse> {
    return this.request('/api/send-invitation', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }
} 