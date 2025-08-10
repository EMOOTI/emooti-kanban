import { useState, useEffect } from 'react';
import { Team, User } from '../types';

export const useTeams = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    // Cargar equipos desde localStorage al inicializar
    useEffect(() => {
        const loadTeams = () => {
            try {
                const savedTeams = localStorage.getItem('emooti_teams');
                if (savedTeams) {
                    const parsedTeams = JSON.parse(savedTeams);
                    setTeams(parsedTeams);
                } else {
                    // Equipos por defecto si no hay ninguno guardado
                    const defaultTeams: Team[] = [
                        { 
                            id: '1', 
                            name: 'Equipo de Desarrollo', 
                            color: '#3B82F6', 
                            members: [], 
                            description: 'Equipo encargado del desarrollo de software' 
                        },
                        { 
                            id: '2', 
                            name: 'Equipo de Marketing', 
                            color: '#10B981', 
                            members: [], 
                            description: 'Equipo de marketing y comunicación' 
                        },
                        { 
                            id: '3', 
                            name: 'Equipo de Diseño', 
                            color: '#F59E0B', 
                            members: [], 
                            description: 'Equipo de diseño y UX/UI' 
                        },
                        { 
                            id: '4', 
                            name: 'Equipo de Ventas', 
                            color: '#EC4899', 
                            members: [], 
                            description: 'Equipo de ventas y atención al cliente' 
                        }
                    ];
                    setTeams(defaultTeams);
                    localStorage.setItem('emooti_teams', JSON.stringify(defaultTeams));
                }
            } catch (error) {
                console.error('Error cargando equipos:', error);
                setTeams([]);
            } finally {
                setLoading(false);
            }
        };

        loadTeams();
    }, []);

    // Guardar equipos en localStorage cuando cambien
    const saveTeams = (newTeams: Team[]) => {
        try {
            console.log('💾 Guardando equipos en localStorage...');
            console.log('📊 Número de equipos a guardar:', newTeams.length);
            
            localStorage.setItem('emooti_teams', JSON.stringify(newTeams));
            setTeams(newTeams);
            
            console.log('✅ Equipos guardados en localStorage exitosamente');
            console.log('📋 Equipos guardados:', newTeams.map(t => ({ name: t.name, members: t.members.length })));
        } catch (error) {
            console.error('❌ Error guardando equipos:', error);
        }
    };

    // Crear un nuevo equipo
    const createTeam = (team: Omit<Team, 'id'>) => {
        const newTeam: Team = {
            ...team,
            id: Date.now().toString()
        };
        const updatedTeams = [...teams, newTeam];
        saveTeams(updatedTeams);
        console.log('Nuevo equipo creado:', newTeam.name, 'ID:', newTeam.id);
        return newTeam;
    };

    // Actualizar un equipo existente
    const updateTeam = (updatedTeam: Team) => {
        console.log('🔄 useTeams: updateTeam llamado');
        console.log('📋 Equipo a actualizar:', updatedTeam.name, 'ID:', updatedTeam.id);
        console.log('👥 Miembros del equipo:', updatedTeam.members.length);
        
        const updatedTeams = teams.map(team => 
            team.id === updatedTeam.id ? updatedTeam : team
        );
        
        console.log('📊 Equipos antes de actualizar:', teams.length);
        console.log('📊 Equipos después de actualizar:', updatedTeams.length);
        
        saveTeams(updatedTeams);
        console.log('✅ Equipo actualizado en useTeams');
    };

    // Eliminar un equipo
    const deleteTeam = (teamId: string) => {
        const updatedTeams = teams.filter(team => team.id !== teamId);
        saveTeams(updatedTeams);
    };

    // Agregar un usuario a un equipo
    const addMemberToTeam = (teamId: string, user: User) => {
        const updatedTeams = teams.map(team => {
            if (team.id === teamId && !team.members.some(m => m.id === user.id)) {
                return {
                    ...team,
                    members: [...team.members, user]
                };
            }
            return team;
        });
        saveTeams(updatedTeams);
    };

    // Remover un usuario de un equipo
    const removeMemberFromTeam = (teamId: string, userId: string) => {
        const updatedTeams = teams.map(team => {
            if (team.id === teamId) {
                return {
                    ...team,
                    members: team.members.filter(m => m.id !== userId)
                };
            }
            return team;
        });
        saveTeams(updatedTeams);
    };

    // Obtener un equipo por ID
    const getTeamById = (teamId: string) => {
        return teams.find(team => team.id === teamId);
    };

    // Obtener equipos de un usuario
    const getTeamsByUser = (userId: string) => {
        return teams.filter(team => team.members.some(member => member.id === userId));
    };

    return {
        teams,
        loading,
        createTeam,
        updateTeam,
        deleteTeam,
        addMemberToTeam,
        removeMemberFromTeam,
        getTeamById,
        getTeamsByUser,
        setTeams: saveTeams
    };
}; 