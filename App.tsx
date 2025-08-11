
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './services/firebase';
import { User } from './types';
import { useTheme } from './hooks/useTheme';
import LoginView from './components/LoginView';

const App: React.FC = () => {
    const { theme } = useTheme();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    useEffect(() => {
        const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            console.log('Auth state changed:', firebaseUser?.email);
            setIsLoadingAuth(false);
            
            if (firebaseUser) {
                // Simular usuario para pruebas
                setCurrentUser({
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    firstName: 'Usuario',
                    lastName: 'Prueba',
                    role: 'User' as any,
                    avatarUrl: 'https://via.placeholder.com/40'
                } as User);
            } else {
                setCurrentUser(null);
            }
        });

        return () => authUnsubscribe();
    }, []);

    const handleLogout = () => {
        auth.signOut();
    };

    if (isLoadingAuth) {
        return (
            <div className={`h-screen w-screen flex items-center justify-center ${theme}`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-lg">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-screen w-screen flex flex-col ${theme}`}>
            <div className="bg-green-500 text-white text-lg font-bold px-4 py-2 text-center">
                ✅ Emooti v2.1 - MENÚ DE USUARIO ACTIVADO
            </div>
            <div className="flex-1 p-4">
                <h1 className="text-2xl font-bold mb-4">Emooti - Gestor de Tareas</h1>
                {!currentUser ? (
                    <LoginView />
                ) : (
                    <div className="bg-green-100 p-4 rounded">
                        <h2 className="text-lg font-semibold">Estado: Autenticado</h2>
                        <p>Usuario: {currentUser.firstName} {currentUser.lastName}</p>
                        <p>Email: {currentUser.email}</p>
                        <button 
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-4 py-2 rounded mt-2"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;