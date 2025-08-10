import React, { useState, useEffect } from 'react';
import { XMarkIcon, EnvelopeIcon, UsersIcon } from './icons';
import { Project } from '../types';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    users: any[];
    onInviteToProject: (email: string, projectIds: string[]) => Promise<{ success: boolean; userExists: boolean; message: string }>;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({
    isOpen,
    onClose,
    projects,
    users,
    onInviteToProject
}) => {
    const [email, setEmail] = useState('');
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Cerrar dropdown cuando se hace clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.project-dropdown')) {
                setIsProjectDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!isOpen) return null;

    // Obtener los proyectos seleccionados
    const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        console.log('🔧 InviteUserModal - handleSubmit ejecutándose');
        console.log('📧 Email:', email);
        console.log('📋 Proyectos seleccionados:', selectedProjectIds);
        
        if (!email.trim()) {
            setError('Por favor, introduce un email válido');
            return;
        }

        // Validación básica de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Por favor, introduce un email válido');
            return;
        }

        if (selectedProjectIds.length === 0) {
            setError('Por favor selecciona al menos un proyecto');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            console.log('🚀 InviteUserModal - Llamando a onInviteToProject');
            const result = await onInviteToProject(email, selectedProjectIds);
            console.log('✅ InviteUserModal - Resultado:', result);
            
            if (result.success) {
                setSuccess(true);
                setEmail('');
                setSelectedProjectIds([]);
                setTimeout(() => {
                    setSuccess(false);
                    onClose();
                }, 3000);
            } else {
                setError(result.message);
            }
        } catch (error) {
            console.error('❌ InviteUserModal - Error:', error);
            setError('Error al enviar la invitación. Por favor, inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <div className="h-5 w-5 text-blue-600">
                                <UsersIcon />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Invitar a Proyectos</h2>
                            <p className="text-sm text-gray-500">
                                {selectedProjects.length > 0 ? 
                                    `Invitar usuario a ${selectedProjects.length} proyecto${selectedProjects.length > 1 ? 's' : ''}` : 
                                    'Selecciona al menos un proyecto'
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <XMarkIcon />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    {success ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">¡Usuario invitado!</h3>
                            <p className="text-gray-500">
                                {selectedProjects.length > 0 ? 
                                    `El usuario ha sido invitado a ${selectedProjects.length} proyecto${selectedProjects.length > 1 ? 's' : ''}` : 
                                    'El usuario ha sido invitado a los proyectos'
                                }
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Selector de Proyectos */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Proyectos *
                                </label>
                                <div className="relative project-dropdown">
                                    <button
                                        type="button"
                                        onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white flex items-center justify-between"
                                        disabled={isLoading}
                                    >
                                        <span className={selectedProjectIds.length > 0 ? 'text-black' : 'text-gray-500'}>
                                            {selectedProjectIds.length === 0 
                                                ? 'Selecciona proyectos' 
                                                : `${selectedProjectIds.length} proyecto${selectedProjectIds.length > 1 ? 's' : ''} seleccionado${selectedProjectIds.length > 1 ? 's' : ''}`
                                            }
                                        </span>
                                        <svg className={`w-5 h-5 text-gray-400 transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    
                                    {isProjectDropdownOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            <div className="p-2">
                                                {projects.length === 0 ? (
                                                    <div className="p-2 text-sm text-gray-500 text-center">
                                                        No hay proyectos disponibles
                                                    </div>
                                                ) : (
                                                    <>
                                                        {projects.map(project => (
                                                            <label key={project.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedProjectIds.includes(project.id)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedProjectIds([...selectedProjectIds, project.id]);
                                                                        } else {
                                                                            setSelectedProjectIds(selectedProjectIds.filter(id => id !== project.id));
                                                                        }
                                                                    }}
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                />
                                                                <span className="text-sm text-black">{project.name}</span>
                                                            </label>
                                                        ))}
                                                        {selectedProjectIds.length > 0 && (
                                                            <div className="border-t border-gray-200 pt-2 mt-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedProjectIds([])}
                                                                    className="text-xs text-red-600 hover:text-red-800"
                                                                >
                                                                    Limpiar selección
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {selectedProjectIds.length === 0 && (
                                    <p className="text-sm text-red-600 mt-1">Selecciona al menos un proyecto</p>
                                )}
                            </div>

                            {/* Email del usuario */}
                            <div className="mb-6">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email del usuario *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="usuario@ejemplo.com"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            {selectedProjects.length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                                        Proyectos Seleccionados ({selectedProjects.length})
                                    </h4>
                                    <div className="text-sm text-blue-700 space-y-3">
                                        {selectedProjects.map(project => (
                                            <div key={project.id} className="border-l-2 border-blue-300 pl-3">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">Proyecto:</span>
                                                    <span>{project.name}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">Descripción:</span>
                                                    <span>{project.description || 'Sin descripción'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                <h4 className="text-sm font-medium text-green-900 mb-2">¿Qué pasará?</h4>
                                <ul className="text-sm text-green-700 space-y-1">
                                    <li>• Si el usuario existe, se le asignará directamente al proyecto</li>
                                    <li>• Si no existe, se le enviará un email de invitación</li>
                                    <li>• Al registrarse, se le asignará automáticamente al proyecto</li>
                                    <li>• Podrá acceder inmediatamente al proyecto</li>
                                </ul>
                            </div>
                        </>
                    )}
                </form>

                {/* Footer */}
                {!success && (
                    <div className="flex items-center justify-end p-6 border-t border-gray-200 space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-2 py-1 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                                                                            <button
                            type="button"
                            onClick={(e) => {
                                console.log('🔘 InviteUserModal - Botón Invitar clickeado');
                                handleSubmit(e);
                            }}
                            disabled={isLoading || !email.trim() || selectedProjectIds.length === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm w-32 h-9"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <UsersIcon />
                                    Invitar al Proyecto
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InviteUserModal; 