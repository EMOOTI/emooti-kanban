
import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { User } from '../types';
import TestAPIButton from './TestAPIButton';

interface SettingsViewProps {
    user: User;
    onUpdateUser: (user: User) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser }) => {
    const { theme, toggleTheme } = useTheme();
    const [formData, setFormData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
    });

    useEffect(() => {
        setFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        });
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = () => {
        onUpdateUser({
            ...user,
            ...formData,
            // Asegurarse de que el nombre completo se combine correctamente
            // Nota: El modelo de datos tiene `firstName` y `lastName`, así que no es necesario un campo "name" combinado
        });
        alert("¡Cambios guardados!");
    };


    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12 overflow-y-auto h-full">
            <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">Ajustes</h1>

            {/* Profile Section */}
            <section>
                <h2 className="text-2xl font-semibold mb-6 border-b border-light-border dark:border-dark-border pb-2">Perfil</h2>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl">
                         <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Nombre</label>
                            <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Apellidos</label>
                            <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Correo Electrónico</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="w-full max-w-xl p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary" />
                    </div>
                </div>
            </section>

            {/* Preferences Section */}
            <section>
                <h2 className="text-2xl font-semibold mb-6 border-b border-light-border dark:border-dark-border pb-2">Preferencias</h2>
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row items-start sm:items-center justify-between max-w-xl">
                        <div>
                            <h3 className="font-medium">Tema</h3>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Elige entre temas claro y oscuro.</p>
                        </div>
                        <div className="flex items-center space-x-2">
                             <span className="capitalize text-sm font-medium">{theme}</span>
                             <button
                                onClick={toggleTheme}
                                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${theme === 'dark' ? 'bg-primary' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block w-5 h-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* API Testing Section */}
            <section>
                <h2 className="text-2xl font-semibold mb-6 border-b border-light-border dark:border-dark-border pb-2">Pruebas de API</h2>
                <TestAPIButton />
            </section>
            
            <div className="pt-6 border-t border-light-border dark:border-dark-border">
                <button onClick={handleSaveChanges} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary w-32 h-9 flex items-center justify-center">
                    Guardar Cambios
                </button>
            </div>

        </div>
    );
};

export default SettingsView;
