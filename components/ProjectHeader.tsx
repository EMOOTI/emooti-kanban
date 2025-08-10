import React from 'react';
import { Project } from '../types';
import { 
    Squares2X2Icon,
    CalendarDaysIcon,
    ChartBarIcon,
    ArrowLeftIcon,
    SettingsIcon
} from './icons';

interface ProjectHeaderProps {
    project: Project;
    currentView: 'board' | 'timeline' | 'dashboard';
    onViewChange: (view: 'board' | 'timeline' | 'dashboard') => void;
    onBackToProjects: () => void;
    onOpenSettings: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
    project,
    currentView,
    onViewChange,
    onBackToProjects,
    onOpenSettings
}) => {
    const viewOptions = [
        { id: 'board', label: 'Panel', icon: Squares2X2Icon },
        { id: 'timeline', label: 'Cronograma', icon: CalendarDaysIcon },
        { id: 'dashboard', label: 'Resumen', icon: ChartBarIcon }
    ] as const;

    return (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4">
                {/* Header superior */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={onBackToProjects}
                            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            <ArrowLeftIcon />
                            <span className="ml-2">Proyectos</span>
                        </button>
                        <div className="flex items-center space-x-3">
                            <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: project.color || '#6366f1' }}
                            />
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {project.name}
                            </h1>
                        </div>
                    </div>
                    <button
                        onClick={onOpenSettings}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Configuración del proyecto"
                    >
                        <SettingsIcon />
                    </button>
                </div>

                {/* Menú horizontal de vistas */}
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    {viewOptions.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => onViewChange(id)}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                currentView === id
                                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <Icon />
                            <span className="ml-2">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProjectHeader; 