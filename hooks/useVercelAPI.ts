import { useState } from 'react';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface InvitationResponse {
  success: boolean;
  message?: string;
  email?: string;
  sendGridResponse?: {
    statusCode?: number;
    headers?: Record<string, string>;
  };
}

export const useNetlifyAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callAPI = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);

    try {
      // En desarrollo, usar la URL completa de Netlify
      const isDevelopment = import.meta.env.DEV;
      const baseUrl = isDevelopment 
        ? 'https://gestoremooti.netlify.app' 
        : '';
      
      const url = `${baseUrl}${endpoint}`;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Llamando a API:', url);
      }
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Respuesta recibida:', response.status, response.statusText);
      }

      // Verificar si la respuesta es JSON válido
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 Respuesta no JSON:', text);
        }
        throw new Error(`Respuesta no válida: ${text}`);
      }

      const data = await response.json();
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Datos recibidos:', data);
      }

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      if (process.env.NODE_ENV === 'development') {
        console.error('🔧 Error en API:', errorMessage);
      }
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Función de prueba
  const testFunction = () => callAPI<{ message: string }>('/.netlify/functions/test');

  // Enviar invitación
  const sendInvitation = async (email: string): Promise<ApiResponse<InvitationResponse>> => {
    return callAPI<InvitationResponse>('/.netlify/functions/send-invitation', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  };

  return {
    callAPI,
    testFunction,
    sendInvitation,
    loading,
    error,
  };
}; 