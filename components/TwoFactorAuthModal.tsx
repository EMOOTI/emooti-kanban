import React, { useState, useEffect } from 'react';
import { XIcon, ShieldCheckIcon, QrCodeIcon, KeyIcon } from './icons';

interface TwoFactorAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: { email: string };
}

const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
    isOpen,
    onClose,
    currentUser
}) => {
    const [step, setStep] = useState<'setup' | 'verify' | 'success'>('setup');
    const [qrCode, setQrCode] = useState<string>('');
    const [secret, setSecret] = useState<string>('');
    const [otpauthUrl, setOtpauthUrl] = useState<string>('');
    const [verificationCode, setVerificationCode] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (isOpen && step === 'setup') {
            setup2FA();
        }
    }, [isOpen, step]);

    const setup2FA = async () => {
        setIsLoading(true);
        setError('');
        
        try {
            const response = await fetch(`/.netlify/functions/2fa-setup?email=${encodeURIComponent(currentUser.email)}`);
            const data = await response.json();
            
            if (data.success) {
                setQrCode(data.qrCode);
                setSecret(data.secret);
                setOtpauthUrl(data.otpauthUrl);
            } else {
                setError(data.error || 'Error configurando 2FA');
            }
        } catch (error) {
            console.error('Error setup 2FA:', error);
            setError('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    const verify2FA = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            setError('Ingresa un código de 6 dígitos');
            return;
        }

        setIsLoading(true);
        setError('');
        
        try {
            const response = await fetch('/.netlify/functions/2fa-verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: currentUser.email,
                    secret: secret,
                    code: verificationCode
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setStep('success');
            } else {
                setError(data.error || 'Código inválido');
            }
        } catch (error) {
            console.error('Error verificando 2FA:', error);
            setError('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setStep('setup');
        setVerificationCode('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70" onClick={handleClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-2xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <ShieldCheckIcon />
                        <h2 className="text-xl font-bold text-light-text dark:text-dark-text ml-2">
                            Autenticación de Dos Factores
                        </h2>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XIcon />
                    </button>
                </div>

                {step === 'setup' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
                                Escanea el código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.)
                            </p>
                            
                            {isLoading ? (
                                <div className="flex justify-center">
                                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                                </div>
                            ) : qrCode ? (
                                <div className="space-y-4">
                                    <div className="flex justify-center">
                                        <img src={qrCode} alt="QR Code para 2FA" className="border-2 border-gray-300 rounded-lg" />
                                    </div>
                                    
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                        <div className="flex items-center mb-2">
                                            <KeyIcon />
                                            <span className="ml-2 text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                                                Código manual (si no puedes escanear):
                                            </span>
                                        </div>
                                        <code className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded border break-all">
                                            {secret}
                                        </code>
                                    </div>
                                    
                                    <button
                                        onClick={() => setStep('verify')}
                                        className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                                    >
                                        Continuar
                                    </button>
                                </div>
                            ) : (
                                <div className="text-red-500">
                                    {error || 'Error cargando QR code'}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 'verify' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <QrCodeIcon className="mx-auto mb-4 text-4xl text-primary" />
                            <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
                                Verificar Código
                            </h3>
                            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
                                Ingresa el código de 6 dígitos de tu aplicación de autenticación
                            </p>
                            
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-light-text dark:text-dark-text focus:ring-2 focus:ring-primary focus:border-transparent"
                                    maxLength={6}
                                    autoFocus
                                />
                                
                                {error && (
                                    <div className="text-red-500 text-sm">
                                        {error}
                                    </div>
                                )}
                                
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setStep('setup')}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        onClick={verify2FA}
                                        disabled={isLoading || verificationCode.length !== 6}
                                        className="flex-1 bg-primary hover:bg-primary-hover disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                                    >
                                        {isLoading ? 'Verificando...' : 'Verificar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <ShieldCheckIcon className="text-green-600 dark:text-green-400 text-2xl" />
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
                                ¡2FA Activado!
                            </h3>
                            <p className="text-light-text-secondary dark:text-dark-text-secondary">
                                Tu cuenta ahora está protegida con autenticación de dos factores.
                            </p>
                        </div>
                        
                        <button
                            onClick={handleClose}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TwoFactorAuthModal;
