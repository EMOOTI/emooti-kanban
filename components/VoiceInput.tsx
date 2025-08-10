import React, { useState, useEffect } from 'react';
import { MicrophoneIcon, StopIcon } from './icons';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

interface VoiceInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    type?: 'text' | 'textarea';
    rows?: number;
    label?: string;
    error?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
    value,
    onChange,
    placeholder,
    className = '',
    disabled = false,
    required = false,
    type = 'text',
    rows = 4,
    label,
    error
}) => {
    const [isListening, setIsListening] = useState(false);
    const [showError, setShowError] = useState(false);

    const {
        isListening: speechIsListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        isSupported,
        error: speechError
    } = useSpeechRecognition({
        onResult: (finalTranscript) => {
            console.log('VoiceInput - Resultado final:', finalTranscript);
            onChange(finalTranscript);
            setIsListening(false);
        },
        onError: (errorMessage) => {
            console.error('VoiceInput - Error:', errorMessage);
            setShowError(true);
            setTimeout(() => setShowError(false), 5000);
        }
    });

    useEffect(() => {
        if (speechIsListening) {
            setIsListening(true);
        } else {
            setIsListening(false);
        }
    }, [speechIsListening]);

    // Actualizar el valor del campo cuando hay transcript
    useEffect(() => {
        if (transcript && isListening) {
            console.log('VoiceInput - Actualizando con transcript:', transcript);
            onChange(transcript);
        }
    }, [transcript, isListening, onChange]);

    // Limpiar transcript cuando se detiene la grabación
    useEffect(() => {
        if (!isListening && transcript) {
            console.log('VoiceInput - Grabación detenida, transcript final:', transcript);
            onChange(transcript);
        }
    }, [isListening, transcript, onChange]);

    const handleVoiceToggle = () => {
        if (isListening) {
            stopListening();
            setIsListening(false);
        } else {
            startListening();
            setIsListening(true);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange(e.target.value);
    };

    const baseInputClasses = `
        w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
        bg-white dark:bg-gray-700 text-black dark:text-white
        ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `;

    return (
        <div className="relative">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            
            <div className="relative">
                {type === 'textarea' ? (
                    <textarea
                        value={value}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        className={`${baseInputClasses} ${className}`}
                        disabled={disabled}
                        required={required}
                        rows={rows}
                    />
                ) : (
                    <input
                        type="text"
                        value={value}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        className={`${baseInputClasses} ${className}`}
                        disabled={disabled}
                        required={required}
                    />
                )}
                
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
                                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300'
                            }
                            ${isListening ? 'animate-pulse' : ''}
                        `}
                        title={isListening ? 'Detener grabación' : 'Iniciar grabación de voz'}
                    >
                                            {isListening ? (
                        <div className="w-4 h-4">
                            <StopIcon />
                        </div>
                    ) : (
                        <div className="w-4 h-4">
                            <MicrophoneIcon />
                        </div>
                    )}
                    </button>
                )}
            </div>

            {/* Indicador de transcripción en tiempo real */}
            {isListening && transcript && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                        <span className="font-medium">Transcribiendo:</span> {transcript}
                    </p>
                </div>
            )}

            {/* Mensajes de error */}
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            
            {showError && speechError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{speechError}</p>
            )}

            {/* Indicador de estado del micrófono */}
            {isListening && (
                <div className="mt-2 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                        Escuchando... Habla ahora
                    </span>
                </div>
            )}
        </div>
    );
};

export default VoiceInput; 