import React, { useState } from 'react';
import { Project, User } from '../types';
import { 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    UserPlusIcon,
    FolderIcon,
    ChevronLeftIcon
} from './icons';
import { ColorService } from '../services/colorService';

interface SupportViewProps {
    currentUser: User;
    projects: Project[];
    users: User[];
    onSelectProject: (projectId: string) => void;
    onEditProject: (project: Project) => void;
    onDeleteProject: (projectId: string) => void;
    onAddMembers: (project: Project) => void;
    onNavigateBack: () => void;
}

const SupportView: React.FC<SupportViewProps> = ({
    currentUser,
    projects,
    users,
    onSelectProject,
    onEditProject,
    onDeleteProject,
    onAddMembers,
    onNavigateBack
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filtrar proyectos por término de búsqueda
    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Función helper para verificar si un proyecto está protegido
    const isProjectProtected = (projectName: string): boolean => {
        const protectedProjects = ['Soporte', 'Compras'];
        return protectedProjects.includes(projectName);
    };

    return (
        <div className="flex-1 overflow-y-auto bg-light-bg dark:bg-dark-bg">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-light-border dark:border-dark-border">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={onNavigateBack}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Volver"
                            >
                                <ChevronLeftIcon />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">
                                    Gestión de Proyectos
                                </h1>
                                <p className="text-light-text-secondary dark:text-dark-text-secondary">
                                    Administra todos los proyectos a los que tienes acceso
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar proyectos..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-white dark:bg-gray-700 text-light-text dark:text-dark-text focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
                {filteredProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProjects.map(project => {
                            const textColor = ColorService.getContrastingTextColor(project.color || '#FFFFFF');
                            const isProtected = isProjectProtected(project.name);
                            
                            return (
                                <div 
                                    key={project.id} 
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-light-border dark:border-dark-border hover:shadow-xl transition-shadow duration-300"
                                >
                                    {/* Imagen del proyecto */}
                                    <div className="relative">
                                        {project.imageUrl ? (
                                            <img 
                                                src={project.imageUrl} 
                                                alt={project.name} 
                                                className="w-full h-48 object-cover"
                                            />
                                        ) : (
                                            <div 
                                                className="w-full h-48 flex items-center justify-center"
                                                style={{ backgroundColor: project.color || '#6366f1' }}
                                            >
                                                <FolderIcon className="w-16 h-16" style={{ color: textColor }} />
                                            </div>
                                        )}
                                        
                                        {/* Badge de proyecto protegido */}
                                        {isProtected && (
                                            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                                Protegido
                                            </div>
                                        )}
                                    </div>

                                    {/* Información del proyecto */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-light-text dark:text-dark-text mb-2">
                                            {project.name}
                                        </h3>
                                        <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm mb-4 line-clamp-2">
                                            {project.description || 'Sin descripción'}
                                        </p>

                                        {/* Miembros del proyecto */}
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                                                Miembros ({project.members.length})
                                            </h4>
                                            <div className="flex flex-wrap gap-1">
                                                {project.members.slice(0, 3).map(memberId => {
                                                    const member = users.find(u => u.id === memberId);
                                                    return member ? (
                                                        <div 
                                                            key={memberId}
                                                            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium"
                                                            title={`${member.firstName} ${member.lastName}`}
                                                        >
                                                            {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                                                        </div>
                                                    ) : null;
                                                })}
                                                {project.members.length > 3 && (
                                                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center justify-center text-xs font-medium">
                                                        +{project.members.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Botones de acción */}
                                        <div className="flex items-center justify-between pt-4 border-t border-light-border dark:border-dark-border">
                                            <button
                                                onClick={() => onSelectProject(project.id)}
                                                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
                                            >
                                                Abrir Proyecto
                                            </button>
                                            
                                            <div className="flex items-center space-x-2 ml-3">
                                                {/* Botón Añadir/Modificar Miembros */}
                                                <button
                                                    onClick={() => onAddMembers(project)}
                                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    title="Gestionar miembros"
                                                >
                                                    <UserPlusIcon className="w-4 h-4 text-blue-600" />
                                                </button>

                                                {/* Botón Editar Proyecto */}
                                                <button
                                                    onClick={() => onEditProject(project)}
                                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    title="Editar proyecto"
                                                >
                                                    <PencilIcon className="w-4 h-4 text-green-600" />
                                                </button>

                                                {/* Botón Eliminar Proyecto (solo si no está protegido) */}
                                                {!isProtected && (
                                                    <button
                                                        onClick={() => onDeleteProject(project.id)}
                                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                        title="Eliminar proyecto"
                                                    >
                                                        <TrashIcon className="w-4 h-4 text-red-600" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
                            <FolderIcon className="w-full h-full" />
                        </div>
                        <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-2">
                            {searchTerm ? 'No se encontraron proyectos' : 'No tienes proyectos asignados'}
                        </h2>
                        <p className="text-light-text-secondary dark:text-dark-text-secondary">
                            {searchTerm 
                                ? 'Intenta con otros términos de búsqueda'
                                : 'Pide a un administrador que te añada a un proyecto o crea uno nuevo si eres administrador.'
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportView; 