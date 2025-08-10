import React, { useState, useEffect } from 'react';
import { User, Priority } from '../types';
import { XIcon } from './icons';
import VoiceInput from './VoiceInput';

interface SendMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    currentUser: User;
    onSendMessage: (messageData: {
        toUserId: string;
        subject: string;
        message: string;
        priority: Priority;
    }) => void;
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({
    isOpen,
    onClose,
    users,
    currentUser,
    onSendMessage
}) => {
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState<Priority>(Priority.Medium);

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setSelectedUser('');
            setSubject('');
            setMessage('');
            setPriority(Priority.Medium);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedUser || !subject || !message) {
            alert('Por favor completa los campos obligatorios');
            return;
        }

        onSendMessage({
            toUserId: selectedUser,
            subject,
            message,
            priority
        });
        
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Enviar Mensaje
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <XIcon />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Destinatario */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Destinatario *
                        </label>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 text-black dark:text-white"
                            required
                        >
                            <option value="">Selecciona un usuario</option>
                            {users.filter(user => user.id !== currentUser.id).map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Asunto */}
                    <VoiceInput
                        value={subject}
                        onChange={setSubject}
                        placeholder="Asunto del mensaje..."
                        label="Asunto *"
                        required
                    />

                    {/* Mensaje */}
                    <VoiceInput
                        value={message}
                        onChange={setMessage}
                        placeholder="Escribe tu mensaje aquí..."
                        label="Mensaje *"
                        type="textarea"
                        rows={6}
                        required
                    />

                    {/* Prioridad */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Prioridad
                        </label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as Priority)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 text-black dark:text-white"
                        >
                            <option value={Priority.Low}>Baja</option>
                            <option value={Priority.Medium}>Media</option>
                            <option value={Priority.High}>Alta</option>
                            <option value={Priority.Urgent}>Urgente</option>
                        </select>
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
                            Enviar Mensaje
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SendMessageModal; 