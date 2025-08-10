
import React, { useState, useEffect } from 'react';
import { Task, Id, User, Team } from '../types';
import { PRIORITY_STYLES } from '../constants';
import { ColorService } from '../services/colorService';
import { PaletteIcon, CheckIcon, PlusIcon, CheckCircleIcon, EyeIcon, LinkIcon, TrashIcon } from './icons';

interface TaskCardProps {
    task: Task;
    users: User[];
    teams: Team[];
    onSelectTask: (task: Task) => void;
    onDragStart: (taskId: Id) => void;
    onDrop: (task: Task) => void;
    onContextMenu: (e: React.MouseEvent, task: Task) => void;
    onDragEnter: (taskId: Id) => void;
    isDraggedOver: boolean;
    onOpenColorPicker: (task: Task) => void;
    onToggleComplete?: (taskId: Id) => void;
    onDuplicateTask?: (taskId: Id) => void;
    onCreateFollowUpTask?: (taskId: Id) => void;
    onDeleteTask?: (taskId: Id) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
    task, 
    users, 
    teams, 
    onSelectTask, 
    onDragStart, 
    onDrop, 
    onContextMenu, 
    onDragEnter, 
    isDraggedOver, 
    onOpenColorPicker, 
    onToggleComplete, 
    onDuplicateTask, 
    onCreateFollowUpTask, 
    onDeleteTask 
}) => {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('taskId', task.id.toString());
        onDragStart(task.id);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        onDrop(task);
    };
    
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    let dueDateText = '';
    let dueDateColor = 'text-light-text-secondary dark:text-dark-text-secondary';
    if(dueDate){
        const today = new Date();
        today.setHours(0,0,0,0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            dueDateText = `Atrasada por ${Math.abs(diffDays)} días`;
            dueDateColor = 'text-red-500';
        } else if (diffDays === 0) {
            dueDateText = 'Vence hoy';
            dueDateColor = 'text-orange-500';
        } else if (diffDays === 1) {
            dueDateText = 'Vence mañana';
        } else {
            dueDateText = `Vence en ${diffDays} días`;
        }
    }

    const textColor = task.color ? ColorService.getContrastingTextColor(task.color) : '';
    const dueDateClass = !task.color ? dueDateColor : 'opacity-80';
    const isCompleted = task.taskStatus === 'completed' || false;

    const handleToggleComplete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('✅ Checkbox clicked for task:', task.title);
        if (onToggleComplete) {
            onToggleComplete(task.id);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e, task);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => onDragEnter(task.id)}
            onContextMenu={handleContextMenu}
            onClick={() => onSelectTask(task)}
            className={`group rounded-lg shadow-md hover:shadow-xl cursor-pointer transition-all duration-200 border dark:border-dark-border ${isDraggedOver ? 'outline outline-2 outline-primary outline-offset-2' : ''} ${task.color ? 'border-transparent' : 'bg-light-card dark:bg-dark-card border-light-border'} ${isCompleted ? 'opacity-75' : ''}`}
            style={{ backgroundColor: task.color }}
            role="button"
            tabIndex={0}
            aria-label={`Tarea: ${task.title}. Prioridad: ${task.priority}. ${dueDateText ? `Fecha de vencimiento: ${dueDateText}` : 'Sin fecha de vencimiento'}. ${isCompleted ? 'Completada' : 'Pendiente'}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTask(task);
                }
            }}
        >
            {task.coverImage && (
                <img 
                    src={task.coverImage} 
                    alt={`Imagen de portada para la tarea: ${task.title}`} 
                    className="w-full h-24 object-cover rounded-t-lg" 
                />
            )}
            <div className="p-3" style={{ color: textColor }}>
                <div className="flex items-start gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={handleToggleComplete}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        className={`flex-shrink-0 w-4 h-4 rounded border-2 transition-all duration-200 ${
                            isCompleted 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                        } flex items-center justify-center`}
                        title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
                        aria-label={isCompleted ? 'Marcar tarea como pendiente' : 'Marcar tarea como completada'}
                        aria-pressed={isCompleted}
                    >
                        {isCompleted && <CheckIcon />}
                    </button>
                    <h4 className={`font-bold text-sm flex-1 ${!task.color ? 'text-light-text dark:text-dark-text' : ''} ${isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                        {task.title}
                    </h4>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span 
                        className={`px-2 py-1 rounded-full text-xs font-medium text-white ${PRIORITY_STYLES[task.priority]}`}
                        aria-label={`Prioridad: ${task.priority}`}
                    >
                        {task.priority}
                    </span>
                    {dueDateText && (
                        <span 
                            className={dueDateClass}
                            aria-label={`Fecha de vencimiento: ${dueDateText}`}
                        >
                           {dueDateText}
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between mt-3">
                     <div className="flex items-center space-x-2">
                        {/* Responsables */}
                        {(() => {
                            // Mostrar usuario responsable
                            if (task.assignedTo) {
                                const responsibleUser = users.find(user => user.id === task.assignedTo);
                                return responsibleUser ? (
                                    <div className="flex -space-x-1">
                                        <div 
                                            className="w-6 h-6 rounded-full ring-1 ring-white dark:ring-gray-800 overflow-hidden cursor-pointer group relative"
                                            title={`Responsable: ${responsibleUser.firstName} ${responsibleUser.lastName}`}
                                            aria-label={`Responsable: ${responsibleUser.firstName} ${responsibleUser.lastName}`}
                                        >
                                            <img 
                                                src={responsibleUser.avatarUrl || '/default-avatar.png'} 
                                                alt={`Avatar de ${responsibleUser.firstName} ${responsibleUser.lastName}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                                                {responsibleUser.firstName} {responsibleUser.lastName}
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    </div>
                                ) : null;
                            }
                            
                            // Mostrar equipo responsable
                            if (task.assignedTeam) {
                                const responsibleTeam = teams.find(team => team.id === task.assignedTeam);
                                return responsibleTeam ? (
                                    <div className="flex -space-x-1">
                                        <div 
                                            className="w-6 h-6 rounded-full ring-1 ring-white dark:ring-gray-800 overflow-hidden cursor-pointer group relative"
                                            title={`Equipo responsable: ${responsibleTeam.name}`}
                                            aria-label={`Equipo responsable: ${responsibleTeam.name}`}
                                        >
                                            <div 
                                                className="w-full h-full flex items-center justify-center text-xs font-medium text-white"
                                                style={{ backgroundColor: responsibleTeam.color }}
                                            >
                                                {responsibleTeam.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                                                {responsibleTeam.name}
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    </div>
                                ) : null;
                            }
                            
                            return null;
                        })()}

                        {/* Colaboradores */}
                        {task.collaborators && task.collaborators.length > 0 && (
                            <div className="flex -space-x-1">
                                {task.collaborators.slice(0, 3).map(collaboratorId => {
                                    const collaborator = users.find(user => user.id === collaboratorId);
                                    return collaborator ? (
                                        <div 
                                            key={collaboratorId}
                                            className="w-6 h-6 rounded-full ring-1 ring-white dark:ring-gray-800 overflow-hidden cursor-pointer group relative"
                                            title={`Colaborador: ${collaborator.firstName} ${collaborator.lastName}`}
                                            aria-label={`Colaborador: ${collaborator.firstName} ${collaborator.lastName}`}
                                        >
                                            <img 
                                                src={collaborator.avatarUrl || '/default-avatar.png'} 
                                                alt={`Avatar de ${collaborator.firstName} ${collaborator.lastName}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                                                {collaborator.firstName} {collaborator.lastName}
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    ) : null;
                                })}
                                {task.collaborators.length > 3 && (
                                    <div 
                                        className="w-6 h-6 rounded-full ring-1 ring-white dark:ring-gray-800 bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300"
                                        title={`Y ${task.collaborators.length - 3} colaboradores más`}
                                        aria-label={`Y ${task.collaborators.length - 3} colaboradores más`}
                                    >
                                        +{task.collaborators.length - 3}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Equipos colaboradores */}
                        {task.collaboratorTeams && task.collaboratorTeams.length > 0 && (
                            <div className="flex -space-x-1">
                                {task.collaboratorTeams.slice(0, 2).map(teamId => {
                                    const team = teams.find(t => t.id === teamId);
                                    return team ? (
                                        <div 
                                            key={teamId}
                                            className="w-6 h-6 rounded-full ring-1 ring-white dark:ring-gray-800 overflow-hidden cursor-pointer group relative"
                                            title={`Equipo colaborador: ${team.name}`}
                                            aria-label={`Equipo colaborador: ${team.name}`}
                                        >
                                            <div 
                                                className="w-full h-full flex items-center justify-center text-xs font-medium text-white"
                                                style={{ backgroundColor: team.color }}
                                            >
                                                {team.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                                                {team.name}
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    ) : null;
                                })}
                                {task.collaboratorTeams.length > 2 && (
                                    <div 
                                        className="w-6 h-6 rounded-full ring-1 ring-white dark:ring-gray-800 bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300"
                                        title={`Y ${task.collaboratorTeams.length - 2} equipos más`}
                                        aria-label={`Y ${task.collaboratorTeams.length - 2} equipos más`}
                                    >
                                        +{task.collaboratorTeams.length - 2}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Subtareas */}
                    {task.subtasks && task.subtasks.length > 0 && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <span className="mr-1">
                                {task.subtasks.filter(subtask => subtask.completed).length}/{task.subtasks.length}
                            </span>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
