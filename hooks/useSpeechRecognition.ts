import { useState, useCallback, useEffect } from 'react';

interface UseSpeechRecognitionProps {
    onResult?: (transcript: string) => void;
    onError?: (error: string) => void;
    continuous?: boolean;
    interimResults?: boolean;
    lang?: string;
}

// Definir tipos para Speech Recognition
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onstart: () => void;
    onend: () => void;
}

// Extender Window para incluir las APIs de Speech Recognition
declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

interface UseSpeechRecognitionReturn {
    isListening: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    isSupported: boolean;
    error: string | null;
}

const useSpeechRecognition = ({
    onResult,
    onError,
    continuous = false,
    interimResults = true,
    lang = 'es-ES'
}: UseSpeechRecognitionProps = {}): UseSpeechRecognitionReturn => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

    // Verificar si el navegador soporta Speech Recognition
    const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

    useEffect(() => {
        if (!isSupported) {
            setError('La transcripción de voz no está soportada en este navegador');
            return;
        }

        // Crear instancia de Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();

        recognitionInstance.continuous = continuous;
        recognitionInstance.interimResults = interimResults;
        recognitionInstance.lang = lang;

        // Configurar eventos
        recognitionInstance.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognitionInstance.onend = () => {
            setIsListening(false);
            // No limpiar el transcript aquí para que se mantenga el resultado final
        };

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            // Actualizar el transcript con el resultado actual
            const currentTranscript = finalTranscript || interimTranscript;
            console.log('SpeechRecognition - Transcript actual:', currentTranscript);
            setTranscript(currentTranscript);
            
            // Si hay resultado final, llamar al callback
            if (finalTranscript && onResult) {
                console.log('SpeechRecognition - Resultado final:', finalTranscript);
                onResult(finalTranscript);
            }
        };

        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
            let errorMessage = 'Error en la transcripción de voz';
            
            switch (event.error) {
                case 'no-speech':
                    errorMessage = 'No se detectó voz. Por favor, habla más cerca del micrófono.';
                    break;
                case 'audio-capture':
                    errorMessage = 'No se puede acceder al micrófono. Verifica los permisos.';
                    break;
                case 'not-allowed':
                    errorMessage = 'Permiso denegado para acceder al micrófono.';
                    break;
                case 'network':
                    errorMessage = 'Error de red. Verifica tu conexión.';
                    break;
                case 'service-not-allowed':
                    errorMessage = 'Servicio de transcripción no disponible.';
                    break;
                default:
                    errorMessage = `Error: ${event.error}`;
            }

            setError(errorMessage);
            setIsListening(false);
            
            if (onError) {
                onError(errorMessage);
            }
        };

        setRecognition(recognitionInstance);

        // Cleanup
        return () => {
            if (recognitionInstance) {
                recognitionInstance.stop();
            }
        };
    }, [isSupported, continuous, interimResults, lang, onResult, onError]);

    const startListening = useCallback(() => {
        if (recognition && !isListening) {
            try {
                setTranscript(''); // Limpiar transcript al iniciar
                recognition.start();
            } catch (error) {
                setError('Error al iniciar la transcripción de voz');
            }
        }
    }, [recognition, isListening]);

    const stopListening = useCallback(() => {
        if (recognition && isListening) {
            recognition.stop();
        }
    }, [recognition, isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setError(null);
    }, []);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        isSupported,
        error
    };
};

export default useSpeechRecognition;
