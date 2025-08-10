import React, { useState } from 'react';
import VoiceInput from './VoiceInput';

const VoiceTest: React.FC = () => {
    const [testValue, setTestValue] = useState('');

    return (
        <div className="p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Prueba de Transcripción de Voz</h2>
            <VoiceInput
                value={testValue}
                onChange={setTestValue}
                placeholder="Habla aquí..."
                label="Campo de prueba"
            />
            <div className="mt-4 p-4 bg-gray-100 rounded">
                <p className="text-sm text-gray-600">Valor actual: "{testValue}"</p>
            </div>
        </div>
    );
};

export default VoiceTest; 