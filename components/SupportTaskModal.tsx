import React, { useState } from 'react';
import { Task, Priority } from '../types';
import { XIcon } from './icons';
import VoiceInput from './VoiceInput';

interface SupportTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskData: {
        title: string;
        description: string;
        requester: string;
        dueDate: string;
    }) => void;
    currentUser: any;
}

const SupportTaskModal: React.FC<SupportTaskModalProps> = ({
    isOpen,
    onClose,
    onSave,
    currentUser
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [requester, setRequester] = useState('');
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim() || !description.trim() || !requester.trim() || !dueDate) {
            alert('Por favor, completa todos los campos obligatorios.');
            return;
        }

        onSave({
            title: title.trim(),
            description: description.trim(),
            requester: requester.trim(),
            dueDate
        });

        // Limpiar formulario
        setTitle('');
        setDescription('');
        setRequester('');
        setDueDate('');
    };

    const handleCancel = () => {
        setTitle('');
        setDescription('');
        setRequester('');
        setDueDate('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Nueva Tarea de Soporte
                    </h2>
                    <button
                        onClick={handleCancel}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <XIcon />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                                        {/* ¿Qué necesitas? */}
                                    <VoiceInput
                                        value={title}
                                        onChange={setTitle}
                                        placeholder="Describe brevemente lo que necesitas..."
                                        label="¿Qué necesitas? *"
                                        required
                                    />

                                    {/* Descripción */}
                                    <VoiceInput
                                        value={description}
                                        onChange={setDescription}
                                        placeholder="Describe con más detalle tu solicitud..."
                                        label="Descripción de la tarea *"
                                        type="textarea"
                                        rows={4}
                                        required
                                    />

                                    {/* Solicitante */}
                                    <VoiceInput
                                        value={requester}
                                        onChange={setRequester}
                                        placeholder="Tu nombre o el de quien solicita..."
                                        label="Solicitante *"
                                        required
                                    />

                    {/* Fecha límite */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Fecha límite *
                        </label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupportTaskModal; 