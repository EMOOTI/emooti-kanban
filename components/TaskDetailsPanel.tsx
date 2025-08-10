import React, { useState } from 'react';
import { Task, User, Project } from '../types';
import { 
    ThumbsUpIcon, 
    BellIcon, 
    PaperClipIcon, 
    LinkIcon, 
    ArrowRightIcon,
    ChatBubbleLeftIcon,
    CheckCircleIcon,
    PlusIcon,
    XMarkIcon
} from './icons';
import StatusDropdown, { TaskStatus } from './StatusDropdown';

interface TaskDetailsPanelProps {
    task: Task | null;
    users: User[];
    projects: Project[];
    onClose: () => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

const TaskDetailsPanel: React.FC<TaskDetailsPanelProps> = ({
    task,
    users,
    projects,
    onClose,
    onUpdateTask
}) => {
    const [currentStatus, setCurrentStatus] = useState<TaskStatus>('finalizado');

    if (!task) return null;

    const getAssigneeName = (userId: string) => {
        const user = users.find(u => u.id === userId);
        return user ? `${user.firstName} ${user.lastName}` : '';
    };

    const getAssigneeInitials = (userId: string) => {
        const user = users.find(u => u.id === userId);
        return user ? `${user.firstName[0]}${user.lastName[0]}` : '';
    };

    const getProjectName = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.name || '';
    };

    const getProjectColor = (projectId: string) => {
        return projects.find(p => p.id === projectId)?.color || '#6366f1';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Overlay */}
            <div 
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                onClick={onClose}
            />
            
            {/* Panel */}
            <div className="relative w-[800px] h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                        <StatusDropdown
                            currentStatus={currentStatus}
                            onStatusChange={setCurrentStatus}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                            <ThumbsUpIcon className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                            <BellIcon className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                            <PaperClipIcon className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                            <LinkIcon className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                            <ArrowRightIcon className="h-4 w-4 text-gray-600" />
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <XMarkIcon className="h-4 w-4 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Task Title */}
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">
                            {task.title}
                        </h2>
                        <div className="flex space-x-2">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                EMOOTI
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                EMOOTI-27
                            </span>
                        </div>
                    </div>

                    {/* Task Metadata */}
                    <div className="p-4 space-y-4">
                        {/* Assignee */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                                    {getAssigneeInitials(task.assignedTo || '')}
                                </div>
                                <span className="text-sm text-gray-700">
                                    {getAssigneeName(task.assignedTo || '')}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button className="p-1 hover:bg-gray-100 rounded">
                                    <XMarkIcon className="h-3 w-3 text-gray-400" />
                                </button>
                                <span className="text-xs text-gray-500">Asignadas recientemente</span>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Fecha de entrega</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                {task.dueDate ? (
                                    <span className="text-sm text-gray-700">
                                        {formatDate(task.dueDate)}
                                    </span>
                                ) : (
                                    <span className="text-sm text-gray-400">Sin fecha de entrega</span>
                                )}
                            </div>
                        </div>

                        {/* Project */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getProjectColor(task.projectId) }}
                                />
                                <span className="text-sm text-gray-700">
                                    {getProjectName(task.projectId)}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button className="p-1 hover:bg-gray-100 rounded">
                                    <XMarkIcon className="h-3 w-3 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Add to projects link */}
                        <button className="text-sm text-blue-600 hover:text-blue-700">
                            Agregar a proyectos
                        </button>

                        {/* Dependencies */}
                        <button className="text-sm text-blue-600 hover:text-blue-700">
                            Agregar dependencias
                        </button>

                        {/* Custom Fields */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Tipo de solicitud</span>
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                                    Eholo
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">EMOOTI</span>
                                <span className="text-sm text-gray-700">EMOOTI-27</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="p-4 border-t border-gray-200">
                        <h3 className="font-medium text-gray-900 mb-3">Descripción</h3>
                        <div className="space-y-2 text-sm text-gray-700">
                            <div><strong>Nombre:</strong> Laura Romero</div>
                            <div><strong>Dirección de email:</strong> desarrollo@emooti.com</div>
                            <div><strong>Resumen de la solicitud:</strong> {task.title}</div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                                Esta tarea fue enviada por medio de Formulario de soporte - Emooti te ayuda
                            </p>
                            <a 
                                href="https://form.asana.com/?k=kf7tmf-yeDPuC6hb5QBXCw&d=1210250053692508"
                                className="text-sm text-blue-600 hover:text-blue-700 break-all"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                https://form.asana.com/?k=kf7tmf-yeDPuC6hb5QBXCw&d=1210250053692508
                            </a>
                        </div>
                    </div>

                    {/* Subtasks */}
                    <div className="p-4 border-t border-gray-200">
                        <h3 className="font-medium text-gray-900 mb-3">Subtareas</h3>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" checked className="rounded" />
                                <span className="text-sm text-gray-700">comprobar la descarga</span>
                            </div>
                        </div>
                        <div className="mt-3 space-y-2">
                            <button className="w-full text-left text-sm text-blue-600 hover:text-blue-700">
                                + Agregar subtarea
                            </button>
                            <button className="w-full text-left text-sm text-gray-600 hover:text-gray-700">
                                Crear borrador de subtareas
                            </button>
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-gray-900">Comentarios</h3>
                            <button className="text-xs text-gray-500 hover:text-gray-700">
                                ↑↓ Más antiguas
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex space-x-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                                    DE
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-gray-700">
                                        <strong>Desarrollo Emooti</strong> creó esta tarea. 17 jun
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex space-x-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                                    DE
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-gray-700">
                                        <strong>Desarrollo Emooti</strong>. 17 jun Se envía la info por chat
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex space-x-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                                    DE
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                        <div className="text-sm text-gray-700">
                                            <strong>Desarrollo Emooti</strong> finalizó esta tarea. 17 jun
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Comment Input */}
                        <div className="mt-4 flex space-x-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                                DE
                            </div>
                            <input
                                type="text"
                                placeholder="Agregar un comentario"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Colaboradores</span>
                            <div className="flex space-x-1">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                                    DE
                                </div>
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs text-gray-600">
                                    +
                                </div>
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs text-gray-600">
                                    +
                                </div>
                                <button className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-600 hover:bg-gray-300">
                                    <PlusIcon className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                        <button className="text-sm text-red-600 hover:text-red-700">
                            Abandonar Solicitud de trabajo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailsPanel; 