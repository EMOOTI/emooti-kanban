import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { XIcon, LinkIcon, ExclamationTriangleIcon, CheckCircleIcon } from './icons';

interface TaskDependenciesModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTask: Task;
    allTasks: Task[];
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

const TaskDependenciesModal: React.FC<TaskDependenciesModalProps> = ({
    isOpen,
    onClose,
    currentTask,
    allTasks,
    onUpdateTask
}) => {
    const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedDependencies(currentTask.dependencies || []);
        }
    }, [isOpen, currentTask]);

    // Filtrar tareas disponibles (excluir la tarea actual y las que ya dependen de ella)
    const availableTasks = allTasks.filter(task => 
        task.id !== currentTask.id && 
        task.projectId === currentTask.projectId &&
        !currentTask.dependents?.includes(task.id) &&
        task.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Obtener tareas dependientes actuales
    const currentDependencies = allTasks.filter(task => 
        currentTask.dependencies?.includes(task.id)
    );

    // Obtener tareas que dependen de esta
    const currentDependents = allTasks.filter(task => 
        currentTask.dependents?.includes(task.id)
    );

    const handleSave = () => {
        // Actualizar dependencias de la tarea actual
        onUpdateTask(currentTask.id, {
            dependencies: selectedDependencies
        });

        // Actualizar dependents de las tareas seleccionadas
        selectedDependencies.forEach(depId => {
            const depTask = allTasks.find(t => t.id === depId);
            if (depTask) {
                const updatedDependents = [...(depTask.dependents || []), currentTask.id];
                onUpdateTask(depId, { dependents: updatedDependents });
            }
        });

        // Remover dependents de las tareas que ya no son dependencias
        const removedDeps = (currentTask.dependencies || []).filter(depId => 
            !selectedDependencies.includes(depId)
        );
        removedDeps.forEach(depId => {
            const depTask = allTasks.find(t => t.id === depId);
            if (depTask) {
                const updatedDependents = (depTask.dependents || []).filter(id => id !== currentTask.id);
                onUpdateTask(depId, { dependents: updatedDependents });
            }
        });

        onClose();
    };

    const handleClose = () => {
        setSelectedDependencies(currentTask.dependencies || []);
        setSearchTerm('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70" onClick={handleClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-2xl w-full max-w-2xl p-6 relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <LinkIcon />
                        <h2 className="text-xl font-bold text-light-text dark:text-dark-text ml-2">
                            Dependencias de Tarea
                        </h2>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XIcon />
                    </button>
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-2">
                        {currentTask.title}
                    </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Dependencias actuales */}
                    <div>
                        <h4 className="font-medium text-light-text dark:text-dark-text mb-3">
                            Dependencias Actuales
                        </h4>
                        {currentDependencies.length > 0 ? (
                            <div className="space-y-2">
                                {currentDependencies.map(task => (
                                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div>
                                            <div className="font-medium text-light-text dark:text-dark-text">
                                                {task.title}
                                            </div>
                                            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                                {task.columnId}
                                            </div>
                                        </div>
                                        <CheckCircleIcon className="text-green-500" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-light-text-secondary dark:text-dark-text-secondary text-center py-4">
                                No hay dependencias configuradas
                            </div>
                        )}
                    </div>

                    {/* Tareas que dependen de esta */}
                    <div>
                        <h4 className="font-medium text-light-text dark:text-dark-text mb-3">
                            Tareas que dependen de esta
                        </h4>
                        {currentDependents.length > 0 ? (
                            <div className="space-y-2">
                                {currentDependents.map(task => (
                                    <div key={task.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <div>
                                            <div className="font-medium text-light-text dark:text-dark-text">
                                                {task.title}
                                            </div>
                                            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                                {task.columnId}
                                            </div>
                                        </div>
                                        <ExclamationTriangleIcon className="text-blue-500" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-light-text-secondary dark:text-dark-text-secondary text-center py-4">
                                Ninguna tarea depende de esta
                            </div>
                        )}
                    </div>
                </div>

                {/* Agregar nuevas dependencias */}
                <div className="mt-6">
                    <h4 className="font-medium text-light-text dark:text-dark-text mb-3">
                        Agregar Dependencias
                    </h4>
                    
                    <input
                        type="text"
                        placeholder="Buscar tareas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary mb-4"
                    />

                    <div className="max-h-48 overflow-y-auto space-y-2">
                        {availableTasks.map(task => (
                            <label key={task.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedDependencies.includes(task.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedDependencies(prev => [...prev, task.id]);
                                        } else {
                                            setSelectedDependencies(prev => prev.filter(id => id !== task.id));
                                        }
                                    }}
                                    className="mr-3"
                                />
                                <div>
                                    <div className="font-medium text-light-text dark:text-dark-text">
                                        {task.title}
                                    </div>
                                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                        {task.columnId}
                                    </div>
                                </div>
                            </label>
                        ))}
                        {availableTasks.length === 0 && (
                            <div className="text-light-text-secondary dark:text-dark-text-secondary text-center py-4">
                                No hay tareas disponibles para agregar como dependencia
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors duration-200"
                    >
                        Guardar Dependencias
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskDependenciesModal;
