import React, { useState } from 'react';
import { Project, User, Id } from '../types';
import { XIcon } from './icons';

interface AddMembersModalProps {
    project: Project;
    allUsers: User[];
    onClose: () => void;
    onAddMembers: (projectId: string, memberIds: string[]) => void;
}

const AddMembersModal: React.FC<AddMembersModalProps> = ({ project, allUsers, onClose, onAddMembers }) => {
    const [selectedUserIds, setSelectedUserIds] = useState<Set<Id>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    // Filtrar usuarios que no son miembros del proyecto
    const availableUsers = allUsers.filter(user => !project.members.includes(user.id));
    
    // Filtrar usuarios por término de búsqueda
    const filteredUsers = availableUsers.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUserToggle = (userId: Id) => {
        setSelectedUserIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedUserIds.size === filteredUsers.length) {
            setSelectedUserIds(new Set());
        } else {
            setSelectedUserIds(new Set(filteredUsers.map(user => user.id)));
        }
    };

    const handleSubmit = () => {
        if (selectedUserIds.size > 0) {
            onAddMembers(project.id, Array.from(selectedUserIds));
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-light-border dark:border-dark-border">
                    <h2 className="text-xl font-bold">Añadir Miembros al Proyecto</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XIcon />
                    </button>
                </div>
                
                <div className="p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                            Actualmente tiene {project.members.length} miembros
                        </p>
                    </div>

                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                                Usuarios Disponibles ({filteredUsers.length})
                            </label>
                            {filteredUsers.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="text-xs text-primary hover:text-primary-hover underline"
                                >
                                    {selectedUserIds.size === filteredUsers.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                </button>
                            )}
                        </div>
                        
                        <input
                            type="text"
                            placeholder="Buscar usuarios..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary mb-3"
                        />

                        <div className="max-h-60 overflow-y-auto border rounded-lg bg-gray-50 dark:bg-gray-800">
                            {filteredUsers.length > 0 ? (
                                <div className="space-y-1 p-2">
                                    {filteredUsers.map(user => (
                                        <label key={user.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedUserIds.has(user.id)}
                                                onChange={() => handleUserToggle(user.id)}
                                                className="h-4 w-4 rounded text-primary focus:ring-primary"
                                            />
                                            <img src={user.avatarUrl} alt={user.firstName} className="w-8 h-8 rounded-full" />
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">
                                                    {user.firstName} {user.lastName}
                                                </div>
                                                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                                    {user.email} • {user.role}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-light-text-secondary dark:text-dark-text-secondary py-8">
                                    <p className="text-sm">
                                        {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios disponibles para añadir'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedUserIds.size > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-sm text-blue-600 dark:text-blue-400 mb-2 font-medium">
                                Usuarios seleccionados ({selectedUserIds.size}):
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {allUsers
                                    .filter(user => selectedUserIds.has(user.id))
                                    .map(user => (
                                        <span
                                            key={user.id}
                                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                                        >
                                            <img src={user.avatarUrl} alt={user.firstName} className="w-4 h-4 rounded-full mr-1" />
                                            {user.firstName} {user.lastName}
                                        </span>
                                    ))
                                }
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end p-4 bg-gray-50 dark:bg-dark-card-darker border-t border-light-border dark:border-dark-border rounded-b-lg">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 mr-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-dark-text font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={selectedUserIds.size === 0}
                        className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Añadir {selectedUserIds.size > 0 ? `(${selectedUserIds.size})` : ''} Miembros
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddMembersModal; 