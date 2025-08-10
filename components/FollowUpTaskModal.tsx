import React, { useState, useEffect } from 'react';
import { Task, Project, User, Priority } from '../types';
import { XIcon, CheckIcon } from './icons';
import VoiceInput from './VoiceInput';

interface FollowUpTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    originalTask: Task;
    projects: Project[];
    users: User[];
    currentUser: User;
    onCreateFollowUpTask: (taskData: {
        title: string;
        projectId: string;
        assignedTo: string;
        collaborators: string[];
        description?: string;
    }) => void;
}

const FollowUpTaskModal: React.FC<FollowUpTaskModalProps> = ({
    isOpen,
    onClose,
    originalTask,
    projects,
    users,
    currentUser,
    onCreateFollowUpTask
}) => {
    const [title, setTitle] = useState(`Dar seguimiento a la tarea "${originalTask.title}"`);
    const [selectedProjectId, setSelectedProjectId] = useState(originalTask.projectId);
    const [assignedTo, setAssignedTo] = useState(currentUser.id);
    const [collaborators, setCollaborators] = useState<string[]>([]);
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle(`Dar seguimiento a la tarea "${originalTask.title}"`);
            setSelectedProjectId(originalTask.projectId);
            setAssignedTo(currentUser.id);
            setCollaborators([]);
            setDescription('');
        }
    }, [isOpen, originalTask, currentUser]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreateFollowUpTask({
            title,
            projectId: selectedProjectId,
            assignedTo,
            collaborators,
            description
        });
        onClose();
    };

    const handleCollaboratorToggle = (userId: string) => {
        setCollaborators(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Crear tarea de seguimiento
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <XIcon />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Título */}
                    <VoiceInput
                        value={title}
                        onChange={setTitle}
                        label="Título de la tarea"
                        required
                    />

                    {/* Proyecto */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Proyecto
                        </label>
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                        >
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Responsable */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Responsable
                        </label>
                        <select
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                        >
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Colaboradores */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Colaboradores
                        </label>
                        <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
                            {users.filter(user => user.id !== assignedTo).map(user => (
                                <label key={user.id} className="flex items-center space-x-2 py-1">
                                    <input
                                        type="checkbox"
                                        checked={collaborators.includes(user.id)}
                                        onChange={() => handleCollaboratorToggle(user.id)}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {user.firstName} {user.lastName}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Descripción (opcional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Describe el seguimiento que se debe hacer..."
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                            Crear tarea
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FollowUpTaskModal; 