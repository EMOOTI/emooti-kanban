import React, { useState } from 'react';
import { XIcon, ShieldCheckIcon } from './icons';

interface CaptchaModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const CaptchaModal: React.FC<CaptchaModalProps> = ({ onClose, onSuccess }) => {
    const [isChecked, setIsChecked] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerify = () => {
        setIsVerifying(true);
        // Simular una pequeña demora de red
        setTimeout(() => {
            onSuccess();
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-2xl w-full max-w-sm m-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-light-border dark:border-dark-border">
                    <h3 className="font-bold">Verificación de seguridad</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XIcon />
                    </button>
                </div>
                <div className="p-6 text-center">
                    <ShieldCheckIcon />
                    <p className="my-4">Por favor, confirma que no eres un robot para continuar.</p>
                    <div className="flex items-center justify-center p-3 my-4 bg-gray-100 dark:bg-gray-800 rounded-md border border-light-border dark:border-dark-border">
                        <input
                            id="captcha-checkbox"
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => setIsChecked(!isChecked)}
                            className="h-6 w-6 rounded text-primary focus:ring-primary"
                        />
                        <label htmlFor="captcha-checkbox" className="ml-3 font-medium">No soy un robot</label>
                    </div>
                    <button
                        onClick={handleVerify}
                        disabled={!isChecked || isVerifying}
                        className="w-full px-4 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition-colors duration-200 disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isVerifying ? 'Verificando...' : 'Verificar y Continuar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CaptchaModal;
