import React, { useState, useRef, useEffect, useCallback } from 'react';
import { XIcon } from './icons';

interface CameraModalProps {
    onClose: () => void;
    onCapture: (imageDataUrl: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        // Detener cualquier stream anterior
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("No se pudo acceder a la cámara. Asegúrate de haber otorgado los permisos necesarios en tu navegador.");
        }
    }, [stream]);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    useEffect(() => {
        startCamera();
        // El cleanup se asegura de que la cámara se apague cuando el componente se desmonte
        return () => {
            stopCamera();
        };
        // El array de dependencias está vacío para que se ejecute solo una vez al montar
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            // Ajustar el tamaño del canvas al del video para la captura
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                // Dibujar el frame actual del video en el canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                // Convertir el canvas a una URL de datos de imagen
                const imageDataUrl = canvas.toDataURL('image/jpeg');
                onCapture(imageDataUrl);
                // Se cierra el modal desde el componente padre
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-2xl w-full max-w-lg p-4 relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Tomar Foto</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XIcon />
                    </button>
                </div>
                <div className="bg-black rounded-md overflow-hidden aspect-video flex items-center justify-center">
                    {error ? (
                        <p className="text-red-500 p-4 text-center">{error}</p>
                    ) : (
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                    )}
                </div>
                 <canvas ref={canvasRef} className="hidden"></canvas>
                <div className="mt-4 flex justify-center">
                    <button 
                        onClick={handleCapture} 
                        disabled={!stream || !!error}
                        className="px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Capturar Foto
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CameraModal;