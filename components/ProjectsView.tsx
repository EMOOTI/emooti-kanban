
import React, { useState } from 'react';
import { Project, Id, User, UserRole } from '../types';
import { PlusIcon, TrashIcon, FolderIcon, PencilIcon, PaletteIcon, UserPlusIcon, AIIcon } from './icons';
import ContextMenu, { ContextMenuGroup } from './ContextMenu';
import { ColorService } from '../services/colorService';
import { AIService } from '../services/aiService';


interface ProjectsViewProps {
    projects: Project[];
    currentUser: User | null;
    onSelectProject: (projectId: Id) => void;
    onAddProject: () => void;
    onEditProject: (project: Project) => void;
    onDeleteProject: (projectId: Id) => void;
    onOpenColorPicker: (project: Project) => void;
    onAddMembers: (project: Project) => void;
    onCreateAITask?: (project: Project) => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, currentUser, onSelectProject, onAddProject, onEditProject, onDeleteProject, onOpenColorPicker, onAddMembers, onCreateAITask }) => {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; project: Project } | null>(null);
    const [isGeneratingTask, setIsGeneratingTask] = useState(false);

    // const isAdmin = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.ProjectManager;
    const isAdmin = true; // Permitir a todos crear, modificar y borrar proyectos

    const handleContextMenu = (event: React.MouseEvent, project: Project) => {
        event.preventDefault();
        event.stopPropagation();
        console.log('🔧 ContextMenu activado para proyecto:', project.name);
        console.log('🔧 isAdmin:', isAdmin);
        if (isAdmin) {
             setContextMenu({ x: event.clientX, y: event.clientY, project });
             console.log('🔧 ContextMenu establecido');
        }
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleCreateAITask = async (project: Project) => {
        if (!onCreateAITask) return;
        
        setIsGeneratingTask(true);
        try {
            await onCreateAITask(project);
        } catch (error) {
            console.error('Error creando tarea con IA:', error);
            alert('Error al crear la tarea con IA. Verifica tu API key de OpenAI.');
        } finally {
            setIsGeneratingTask(false);
            setContextMenu(null);
        }
    };

    // Función helper para verificar si un proyecto está protegido
    const isProjectProtected = (projectName: string): boolean => {
        const protectedProjects = ['Soporte', 'Compras'];
        return protectedProjects.includes(projectName);
    };

    const getContextMenuActionGroups = (project: Project): ContextMenuGroup[] => {
        console.log('🔧 Generando acciones del menú para proyecto:', project.name);
        console.log('🔧 onCreateAITask disponible:', !!onCreateAITask);
        
        const actions: ContextMenuGroup[] = [
            [
                { label: 'Cambiar color', icon: <PaletteIcon />, onClick: () => onOpenColorPicker(project) },
                { 
                    label: isGeneratingTask ? 'Generando tarea...' : 'Crear tarea con IA', 
                    icon: <AIIcon />, 
                    onClick: () => handleCreateAITask(project),
                    disabled: isGeneratingTask
                }
            ]
        ];

        // Solo mostrar opción de eliminar si el usuario es admin y el proyecto no es protegido
        if (currentUser?.role === 'admin' && !isProjectProtected(project.name)) {
            actions.push([{ label: 'Eliminar Proyecto', icon: <TrashIcon />, onClick: () => onDeleteProject(project.id), isDestructive: true }]);
        }

        console.log('🔧 Acciones generadas:', actions);
        return actions;
    };

    return (
        <div className="p-4 md:p-8 overflow-y-auto h-full">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Selecciona un Proyecto</h1>
                {isAdmin && (
                    <button 
                        onClick={onAddProject} 
                        className="flex items-center justify-center px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition-colors duration-200 text-sm w-32 h-9"
                    >
                        <span>Crear Proyecto</span>
                    </button>
                )}
            </div>

            {projects.length > 0 ? (
                <div className="space-y-3">
                    {projects.map(project => {
                        const isProtected = isProjectProtected(project.name);
                        return (
                            <div 
                                key={project.id} 
                                onContextMenu={(e) => handleContextMenu(e, project)}
                                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 ${isAdmin ? 'cursor-context-menu' : 'cursor-pointer'}`}
                                onClick={() => onSelectProject(project.id)}
                            >
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center space-x-4 flex-1">
                                        {/* Color del proyecto */}
                                        <div 
                                            className="w-4 h-4 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: project.color || '#6366f1' }}
                                        />
                                        
                                        {/* Información del proyecto */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                                    {project.name}
                                                </h3>
                                                {isProtected && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                        Protegido
                                                    </span>
                                                )}
                                            </div>
                                            {project.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                    {project.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Acciones */}
                                    {isAdmin && (
                                        <div className="flex items-center space-x-2 ml-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddMembers(project);
                                                }}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
                                                title="Añadir miembros"
                                            >
                                                <UserPlusIcon />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditProject(project);
                                                }}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
                                                title="Editar proyecto"
                                            >
                                                <PencilIcon />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-semibold mb-2">No tienes proyectos asignados</h2>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary">Pide a un administrador que te añada a un proyecto o crea uno nuevo si eres administrador.</p>
                </div>
            )}
            {contextMenu && (
                <>
                    {console.log('🔧 Renderizando ContextMenu en:', contextMenu.x, contextMenu.y)}
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        actionGroups={getContextMenuActionGroups(contextMenu.project)}
                        onClose={handleCloseContextMenu}
                    />
                </>
            )}
        </div>
    );
};

export default ProjectsView;
