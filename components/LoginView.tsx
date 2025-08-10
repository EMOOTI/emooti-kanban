
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, AuthError } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { useTheme } from '../hooks/useTheme';
import { UserRole } from '../types';
import PruebaFirestore from "./PruebaFirestore"; // Ajusta la ruta si tu LoginView está en otra carpeta
import { EyeIcon, EyeOffIcon } from './icons';
import FirebaseTest from './FirebaseTest';

interface AuthErrorInfo {
  code: string;
  message: string;
}

const LoginView: React.FC = () => {
    const { theme } = useTheme();
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showFirebaseTest, setShowFirebaseTest] = useState(false);

    const handleAuthError = (err: AuthError | Error): void => {
        setIsLoading(false);
        
        // Determinar si es un error de Firebase Auth
        const authError = err as AuthError;
        const errorCode = authError.code || 'unknown';
        
        // Log detallado del error para debugging
        if (process.env.NODE_ENV === 'development') {
            console.error('🔍 Error de autenticación detallado:', {
                code: errorCode,
                message: authError.message,
                fullError: authError
            });
        }
        
        switch (errorCode) {
            case 'auth/user-not-found':
                setError('No se encontró ningún usuario con este correo electrónico.');
                break;
            case 'auth/wrong-password':
                setError('La contraseña es incorrecta.');
                break;
            case 'auth/email-already-in-use':
                setError('Este correo electrónico ya está en uso.');
                break;
            case 'auth/weak-password':
                setError('La contraseña debe tener al menos 6 caracteres.');
                break;
            case 'auth/invalid-email':
                setError('El formato del correo electrónico no es válido.');
                break;
            case 'auth/too-many-requests':
                setError('Demasiados intentos fallidos. Intenta de nuevo más tarde.');
                break;
            case 'auth/network-request-failed':
                setError('Error de conexión. Verifica tu conexión a internet.');
                break;
            case 'auth/user-disabled':
                setError('Esta cuenta ha sido deshabilitada.');
                break;
            case 'auth/operation-not-allowed':
                setError('Esta operación no está permitida. Contacta al administrador.');
                break;
            case 'auth/invalid-credential':
                setError('Credenciales inválidas.');
                break;
            case 'auth/account-exists-with-different-credential':
                setError('Ya existe una cuenta con este email pero con diferentes credenciales.');
                break;
            case 'auth/requires-recent-login':
                setError('Esta operación requiere un inicio de sesión reciente.');
                break;
            default:
                setError(`Error inesperado: ${authError.message || 'Error desconocido'}`);
                if (process.env.NODE_ENV === 'development') {
                    console.error('Error de autenticación no manejado:', err);
                }
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Check if user document exists
            const userDocRef = doc(db, "users", userCredential.user.uid);
            const userSnap = await getDoc(userDocRef);
            
            if (!userSnap.exists()) {
                // Crear documento de usuario si no existe
                const newUser = {
                    firstName: "",
                    lastName: "",
                    email: userCredential.user.email,
                    phone: '',
                    role: UserRole.Admin,
                    position: 'Nuevo Usuario',
                    avatarUrl: `https://i.pravatar.cc/150?u=${userCredential.user.uid}`,
                };
                await setDoc(userDocRef, newUser);
                if (process.env.NODE_ENV === 'development') {
                    console.log("Documento de usuario creado tras login");
                }
            }
        } catch (err) {
            handleAuthError(err as AuthError);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Crear documento de usuario
            const userDocRef = doc(db, "users", userCredential.user.uid);
            const newUser = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                phone: '',
                role: UserRole.User,
                position: 'Nuevo Usuario',
                avatarUrl: `https://i.pravatar.cc/150?u=${userCredential.user.uid}`,
            };
            
            await setDoc(userDocRef, newUser);
            setMessage('Usuario creado exitosamente. Ya puedes iniciar sesión.');
            setIsLoginView(true);
        } catch (err) {
            handleAuthError(err as AuthError);
        }
    };

    const handlePasswordReset = async () => {
        if (!email) {
            setError('Por favor, introduce tu correo electrónico primero.');
            return;
        }
        
        setIsLoading(true);
        setError('');
        
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Se ha enviado un correo de restablecimiento de contraseña.');
        } catch (err) {
            handleAuthError(err as AuthError);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'}`}>
            <div className={`max-w-md w-full space-y-8 p-8 rounded-lg shadow-lg ${theme === 'dark' ? 'bg-dark-card' : 'bg-light-card'}`}>
                <div className="text-center">
                    <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-dark-text' : 'text-light-text'}`}>
                        {isLoginView ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </h2>
                    <p className={`mt-2 ${theme === 'dark' ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                        {isLoginView ? 'Accede a tu cuenta' : 'Crea una nueva cuenta'}
                    </p>
                </div>

                {/* Botón para mostrar/ocultar prueba de Firebase */}
                <button
                    onClick={() => setShowFirebaseTest(!showFirebaseTest)}
                    className="w-full text-sm text-blue-600 hover:text-blue-500"
                >
                    {showFirebaseTest ? 'Ocultar' : 'Mostrar'} Prueba de Firebase
                </button>

                {showFirebaseTest && <FirebaseTest />}

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {message}
                    </div>
                )}

                <form className="space-y-6" onSubmit={isLoginView ? handleLogin : handleSignUp}>
                    {!isLoginView && (
                        <>
                            <div>
                                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-dark-text' : 'text-light-text'}`}>
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-dark-input border-dark-border text-dark-text' : 'bg-light-input border-light-border text-light-text'}`}
                                    required
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-dark-text' : 'text-light-text'}`}>
                                    Apellido
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-dark-input border-dark-border text-dark-text' : 'bg-light-input border-light-border text-light-text'}`}
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-dark-text' : 'text-light-text'}`}>
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-dark-input border-dark-border text-dark-text' : 'bg-light-input border-light-border text-light-text'}`}
                            required
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-dark-text' : 'text-light-text'}`}>
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`mt-1 block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-dark-input border-dark-border text-dark-text' : 'bg-light-input border-light-border text-light-text'}`}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Cargando...' : (isLoginView ? 'Iniciar Sesión' : 'Crear Cuenta')}
                        </button>
                    </div>

                    {isLoginView && (
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handlePasswordReset}
                                className="text-sm text-blue-600 hover:text-blue-500"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                    )}
                </form>

                <div className="text-center">
                    <button
                        onClick={() => {
                            setIsLoginView(!isLoginView);
                            setError('');
                            setMessage('');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-500"
                    >
                        {isLoginView ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginView;