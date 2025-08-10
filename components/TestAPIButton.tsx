import React from 'react';
import { useNetlifyAPI } from '../hooks/useVercelAPI';

const TestAPIButton: React.FC = () => {
  const { testFunction, sendInvitation, loading, error } = useNetlifyAPI();

  const handleTest = async () => {
    try {
      const result = await testFunction();
      if (result.success) {
        alert('✅ API funcionando correctamente!\n' + JSON.stringify(result, null, 2));
      } else {
        alert('❌ Error en la API:\n' + result.error);
      }
    } catch (err) {
      alert('❌ Error al probar la API:\n' + err);
    }
  };

  const handleTestInvitation = async () => {
    try {
      // Usar un email real en lugar de test@example.com
      const testEmail = prompt('Ingresa tu email para recibir la invitación de prueba:') || 'test@example.com';
      const result = await sendInvitation(testEmail);
      if (result.success) {
        alert('✅ API de invitaciones funcionando correctamente!\n\nEmail enviado a: ' + testEmail + '\n\nRevisa tu bandeja de entrada y carpeta de spam.\n\n' + JSON.stringify(result, null, 2));
      } else {
        alert('❌ Error en la API de invitaciones:\n' + result.error);
      }
    } catch (err) {
      alert('❌ Error al probar la API de invitaciones:\n' + err);
    }
  };

  const handleTestEmail = async () => {
    try {
      const response = await fetch('https://gestoremooti.netlify.app/.netlify/functions/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.success) {
        alert('✅ Prueba de emails completada!\n' + JSON.stringify(result, null, 2));
      } else {
        alert('❌ Error en la prueba de emails:\n' + result.error);
      }
    } catch (err) {
      alert('❌ Error al probar emails:\n' + err);
    }
  };

  const handleSendGridDiagnostic = async () => {
    try {
      const response = await fetch('https://gestoremooti.netlify.app/.netlify/functions/sendgrid-diagnostic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.success) {
        alert('✅ Diagnóstico de SendGrid completado!\n' + JSON.stringify(result, null, 2));
      } else {
        alert('❌ Error en el diagnóstico:\n' + result.error);
      }
    } catch (err) {
      alert('❌ Error al ejecutar diagnóstico:\n' + err);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold">Pruebas de API</h3>
      
      <div className="space-y-2">
        <button
          onClick={handleTest}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Probando...' : 'Probar API'}
        </button>
        
        <button
          onClick={handleTestInvitation}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Probando...' : 'Probar API Invitaciones'}
        </button>
        
        <button
          onClick={handleTestEmail}
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? 'Probando...' : 'Probar Emails'}
        </button>
        
        <button
          onClick={handleSendGridDiagnostic}
          disabled={loading}
          className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? 'Diagnosticando...' : 'Diagnóstico SendGrid'}
        </button>
      </div>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default TestAPIButton; 