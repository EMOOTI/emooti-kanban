// Test temporal para verificar la API key
console.log('API Key configurada:', process.env.REACT_APP_OPENAI_API_KEY ? 'SÍ' : 'NO');
console.log('Longitud de la API key:', process.env.REACT_APP_OPENAI_API_KEY?.length || 0); 