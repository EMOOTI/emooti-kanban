import React, { useState, useRef, useEffect } from 'react';
import { User, Team } from '../types';
import { 
    XMarkIcon, 
    PencilIcon, 
    TrashIcon,
    UserPlusIcon,
    UserMinusIcon,
    ChevronDownIcon
} from './icons';

interface TeamEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    team: Team | null;
    users: User[];
    onUpdateTeam: (team: Team) => void;
    onDeleteTeam: (teamId: string) => void;
}

const TeamEditModal: React.FC<TeamEditModalProps> = ({
    isOpen,
    onClose,
    team,
    users,
    onUpdateTeam,
    onDeleteTeam
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [teamName, setTeamName] = useState(team?.name || '');
    const [teamColor, setTeamColor] = useState(team?.color || '#3B82F6');
    const [teamDescription, setTeamDescription] = useState(team?.description || '');
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const colors = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
        '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ];

    // Cerrar desplegable cuando se hace clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowUserDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtrar usuarios disponibles
    const availableUsers = users.filter(user => 
        !team?.members.some(member => member.id === user.id) &&
        (user.firstName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
         user.lastName.toLowerCase().includes(userSearchTerm.toLowerCase()))
    );

    const handleSave = () => {
        if (!team || !teamName.trim()) return;

        const updatedTeam: Team = {
            ...team,
            name: teamName.trim(),
            color: teamColor,
            description: teamDescription.trim()
        };

        onUpdateTeam(updatedTeam);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTeamName(team?.name || '');
        setTeamColor(team?.color || '#3B82F6');
        setTeamDescription(team?.description || '');
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (!team) return;
        
        if (confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
            onDeleteTeam(team.id);
            onClose();
        }
    };

    const handleAddMember = (userId: string) => {
        if (!team) return;

        const user = users.find(u => u.id === userId);
        if (!user || team.members.some(m => m.id === userId)) return;

        console.log('Agregando usuario al equipo:', user.firstName, user.lastName);
        
        const updatedTeam: Team = {
            ...team,
            members: [...team.members, user]
        };

        onUpdateTeam(updatedTeam);
    };

    const handleRemoveMember = (userId: string) => {
        if (!team) {
            console.log('❌ No hay equipo seleccionado');
            return;
        }

        const member = team.members.find(m => m.id === userId);
        if (!member) {
            console.log('❌ No se encontró el miembro con ID:', userId);
            return;
        }

        console.log('🗑️ Eliminando usuario del equipo:', member.firstName, member.lastName, 'ID:', userId);
        console.log('📊 Miembros antes de eliminar:', team.members.length);

        const updatedTeam: Team = {
            ...team,
            members: team.members.filter(m => m.id !== userId)
        };

        console.log('📊 Miembros después de eliminar:', updatedTeam.members.length);
        console.log('✅ Llamando a onUpdateTeam con:', updatedTeam);

        onUpdateTeam(updatedTeam);
    };

    if (!isOpen || !team) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: team.color }}
                        />
                        {isEditing ? (
                            <input
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
                            />
                        ) : (
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {team.name}
                            </h2>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <button
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded"
                                title="Añadir miembros"
                            >
                                <UserPlusIcon />
                            </button>
                        )}
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                title="Editar equipo"
                            >
                                <PencilIcon />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <XMarkIcon />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Team Info */}
                    <div className="mb-6">
                        {isEditing ? (
                            <div className="space-y-4">
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
                                        onClick={handleSave}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm w-32 h-9 flex items-center justify-center"
                                    >
                                        Guardar Cambios
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="px-2 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {team.description && (
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        {team.description}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Members Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Miembros del Equipo</h3>
                            <span className="text-sm text-gray-500">{team.members.length} miembros</span>
                        </div>

                        {/* Dropdown para seleccionar usuarios */}
                        {showUserDropdown && (
                            <div ref={dropdownRef} className="relative">
                                <div className="border border-gray-300 rounded-lg shadow-lg bg-white">
                                    <div className="p-3 border-b border-gray-200">
                                        <input
                                            type="text"
                                            placeholder="Buscar usuarios..."
                                            value={userSearchTerm}
                                            onChange={(e) => setUserSearchTerm(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {availableUsers.length > 0 ? (
                                            availableUsers.map(user => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => {
                                                        handleAddMember(user.id);
                                                        setShowUserDropdown(false);
                                                        setUserSearchTerm('');
                                                    }}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                                >
                                                    <img
                                                        src={user.avatarUrl}
                                                        alt={user.firstName}
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                    <span className="text-left">{user.firstName} {user.lastName}</span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-gray-500">
                                                {userSearchTerm ? 'No se encontraron usuarios' : 'No hay usuarios disponibles'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Lista de miembros del equipo */}
                        <div className="space-y-2">
                            {team.members.length > 0 ? (
                                team.members.map(member => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={member.avatarUrl}
                                                alt={member.firstName}
                                                className="w-8 h-8 rounded-full"
                                            />
                                            <span>{member.firstName} {member.lastName}</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Eliminar del equipo"
                                        >
                                            <UserMinusIcon />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                    <UserPlusIcon />
                                    <p className="mt-2">No hay miembros en este equipo</p>
                                    <p className="text-sm">Haz clic en el botón verde de arriba para agregar miembros</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Delete Team Button */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={handleDelete}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center gap-2 text-sm h-9"
                        >
                            <TrashIcon />
                            Eliminar Equipo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamEditModal; 