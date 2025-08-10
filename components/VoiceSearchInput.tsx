import React, { useState, useEffect } from 'react';
import { MicrophoneIcon, StopIcon } from './icons';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

interface VoiceSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

const VoiceSearchInput: React.FC<VoiceSearchInputProps> = ({
    value,
    onChange,
    placeholder,
    className = '',
    disabled = false
}) => {
    const [isListening, setIsListening] = useState(false);

    const {
        isListening: speechIsListening,
        transcript,
        startListening,
        stopListening,
        isSupported,
        error: speechError
    } = useSpeechRecognition({
        onResult: (finalTranscript) => {
            console.log('VoiceSearchInput - Resultado final:', finalTranscript);
            onChange(finalTranscript);
            setIsListening(false);
        },
        onError: (errorMessage) => {
            console.error('VoiceSearchInput - Error:', errorMessage);
            setIsListening(false);
        }
    });

    React.useEffect(() => {
        if (speechIsListening) {
            setIsListening(true);
        } else {
            setIsListening(false);
        }
    }, [speechIsListening]);

    // Actualizar el valor del campo cuando hay transcript
    React.useEffect(() => {
        if (transcript && isListening) {
            console.log('VoiceSearchInput - Actualizando con transcript:', transcript);
            onChange(transcript);
        }
    }, [transcript, isListening, onChange]);

    const handleVoiceToggle = () => {
        if (isListening) {
            stopListening();
            setIsListening(false);
        } else {
            startListening();
            setIsListening(true);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div className="relative">
            <input
                type="text"
                value={value}
                onChange={handleInputChange}
                placeholder={placeholder}
                className={`${className} pr-10`}
                disabled={disabled}
            />
            
            {/* Botón de micrófono */}
            {isSupported && !disabled && (
                <button
                    type="button"
                    onClick={handleVoiceToggle}
                    className={`
                        absolute right-2 top-1/2 transform -translate-y-1/2
                        p-2 rounded-full transition-all duration-200
                        ${isListening 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                        }
                        ${isListening ? 'animate-pulse' : ''}
                    `}
                    title={isListening ? 'Detener búsqueda por voz' : 'Buscar por voz'}
                >
                    {isListening ? (
                        <div className="w-5 h-5 flex items-center justify-center">
                            <StopIcon />
                        </div>
                    ) : (
                        <div className="w-5 h-5 flex items-center justify-center">
                            <MicrophoneIcon />
                        </div>
                    )}
                </button>
            )}

            {/* Indicador de transcripción en tiempo real */}
            {isListening && transcript && (
                <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md z-10">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                        <span className="font-medium">Buscando:</span> {transcript}
                    </p>
                </div>
            )}
        </div>
    );
};

export default VoiceSearchInput; 