import React, { useState } from 'react';
import { Team } from '../types';
import { ChevronDownIcon, ChevronUpIcon, UserGroupIcon } from './icons';

interface TeamSelectorProps {
    teams: Team[];
    selectedTeams: string[];
    onTeamsChange: (teamIds: string[]) => void;
    placeholder?: string;
    maxSelections?: number;
    disabled?: boolean;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
    teams,
    selectedTeams,
    onTeamsChange,
    placeholder = "Seleccionar equipos...",
    maxSelections,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleTeamToggle = (teamId: string) => {
        if (disabled) return;
        
        const isSelected = selectedTeams.includes(teamId);
        let newSelection: string[];
        
        if (isSelected) {
            newSelection = selectedTeams.filter(id => id !== teamId);
        } else {
            if (maxSelections && selectedTeams.length >= maxSelections) {
                return; // No permitir más selecciones
            }
            newSelection = [...selectedTeams, teamId];
        }
        
        onTeamsChange(newSelection);
    };

    const getSelectedTeamsDisplay = () => {
        if (selectedTeams.length === 0) {
            return placeholder;
        }
        
        const selectedTeamNames = selectedTeams.map(teamId => {
            const team = teams.find(t => t.id === teamId);
            return team?.name || 'Equipo desconocido';
        });
        
        if (selectedTeamNames.length <= 2) {
            return selectedTeamNames.join(', ');
        }
        
        return `${selectedTeamNames.length} equipos seleccionados`;
    };

    const removeTeam = (teamId: string) => {
        if (disabled) return;
        onTeamsChange(selectedTeams.filter(id => id !== teamId));
    };

    return (
        <div className="relative">
            {/* Selector principal */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`w-full px-3 py-2 text-left border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        disabled 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <UserGroupIcon className="w-4 h-4 text-gray-400" />
                            <span className={selectedTeams.length === 0 ? 'text-gray-500' : ''}>
                                {getSelectedTeamsDisplay()}
                            </span>
                        </div>
                        {!disabled && (
                            <div className="text-gray-400">
                                {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                            </div>
                        )}
                    </div>
                </button>
            </div>

            {/* Equipos seleccionados como tags */}
            {selectedTeams.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {selectedTeams.map(teamId => {
                        const team = teams.find(t => t.id === teamId);
                        if (!team) return null;
                        
                        return (
                            <span
                                key={teamId}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            >
                                <div 
                                    className="w-2 h-2 rounded-full mr-1"
                                    style={{ backgroundColor: team.color }}
                                />
                                {team.name}
                                {!disabled && (
                                    <button
                                        type="button"
                                        onClick={() => removeTeam(teamId)}
                                        className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                    >
                                        ×
                                    </button>
                                )}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Dropdown de equipos */}
            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="py-1">
                        {teams.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                No hay equipos disponibles
                            </div>
                        ) : (
                            teams.map(team => {
                                const isSelected = selectedTeams.includes(team.id);
                                const isDisabled = maxSelections && selectedTeams.length >= maxSelections && !isSelected;
                                
                                return (
                                    <button
                                        key={team.id}
                                        type="button"
                                        onClick={() => handleTeamToggle(team.id)}
                                        disabled={isDisabled}
                                        className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                            isSelected 
                                                ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100' 
                                                : 'text-gray-900 dark:text-white'
                                        } ${
                                            isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <div 
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: team.color }}
                                                />
                                                <span className="font-medium">{team.name}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    ({team.members.length} miembros)
                                                </span>
                                            </div>
                                            {isSelected && (
                                                <div className="text-blue-600 dark:text-blue-400">
                                                    ✓
                                                </div>
                                            )}
                                        </div>
                                        {team.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-5">
                                                {team.description}
                                            </p>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamSelector; 