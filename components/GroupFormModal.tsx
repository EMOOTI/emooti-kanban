import React, { useState, useEffect } from 'react';
import { Group, User, Id } from '../types';
import { XIcon } from './icons';

interface GroupFormModalProps {
    groupToEdit?: Group | null;
    allUsers: User[];
    onClose: () => void;
    onSave: (group: Group | Omit<Group, 'id'>) => void;
}

const GroupFormModal: React.FC<GroupFormModalProps> = ({ groupToEdit, allUsers, onClose, onSave }) => {
    const isEditing = !!groupToEdit;
    
    const [formData, setFormData] = useState({
        name: '',
        avatarUrl: `https://picsum.photos/seed/${Date.now()}/200`,
        memberIds: [] as Id[],
    });
    
    useEffect(() => {
        if (isEditing && groupToEdit) {
            setFormData({
                name: groupToEdit.name,
                avatarUrl: groupToEdit.avatarUrl,
                memberIds: groupToEdit.memberIds,
            });
        }
    }, [groupToEdit, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMemberToggle = (userId: Id) => {
        setFormData(prev =>
            prev.memberIds.includes(userId)
                ? { ...prev, memberIds: prev.memberIds.filter(id => id !== userId) }
                : { ...prev, memberIds: [...prev.memberIds, userId] }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        if (isEditing && groupToEdit) {
            onSave({ ...groupToEdit, ...formData });
        } else {
            onSave(formData);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-light-border dark:border-dark-border">
                    <h2 className="text-xl font-bold">{isEditing ? 'Editar Grupo' : 'Crear Nuevo Grupo'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="flex items-center space-x-4">
                            <img src={formData.avatarUrl || `https://picsum.photos/seed/${formData.name}/200`} alt="Avatar" className="w-16 h-16 rounded-full object-cover bg-gray-200" />
                            <div className="flex-1">
                                <label htmlFor="groupName" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Nombre del Grupo</label>
                                <input type="text" name="name" id="groupName" value={formData.name} onChange={handleChange} required className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="groupAvatar" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">URL del Avatar</label>
                            <input type="url" name="avatarUrl" id="groupAvatar" value={formData.avatarUrl} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary" placeholder="https://ejemplo.com/imagen.png"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Miembros del Grupo</label>
                            <div className="max-h-40 overflow-y-auto p-2 border rounded-lg bg-gray-100 dark:bg-gray-800 border-light-border dark:border-dark-border">
                                {allUsers.map(user => (
                                    <label key={user.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.memberIds.includes(user.id)}
                                            onChange={() => handleMemberToggle(user.id)}
                                            className="h-4 w-4 rounded text-primary focus:ring-primary"
                                        />
                                        <img src={user.avatarUrl} alt={user.firstName} className="h-8 w-8 rounded-full" />
                                        <span>{user.firstName} {user.lastName}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end p-4 bg-gray-50 dark:bg-dark-card-darker border-t border-light-border dark:border-dark-border rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-2 py-1 mr-2 bg-gray-200 dark:bg-gray-700 dark:text-dark-text text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 text-sm">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition-colors duration-200 text-sm w-32 h-9 flex items-center justify-center">
                            {isEditing ? 'Guardar Cambios' : 'Crear Grupo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GroupFormModal;