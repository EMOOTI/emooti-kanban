import { Team, User, Project, Task } from '../types';

export interface TeamAssignment {
    teamId: string;
    teamName: string;
    memberCount: number;
}

export interface UserAssignment {
    userId: string;
    userName: string;
    isFromTeam?: boolean;
    teamName?: string;
}

/**
 * Obtiene todos los miembros de un equipo (incluyendo el equipo mismo)
 */
export const getTeamMembers = (team: Team): User[] => {
    return team.members;
};

/**
 * Obtiene todos los IDs de miembros de un equipo
 */
export const getTeamMemberIds = (team: Team): string[] => {
    return team.members.map(member => member.id);
};

/**
 * Obtiene todos los miembros de múltiples equipos
 */
export const getMultipleTeamMembers = (teams: Team[]): User[] => {
    const allMembers: User[] = [];
    const memberIds = new Set<string>();
    
    teams.forEach(team => {
        team.members.forEach(member => {
            if (!memberIds.has(member.id)) {
                memberIds.add(member.id);
                allMembers.push(member);
            }
        });
    });
    
    return allMembers;
};

/**
 * Obtiene todos los IDs de miembros de múltiples equipos
 */
export const getMultipleTeamMemberIds = (teams: Team[]): string[] => {
    const memberIds = new Set<string>();
    
    teams.forEach(team => {
        team.members.forEach(member => {
            memberIds.add(member.id);
        });
    });
    
    return Array.from(memberIds);
};

/**
 * Obtiene todos los miembros de un proyecto (usuarios + miembros de equipos)
 */
export const getProjectMembers = (project: Project, teams: Team[]): User[] => {
    const allMembers: User[] = [];
    const memberIds = new Set<string>();
    
    // Agregar usuarios directos
    project.members.forEach(memberId => {
        if (!memberIds.has(memberId)) {
            memberIds.add(memberId);
            // Aquí necesitarías obtener el usuario completo desde el contexto
            // Por ahora solo agregamos el ID
        }
    });
    
    // Agregar miembros de equipos
    project.teams.forEach(teamId => {
        const team = teams.find(t => t.id === teamId);
        if (team) {
            team.members.forEach(member => {
                if (!memberIds.has(member.id)) {
                    memberIds.add(member.id);
                    allMembers.push(member);
                }
            });
        }
    });
    
    return allMembers;
};

/**
 * Obtiene todos los IDs de miembros de un proyecto
 */
export const getProjectMemberIds = (project: Project, teams: Team[]): string[] => {
    const memberIds = new Set<string>();
    
    // Agregar usuarios directos
    project.members.forEach(memberId => {
        memberIds.add(memberId);
    });
    
    // Agregar miembros de equipos
    project.teams.forEach(teamId => {
        const team = teams.find(t => t.id === teamId);
        if (team) {
            team.members.forEach(member => {
                memberIds.add(member.id);
            });
        }
    });
    
    return Array.from(memberIds);
};

/**
 * Obtiene las asignaciones de equipos de un proyecto
 */
export const getProjectTeamAssignments = (project: Project, teams: Team[]): TeamAssignment[] => {
    return project.teams.map(teamId => {
        const team = teams.find(t => t.id === teamId);
        return {
            teamId: teamId,
            teamName: team?.name || 'Equipo desconocido',
            memberCount: team?.members.length || 0
        };
    });
};

/**
 * Obtiene las asignaciones de usuarios de un proyecto
 */
export const getProjectUserAssignments = (project: Project, teams: Team[], users: User[]): UserAssignment[] => {
    const assignments: UserAssignment[] = [];
    const memberIds = new Set<string>();
    
    // Agregar usuarios directos
    project.members.forEach(memberId => {
        const user = users.find(u => u.id === memberId);
        if (user && !memberIds.has(memberId)) {
            memberIds.add(memberId);
            assignments.push({
                userId: memberId,
                userName: `${user.firstName} ${user.lastName}`,
                isFromTeam: false
            });
        }
    });
    
    // Agregar miembros de equipos
    project.teams.forEach(teamId => {
        const team = teams.find(t => t.id === teamId);
        if (team) {
            team.members.forEach(member => {
                if (!memberIds.has(member.id)) {
                    memberIds.add(member.id);
                    assignments.push({
                        userId: member.id,
                        userName: `${member.firstName} ${member.lastName}`,
                        isFromTeam: true,
                        teamName: team.name
                    });
                }
            });
        }
    });
    
    return assignments;
};

/**
 * Obtiene todos los responsables de una tarea (usuario + equipo)
 */
