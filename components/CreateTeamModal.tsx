import React, { useState } from 'react';
import { User } from '../types';
import { useTeams } from '../hooks/useTeams';
import { XMarkIcon } from './icons';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
    isOpen,
    onClose,
    users
}) => {
    const { createTeam } = useTeams();
    const [teamName, setTeamName] = useState('');
    const [teamColor, setTeamColor] = useState('#3B82F6');
    const [teamDescription, setTeamDescription] = useState('');

    const colors = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
        '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ];

    const handleCreateTeam = () => {
        if (!teamName.trim()) return;

        const newTeam = createTeam({
            name: teamName.trim(),
            color: teamColor,
            description: teamDescription.trim(),
            members: [] // Equipo nuevo sin miembros
        });
        
        console.log('Equipo creado:', newTeam.name, 'ID:', newTeam.id, 'Miembros:', newTeam.members.length);
        
        // Limpiar formulario
        setTeamName('');
        setTeamColor('#3B82F6');
        setTeamDescription('');
        
        // Cerrar modal
        onClose();
    };

    console.log('🎯 CreateTeamModal renderizado, isOpen:', isOpen);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: teamColor }}
                        />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            🎯 CREAR EQUIPO NUEVO - Nombre:
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <XMarkIcon />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Team Info */}
                    <div className="mb-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Nombre del Equipo
                                </label>
                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="Nombre del equipo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Color del Equipo
                                </label>
                                <div className="flex gap-2">
                                    {colors.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setTeamColor(color)}
                                            className={`w-8 h-8 rounded-full border-2 ${
                                                teamColor === color ? 'border-gray-400' : 'border-gray-300'
                                            }`}
                                            style={{ backgroundColor: color }}
                                            title={`Color ${color}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    value={teamDescription}
                                    onChange={(e) => setTeamDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    rows={3}
                                    placeholder="Descripción del equipo"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreateTeam}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm w-32 h-9 flex items-center justify-center"
                                >
                                    Crear Equipo
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-2 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTeamModal; 