export const getTaskAssignees = (task: Task, teams: Team[], users: User[]): UserAssignment[] => {
    const assignees: UserAssignment[] = [];
    
    // Agregar usuario asignado
    if (task.assignedTo) {
        const user = users.find(u => u.id === task.assignedTo);
        if (user) {
            assignees.push({
                userId: task.assignedTo,
                userName: `${user.firstName} ${user.lastName}`,
                isFromTeam: false
            });
        }
    }
    
    // Agregar equipo asignado
    if (task.assignedTeam) {
        const team = teams.find(t => t.id === task.assignedTeam);
        if (team) {
            team.members.forEach(member => {
                assignees.push({
                    userId: member.id,
                    userName: `${member.firstName} ${member.lastName}`,
                    isFromTeam: true,
                    teamName: team.name
                });
            });
        }
    }
    
    return assignees;
};

/**
 * Obtiene todos los colaboradores de una tarea
 */
export const getTaskCollaborators = (task: Task, teams: Team[], users: User[]): UserAssignment[] => {
    const collaborators: UserAssignment[] = [];
    const memberIds = new Set<string>();
    
    // Agregar colaboradores usuarios
    task.collaborators?.forEach(collaboratorId => {
        const user = users.find(u => u.id === collaboratorId);
        if (user && !memberIds.has(collaboratorId)) {
            memberIds.add(collaboratorId);
            collaborators.push({
                userId: collaboratorId,
                userName: `${user.firstName} ${user.lastName}`,
                isFromTeam: false
            });
        }
    });
    
    // Agregar colaboradores equipos
    task.collaboratorTeams?.forEach(teamId => {
        const team = teams.find(t => t.id === teamId);
        if (team) {
            team.members.forEach(member => {
                if (!memberIds.has(member.id)) {
                    memberIds.add(member.id);
                    collaborators.push({
                        userId: member.id,
                        userName: `${member.firstName} ${member.lastName}`,
                        isFromTeam: true,
                        teamName: team.name
                    });
                }
            });
        }
    });
    
    return collaborators;
};

/**
 * Agrega un equipo a un proyecto
 */
export const addTeamToProject = (project: Project, teamId: string): Project => {
    if (!project.teams.includes(teamId)) {
        return {
            ...project,
            teams: [...project.teams, teamId]
        };
    }
    return project;
};

/**
 * Remueve un equipo de un proyecto
 */
export const removeTeamFromProject = (project: Project, teamId: string): Project => {
    return {
        ...project,
        teams: project.teams.filter(id => id !== teamId)
    };
};

/**
 * Asigna un equipo a una tarea
 */
export const assignTeamToTask = (task: Task, teamId: string): Task => {
    return {
        ...task,
        assignedTeam: teamId,
        assignedTo: undefined // Limpiar asignación de usuario si se asigna equipo
    };
};

/**
 * Agrega un equipo como colaborador de una tarea
 */
export const addTeamAsCollaborator = (task: Task, teamId: string): Task => {
    const currentTeams = task.collaboratorTeams || [];
    if (!currentTeams.includes(teamId)) {
        return {
            ...task,
            collaboratorTeams: [...currentTeams, teamId]
        };
    }
    return task;
};

/**
 * Remueve un equipo de colaboradores de una tarea
 */
export const removeTeamFromCollaborators = (task: Task, teamId: string): Task => {
    return {
        ...task,
        collaboratorTeams: (task.collaboratorTeams || []).filter(id => id !== teamId)
    };
};

/**
 * Verifica si un usuario es miembro de un proyecto (directo o a través de equipos)
 */
export const isUserProjectMember = (userId: string, project: Project, teams: Team[]): boolean => {
    // Verificar si es miembro directo
    if (project.members.includes(userId)) {
        return true;
    }
    
    // Verificar si es miembro a través de equipos
    return project.teams.some(teamId => {
        const team = teams.find(t => t.id === teamId);
        return team?.members.some(member => member.id === userId);
    });
};

/**
 * Verifica si un usuario es responsable de una tarea (directo o a través de equipos)
 */
export const isUserTaskAssignee = (userId: string, task: Task, teams: Team[]): boolean => {
    // Verificar si es asignado directo
    if (task.assignedTo === userId) {
        return true;
    }
    
    // Verificar si es asignado a través de equipo
    if (task.assignedTeam) {
        const team = teams.find(t => t.id === task.assignedTeam);
        return team?.members.some(member => member.id === userId) || false;
    }
    
    return false;
};

/**
 * Verifica si un usuario es colaborador de una tarea (directo o a través de equipos)
 */
export const isUserTaskCollaborator = (userId: string, task: Task, teams: Team[]): boolean => {
    // Verificar si es colaborador directo
    if (task.collaborators?.includes(userId)) {
        return true;
    }
    
    // Verificar si es colaborador a través de equipos
    if (task.collaboratorTeams) {
        return task.collaboratorTeams.some(teamId => {
            const team = teams.find(t => t.id === teamId);
            return team?.members.some(member => member.id === userId);
        });
    }
    
    return false;
}; 