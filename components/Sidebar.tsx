import React, { useState } from 'react';
import { Project, User, Team, Priority } from '../types';
import UserAvatar from './UserAvatar';
import InviteUserModal from './InviteUserModal';
import CreateUserModal from './CreateUserModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import SendMessageModal from './SendMessageModal';
import VoiceSearchInput from './VoiceSearchInput';
import { useNetlifyAPI } from '../hooks/useVercelAPI';
import { useTeams } from '../hooks/useTeams';
import CreateTeamModal from './CreateTeamModal';
import TeamEditModal from './TeamEditModal';
import CreateMenu from './CreateMenu';
import SupportTaskModal from './SupportTaskModal';
import { db } from '../services/firebase';
import { collection, addDoc, doc, getDoc, Timestamp, query, where, getDocs, writeBatch, arrayUnion } from 'firebase/firestore';
import { 
    PlusIcon, 
    MinusIcon,
    CheckCircleIcon, 
    ChevronRightIcon,
    ChevronLeftIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    SearchIcon,
    HomeIcon,
    InboxIcon,
    ChartBarIcon2,
    BriefcaseIcon,
    TargetIcon,
    UserGroupIcon,
    UsersIcon,
    EnvelopeIcon,
    CogIcon
} from './icons';

interface SidebarProps {
    currentUser: User;
    projects: Project[];
    allProjects: Project[];
    users: User[];
    currentView: string;
    onNavigateToView: (view: string) => void;
    onSelectProject?: (projectId: string) => void;
    onAddProject?: () => void;
    deleteUser?: (userId: string) => void;
    deleteProject?: (projectId: string) => void;
    onEditProject?: (project: Project) => void;
    onAddMembers?: (project: Project) => void;
    onNavigateToSupport?: () => void;
    onSendMessage?: (messageData: {
        toUserId: string;
        subject: string;
        message: string;
        priority: Priority;
    }) => void;
}

const navItems = [
    { key: 'home', icon: <HomeIcon />, label: 'Inicio' },
    { key: 'mytasks', icon: <CheckCircleIcon />, label: 'Mis tareas' },
    { key: 'inbox', icon: <InboxIcon />, label: 'Bandeja de entrada' },
    { key: 'settings', icon: <CogIcon />, label: 'Ajustes' },
];

const Sidebar: React.FC<SidebarProps> = ({
    currentUser,
    projects,
    allProjects,
    users,
    currentView,
    onNavigateToView,
    onSelectProject,
    onAddProject,
    deleteUser,
    deleteProject,
    onEditProject,
    onAddMembers,
    onNavigateToSupport,
    onSendMessage
}) => {
    // Estados para modales
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showTeamSearch, setShowTeamSearch] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [teamSearchTerm, setTeamSearchTerm] = useState('');
    const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
    const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleteTeamModalOpen, setIsDeleteTeamModalOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
    const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [isTeamEditModalOpen, setIsTeamEditModalOpen] = useState(false);
    const [selectedTeamForEdit, setSelectedTeamForEdit] = useState<Team | null>(null);
    const [teamsExpanded, setTeamsExpanded] = useState(false);
    const [analysisExpanded, setAnalysisExpanded] = useState(true);
    const [projectsExpanded, setProjectsExpanded] = useState(false);
    const [usersExpanded, setUsersExpanded] = useState(false);
    const [isSupportTaskModalOpen, setIsSupportTaskModalOpen] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    // Hook para API de Netlify
    const { sendInvitation } = useNetlifyAPI();

    // Función helper para verificar si un proyecto está protegido
    const isProjectProtected = (projectName: string): boolean => {
        const protectedProjects = ['Soporte', 'Compras'];
        return protectedProjects.includes(projectName);
    };

    // Función para manejar el hover de tooltips con posicionamiento dinámico
    const handleTooltipHover = (event: React.MouseEvent, tooltipText: string) => {
        if (isMinimized) {
            const rect = event.currentTarget.getBoundingClientRect();
            setTooltipPosition({ x: rect.right + 8, y: rect.top + rect.height / 2 });
            setTooltip(tooltipText);
        }
    };

    // Tooltip
    const [tooltip, setTooltip] = useState<string | null>(null);

    // Hook para gestionar equipos con persistencia
    const { 
        teams, 
        createTeam, 
        updateTeam, 
        deleteTeam, 
        addMemberToTeam, 
        removeMemberFromTeam 
    } = useTeams();

    // Filtrar usuarios basado en el término de búsqueda
    const filteredUsers = users.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return fullName.includes(userSearchTerm.toLowerCase());
    });

    // Filtrar equipos basado en el término de búsqueda
    const filteredTeams = teams.filter(team => {
        return team.name.toLowerCase().includes(teamSearchTerm.toLowerCase());
    });

    // Función para enviar invitación por email usando Vercel API
    const handleInviteToProject = async (email: string, projectIds: string[]): Promise<{ success: boolean; userExists: boolean; message: string }> => {
        try {
            console.log('🔧 Sidebar - handleInviteToProject ejecutándose');
            console.log('📧 Email recibido:', email);
            console.log('📋 ProjectIds recibidos:', projectIds);
            console.log('👥 Usuarios disponibles:', users.length);
            
            // Buscar si el usuario existe
            const existingUser = users.find(user => user.email === email);
            console.log('🔍 Usuario existente encontrado:', existingUser ? 'Sí' : 'No');
            
            if (existingUser) {
                // Usuario existe, asignarlo directamente a los proyectos
                console.log('✅ Usuario existe, asignando a los proyectos:', existingUser.id);
                
                try {
                    // Crear un batch para actualizar todos los proyectos
                    const batch = writeBatch(db);
                    
                    // Agregar el usuario a cada proyecto seleccionado
                    projectIds.forEach(projectId => {
                        const projectRef = doc(db, 'projects', projectId);
                        batch.update(projectRef, { 
                            members: arrayUnion(existingUser.id) 
                        });
                    });
                    
                    // Ejecutar el batch
                    await batch.commit();
                    console.log('✅ Usuario agregado exitosamente a los proyectos');
                    
                    const result = {
                        success: true,
                        userExists: true,
                        message: `Usuario agregado a ${projectIds.length} proyecto${projectIds.length > 1 ? 's' : ''}`
                    };
                    console.log('✅ Sidebar - Resultado (usuario existente):', result);
                    return result;
                } catch (error) {
                    console.error('❌ Error agregando usuario a proyectos:', error);
                    throw new Error('Error al agregar usuario a los proyectos');
                }
            } else {
                // Usuario no existe, enviar invitación por email
                console.log('📤 Usuario no existe, enviando invitación:', email);
                
                try {
                    // Usar la función sendInvitation del hook
                    const apiResult = await sendInvitation(email);
                    
                    if (apiResult.success) {
                        console.log('✅ Invitación enviada exitosamente');
                        
                        const result = {
                            success: true,
                            userExists: false,
                            message: `Invitación enviada al usuario para ${projectIds.length} proyecto${projectIds.length > 1 ? 's' : ''}`
                        };
                        console.log('✅ Sidebar - Resultado (nuevo usuario):', result);
                        return result;
                    } else {
                        console.error('❌ Error en API de invitación:', apiResult.error);
                        throw new Error(apiResult.error || 'Error al enviar la invitación');
                    }
                } catch (apiError) {
                    console.error('❌ Error llamando a la API de invitación:', apiError);
                    throw new Error('Error al enviar la invitación por email');
                }
            }
        } catch (error) {
            console.error('❌ Sidebar - Error invitando usuario:', error);
            
            const result = {
                success: false,
                userExists: false,
                message: error instanceof Error ? error.message : 'Error al procesar la invitación'
            };
            console.log('❌ Sidebar - Resultado de error:', result);
            return result;
        }
    };

    const handleSendMessage = async (messageData: {
        toUserId: string;
        subject: string;
        message: string;
        priority: Priority;
    }) => {
        try {
            console.log('Enviando mensaje:', messageData);
            
            // Obtener información del usuario destinatario
            const recipientUser = users.find(user => user.id === messageData.toUserId);
            if (!recipientUser) {
                throw new Error('Usuario destinatario no encontrado');
            }

            // Crear el mensaje en Firestore
            const messageRef = collection(db, 'messages');
            const newMessage = {
                fromUserId: currentUser.id,
                fromUserName: `${currentUser.firstName} ${currentUser.lastName}`,
                toUserId: messageData.toUserId,
                toUserName: `${recipientUser.firstName} ${recipientUser.lastName}`,
                subject: messageData.subject,
                message: messageData.message,
                priority: messageData.priority,
                createdAt: Timestamp.now(),
                read: false
            };

            await addDoc(messageRef, newMessage);
            console.log('Mensaje enviado exitosamente');
            
            // Cerrar el modal
            setIsContactModalOpen(false);
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            alert('Error al enviar el mensaje. Por favor, inténtalo de nuevo.');
        }
    };

    const handleCreateTeam = () => {
        console.log('🔄 handleCreateTeam llamado - abriendo CreateTeamModal');
        setIsCreateTeamModalOpen(true);
    };

    const handleEditTeam = (team: Team) => {
        setSelectedTeamForEdit(team);
        setIsTeamEditModalOpen(true);
    };

    const handleUpdateTeam = (updatedTeam: Team) => {
        console.log('🔄 Sidebar: handleUpdateTeam llamado');
        console.log('📋 Equipo a actualizar:', updatedTeam.name);
        console.log('👥 Miembros del equipo:', updatedTeam.members.length);
        console.log('🆔 ID del equipo:', updatedTeam.id);
        
        try {
            updateTeam(updatedTeam);
            console.log('✅ Equipo actualizado exitosamente');
        } catch (error) {
            console.error('❌ Error al actualizar equipo:', error);
        }
    };

    const handleDeleteTeam = (teamId: string) => {
        deleteTeam(teamId);
    };

    const handleEditUser = (user: User) => {
        setSelectedUserForEdit(user);
        setIsEditUserModalOpen(true);
    };

    const handleDeleteUser = (user: User) => {
        setUserToDelete(user);
        setIsDeleteUserModalOpen(true);
    };

    const handleDeleteTeamModal = (team: Team) => {
        setTeamToDelete(team);
        setIsDeleteTeamModalOpen(true);
    };

    const handleDeleteProject = (project: Project) => {
        // Verificar restricciones especiales para proyectos críticos
        if (isProjectProtected(project.name)) {
            alert("No se puede eliminar el proyecto '" + project.name + "'. Solo un administrador puede eliminar este tipo de proyectos.");
            return;
        }
        
        setProjectToDelete(project);
        setIsDeleteProjectModalOpen(true);
    };

    const confirmDeleteUser = () => {
        if (userToDelete && deleteUser) {
            console.log('Eliminando usuario:', userToDelete.firstName, userToDelete.lastName);
            deleteUser(userToDelete.id);
        }
    };

    const confirmDeleteTeam = () => {
        if (teamToDelete) {
            deleteTeam(teamToDelete.id);
        }
    };

    const confirmDeleteProject = () => {
        if (projectToDelete && deleteProject) {
            console.log('Eliminando proyecto:', projectToDelete.name);
            deleteProject(projectToDelete.id);
        }
    };

    const handleCreateSupportTask = async (taskData: {
        title: string;
        description: string;
        requester: string;
        dueDate: string;
    }) => {
        try {
            // Buscar el proyecto "Soporte"
            const supportProject = projects.find(p => p.name === 'Soporte');
            if (!supportProject) {
                alert('No se encontró el proyecto "Soporte". Por favor, créalo primero.');
                return;
            }

            // Buscar o crear la columna "Backlog"
            let backlogColumnId = 'backlog'; // ID por defecto
            
            // Buscar la columna Backlog en el proyecto
            const columnsQuery = query(
                collection(db, 'columns'),
                where('projectId', '==', supportProject.id),
                where('title', '==', 'Backlog')
            );
            
            const columnsSnapshot = await getDocs(columnsQuery);
            
            if (!columnsSnapshot.empty) {
                // La columna Backlog ya existe
                backlogColumnId = columnsSnapshot.docs[0].id;
                console.log('✅ Columna Backlog encontrada con ID:', backlogColumnId);
            } else {
                // Crear la columna Backlog si no existe
                const newColumnData = {
                    projectId: supportProject.id,
                    title: 'Backlog',
                    order: 0,
                    color: '#3B82F6' // Color azul por defecto
                };
                
                const columnRef = await addDoc(collection(db, 'columns'), newColumnData);
                backlogColumnId = columnRef.id;
                console.log('✅ Columna Backlog creada con ID:', backlogColumnId);
            }

            // Crear la nueva tarea en Firestore
            const newTaskData = {
                projectId: supportProject.id,
                status: backlogColumnId, // En Firestore se usa 'status' en lugar de 'columnId'
                title: taskData.title,
                description: taskData.description,
                priority: Priority.Medium,
                assignedTo: currentUser.id, // Responsable (usuario actual)
                collaborators: [taskData.requester], // Solicitante como colaborador
                startDate: new Date().toISOString().split('T')[0], // Fecha de creación
                dueDate: taskData.dueDate,
                createdBy: currentUser.id,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                order: 0,
                collaboratorTeams: [] // Inicializar collaboratorTeams
            };

            // Guardar la tarea en Firestore
            const taskRef = await addDoc(collection(db, 'tasks'), newTaskData);
            
            console.log('✅ Tarea de soporte creada exitosamente con ID:', taskRef.id);
            alert('Tarea de soporte creada exitosamente en el proyecto "Soporte" en la columna "Backlog".');
            
            // Cerrar el modal
            setIsSupportTaskModalOpen(false);

        } catch (error) {
            console.error('Error al crear tarea de soporte:', error);
            alert('Error al crear la tarea de soporte. Por favor, inténtalo de nuevo.');
        }
    };

    return (
        <div className={`hidden md:flex flex-col bg-gray-800 text-white transition-all duration-300 ${isMinimized ? 'w-24' : 'w-64'} ${isMinimized ? 'overflow-hidden' : 'overflow-y-auto'}`}> 
                            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <h2 className={`text-2xl font-bold transition-all duration-300 ${isMinimized ? 'hidden' : 'block'}`}>emootiTasks</h2>
                    {/* Botón minimizar/expandir */}
                    <button
                        className="ml-2 p-1 rounded hover:bg-gray-700 hidden md:block"
                        onClick={() => setIsMinimized(m => !m)}
                        title={isMinimized ? 'Expandir menú' : 'Minimizar menú'}
                    >
                        {isMinimized ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    </button>
                </div>

            <nav className="flex-1 p-4 space-y-6">
                {/* Navegación principal */}
                <div className="space-y-2">
                    {navItems.map(item => (
                        <div key={item.key} className="relative group">
                            <button
                                onClick={() => {
                                    console.log('Sidebar: Click en', item.key);
                                    onNavigateToView(item.key);
                                }}
                                className={`w-full flex items-center px-3 py-2 rounded text-left transition-all duration-200 ${
                                    currentView === item.key
                                        ? 'bg-gray-700 text-white'
                                        : 'text-gray-300 hover:bg-gray-700'
                                } ${isMinimized ? 'justify-center' : ''}`}
                                onMouseEnter={(e) => isMinimized && handleTooltipHover(e, item.label)}
                                onMouseLeave={() => setTooltip(null)}
                            >
                                <div className={`${isMinimized ? 'w-5 h-5' : ''} flex items-center justify-center`}>
                                    {React.cloneElement(item.icon, { className: isMinimized ? 'w-5 h-5' : 'w-5 h-5' })}
                                </div>
                                <span className={`ml-3 transition-all duration-200 ${isMinimized ? 'hidden' : 'inline'}`}>{item.label}</span>
                            </button>
                            {/* Tooltip */}
                            {isMinimized && tooltip === item.label && (
                                <div 
                                    className="fixed bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap z-[9999]"
                                    style={{ 
                                        left: tooltipPosition.x, 
                                        top: tooltipPosition.y - 10,
                                        transform: 'translateY(-50%)'
                                    }}
                                >
                                    {item.label}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Análisis de datos */}
                <div>
                    <div className={`flex items-center justify-between px-3 py-2 text-gray-300 ${isMinimized ? 'justify-center' : ''}`}>
                        {!isMinimized && (
                            <>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => console.log('Crear análisis')}
                                        className="text-blue-400 hover:text-blue-300 transition-colors mr-2"
                                        title="Crear análisis"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                    </button>
                                    <span className="font-medium">Análisis de datos</span>
                                </div>
                                <button
                                    onClick={() => setAnalysisExpanded(!analysisExpanded)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    title={analysisExpanded ? "Contraer análisis" : "Expandir análisis"}
                                >
                                    {analysisExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                </button>
                            </>
                        )}
                    </div>
                    {analysisExpanded && (
                        <div className={`ml-4 space-y-1 ${isMinimized ? 'ml-0 flex flex-col items-center' : ''}`}> 
                            <div className="relative group">
                                <button 
                                    onClick={() => onNavigateToView('reports')}
                                    className={`w-full flex items-center px-3 py-1 text-left transition-colors duration-200 ${
                                        currentView === 'reports' 
                                            ? 'text-white bg-gray-700 rounded' 
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                    onMouseEnter={(e) => handleTooltipHover(e, 'Reportes')}
                                    onMouseLeave={() => setTooltip(null)}
                                >
                                    <div className={`${isMinimized ? 'w-5 h-5' : ''} flex items-center justify-center`}>
                                        <ChartBarIcon2 />
                                    </div>
                                    <span className={`ml-2 ${isMinimized ? 'hidden' : 'inline'}`}>Reportes</span>
                                </button>
                                {isMinimized && tooltip === 'Reportes' && (
                                    <div 
                                        className="fixed bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap z-[9999]"
                                        style={{ 
                                            left: tooltipPosition.x, 
                                            top: tooltipPosition.y - 10,
                                            transform: 'translateY(-50%)'
                                        }}
                                    >
                                        Reportes
                                    </div>
                                )}
                            </div>
                            <div className="relative group">
                                <button 
                                    className="w-full flex items-center px-3 py-1 text-gray-400 hover:text-white text-left"
                                    onMouseEnter={(e) => handleTooltipHover(e, 'Portafolios')}
                                    onMouseLeave={() => setTooltip(null)}
                                >
                                    <div className={`${isMinimized ? 'w-5 h-5' : ''} flex items-center justify-center`}>
                                        <BriefcaseIcon />
                                    </div>
                                    <span className={`ml-2 ${isMinimized ? 'hidden' : 'inline'}`}>Portafolios</span>
                                </button>
                                {isMinimized && tooltip === 'Portafolios' && (
                                    <div 
                                        className="fixed bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap z-[9999]"
                                        style={{ 
                                            left: tooltipPosition.x, 
                                            top: tooltipPosition.y - 10,
                                            transform: 'translateY(-50%)'
                                        }}
                                    >
                                        Portafolios
                                    </div>
                                )}
                            </div>
                            <div className="relative group">
                                <button 
                                    className="w-full flex items-center px-3 py-1 text-gray-400 hover:text-white text-left"
                                    onMouseEnter={(e) => handleTooltipHover(e, 'Objetivos')}
                                    onMouseLeave={() => setTooltip(null)}
                                >
                                    <div className={`${isMinimized ? 'w-5 h-5' : ''} flex items-center justify-center`}>
                                        <TargetIcon />
                                    </div>
                                    <span className={`ml-2 ${isMinimized ? 'hidden' : 'inline'}`}>Objetivos</span>
                                </button>
                                {isMinimized && tooltip === 'Objetivos' && (
                                    <div 
                                        className="fixed bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap z-[9999]"
                                        style={{ 
                                            left: tooltipPosition.x, 
                                            top: tooltipPosition.y - 10,
                                            transform: 'translateY(-50%)'
                                        }}
                                    >
                                        Objetivos
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Proyectos */}
                <div>
                    <div className={`flex items-center justify-between px-3 py-2 text-gray-300 ${isMinimized ? 'justify-center' : ''}`}>
                        {!isMinimized ? (
                            <>
                                <div className="flex items-center">
                                    <button
                                        onClick={onAddProject}
                                        className="text-blue-400 hover:text-blue-300 transition-colors mr-2"
                                        title="Crear proyecto"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => onNavigateToView('projects')}
                                        className="font-medium hover:text-white transition-colors"
                                        title="Ver todos los proyectos"
                                    >
                                        Proyectos
                                    </button>
                                </div>
                                <button
                                    onClick={() => setProjectsExpanded(!projectsExpanded)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    title={projectsExpanded ? "Contraer proyectos" : "Expandir proyectos"}
                                >
                                    {projectsExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center justify-between w-full">
                                <button
                                    onClick={() => setProjectsExpanded(!projectsExpanded)}
                                    className="text-gray-300 hover:text-white transition-colors"
                                    onMouseEnter={(e) => isMinimized && handleTooltipHover(e, 'Proyectos')}
                                    onMouseLeave={() => setTooltip(null)}
                                >
                                    <BriefcaseIcon />
                                </button>
                                <button
                                    onClick={() => setProjectsExpanded(!projectsExpanded)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    onMouseEnter={(e) => isMinimized && handleTooltipHover(e, projectsExpanded ? 'Contraer proyectos' : 'Expandir proyectos')}
                                    onMouseLeave={() => setTooltip(null)}
                                >
                                    {projectsExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                </button>
                            </div>
                        )}
                                                        {isMinimized && tooltip === 'Proyectos' && (
                                    <div 
                                        className="fixed bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap z-[9999]"
                                        style={{ 
                                            left: tooltipPosition.x, 
                                            top: tooltipPosition.y - 10,
                                            transform: 'translateY(-50%)'
                                        }}
                                    >
                                        Proyectos
                                    </div>
                                )}
                                                        {isMinimized && (tooltip === 'Expandir proyectos' || tooltip === 'Contraer proyectos') && (
                                    <div 
                                        className="fixed bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap z-[9999]"
                                        style={{ 
                                            left: tooltipPosition.x, 
                                            top: tooltipPosition.y - 10,
                                            transform: 'translateY(-50%)'
                                        }}
                                    >
                                        {tooltip}
                                    </div>
                                )}
                    </div>
                    {projectsExpanded && (
                        <div className={`ml-4 space-y-1 ${isMinimized ? 'ml-0 flex flex-col items-center' : ''}`}>
                        {projects.slice(0, 8).map(project => {
                            // Generar siglas del proyecto (primeras letras de cada palabra)
                            const projectInitials = project.name
                                .split(' ')
                                .map(word => word.charAt(0).toUpperCase())
                                .join('')
                                .slice(0, 2); // Máximo 2 letras
                            
                            // Verificar si el proyecto está protegido
                            const isProtected = isProjectProtected(project.name);
                            
                            return (
                                <div key={project.id} className="relative group">
                                    <div className="flex items-center justify-between">
                                        <button 
                                            onClick={() => onSelectProject?.(project.id)}
                                            className="flex-1 flex items-center px-3 py-1 text-gray-400 hover:text-white text-left"
                                            onMouseEnter={(e) => isMinimized && handleTooltipHover(e, project.name)}
                                            onMouseLeave={() => setTooltip(null)}
                                        >
                                            {isMinimized ? (
                                                <div className="w-5 h-5 flex items-center justify-center">
                                                    <div 
                                                        className="w-5 h-5 rounded-full flex items-center justify-center"
                                                        style={{ backgroundColor: project.color || '#6366f1' }}
                                                    >
                                                        <span className="text-xs font-medium text-white">
                                                            {projectInitials}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div 
                                                    className="w-3 h-3 rounded-full mr-2"
                                                    style={{ backgroundColor: project.color || '#6366f1' }}
                                                />
                                            )}
                                            <span className={`truncate ${isMinimized ? 'hidden' : 'inline'}`}>{project.name}</span>
                                        </button>
                                        {!isProtected && (
                                            <button
                                                onClick={() => handleDeleteProject(project)}
                                                className="text-red-400 hover:text-red-300 transition-colors ml-2 opacity-0 group-hover:opacity-100"
                                                title="Eliminar proyecto"
                                            >
                                                <MinusIcon />
                                            </button>
                                        )}
                                        {isProtected && isMinimized && (
                                            <div className="w-7 h-5 flex items-center justify-center opacity-0">
                                                {/* Espacio invisible para mantener alineación */}
                                            </div>
                                        )}
                                    </div>
                                    {/* Tooltip para proyectos */}
                                    {isMinimized && tooltip === project.name && (
                                        <div 
                                            className="fixed bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap z-[9999]"
                                            style={{ 
                                                left: tooltipPosition.x, 
                                                top: tooltipPosition.y - 10,
                                                transform: 'translateY(-50%)'
                                            }}
                                        >
                                            {project.name}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    )}
                </div>

                {/* Equipos */}
                <div>
                    <div className={`flex items-center justify-between px-3 py-2 text-gray-300 ${isMinimized ? 'justify-center' : ''}`}>
                        {!isMinimized ? (
                            <>
                                <div className="flex items-center">
                                    <button
                                        onClick={handleCreateTeam}
                                        className="text-blue-400 hover:text-blue-300 transition-colors mr-2"
                                        title="Crear equipo"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                    </button>
                                    <span className="font-medium">Equipos</span>
                                </div>
                                <button
                                    onClick={() => setTeamsExpanded(!teamsExpanded)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    title={teamsExpanded ? "Contraer equipos" : "Expandir equipos"}
                                >
                                    {teamsExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center justify-between w-full">
                                <button
                                    onClick={() => setTeamsExpanded(!teamsExpanded)}
                                    className="text-gray-300 hover:text-white transition-colors"
                                    onMouseEnter={(e) => isMinimized && handleTooltipHover(e, 'Equipos')}
                                    onMouseLeave={() => setTooltip(null)}
                                >
                                    <UserGroupIcon />
                                </button>
                                <button
                                    onClick={() => setTeamsExpanded(!teamsExpanded)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    onMouseEnter={(e) => isMinimized && handleTooltipHover(e, teamsExpanded ? 'Contraer equipos' : 'Expandir equipos')}
                                    onMouseLeave={() => setTooltip(null)}
                                >
                                    {teamsExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                </button>
                            </div>
                        )}
                                                        {isMinimized && tooltip === 'Equipos' && (
                                    <div 
                                        className="fixed bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap z-[9999]"
                                        style={{ 
                                            left: tooltipPosition.x, 
                                            top: tooltipPosition.y - 10,
                                            transform: 'translateY(-50%)'
                                        }}
                                    >
                                        Equipos
                                    </div>
                                )}
                                                        {isMinimized && (tooltip === 'Expandir equipos' || tooltip === 'Contraer equipos') && (
                                    <div 
                                        className="fixed bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap z-[9999]"
                                        style={{ 
                                            left: tooltipPosition.x, 
                                            top: tooltipPosition.y - 10,
                                            transform: 'translateY(-50%)'
                                        }}
                                    >
                                        {tooltip}
                                    </div>
                                )}
                    </div>
                    
                    {/* Campo de búsqueda de equipos */}
                    {!isMinimized && teamsExpanded && (
                        <VoiceSearchInput
                            value={teamSearchTerm}
                            onChange={setTeamSearchTerm}
                            placeholder="Buscar equipos"
                            className="w-full px-3 py-1 bg-gray-700 text-white rounded border-none focus:ring-2 focus:ring-blue-500 mb-2"
                        />
                    )}

                    {teamsExpanded && (
                        <div className={`ml-4 space-y-1 ${isMinimized ? 'ml-0 flex flex-col items-center' : ''}`}>
                            {/* Lista de equipos */}
                            {filteredTeams.map(team => (
                                <div key={team.id} className="relative group">
                                    <div className="flex items-center justify-between">
                                        <button 
                                            onClick={() => handleEditTeam(team)}
                                            className="flex-1 flex items-center px-3 py-1 text-gray-400 hover:text-white text-left"
                                            onMouseEnter={(e) => isMinimized && handleTooltipHover(e, team.name)}
                                            onMouseLeave={() => setTooltip(null)}
                                        >
                                            <div className="w-5 h-5 flex items-center justify-center">
                                                <svg 
                                                    className="w-5 h-5" 
                                                    fill="none" 
                                                    viewBox="0 0 24 24" 
                                                    stroke="currentColor"
                                                    style={{ color: team.color }}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                                </svg>
                                            </div>
                                            <span className={`ml-2 ${isMinimized ? 'hidden' : 'inline'}`}>{team.name}</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTeamModal(team)}
                                            className="text-red-400 hover:text-red-300 transition-colors ml-2 opacity-0 group-hover:opacity-100"
                                            title="Eliminar equipo"
                                        >
                                            <MinusIcon />
                                        </button>
                                    </div>
                                    {isMinimized && tooltip === team.name && (
                                        <div 
                                            className="fixed bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap z-[9999]"
                                            style={{ 
                                                left: tooltipPosition.x, 
                                                top: tooltipPosition.y - 10,
                                                transform: 'translateY(-50%)'
                                            }}
                                        >
                                            {team.name}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    

                    
                    {/* Caja de búsqueda desplegable cuando está minimizado */}
                    {isMinimized && showTeamSearch && (
                        <div className="absolute left-full top-0 ml-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-2 z-50">
                            <VoiceSearchInput
                                value=""
                                onChange={() => {}}
                                placeholder="Buscar equipos..."
                                className="w-48 px-3 py-1 bg-gray-700 text-white text-sm rounded border-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                </div>

                {/* Usuarios */}
                <div>
                    <div className={`flex items-center justify-between px-3 py-2 text-gray-300 ${isMinimized ? 'justify-center' : ''}`}>
                        {!isMinimized ? (
                            <>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => setIsCreateUserModalOpen(true)}
                                        className="text-blue-400 hover:text-blue-300 transition-colors mr-2"
                                        title="Crear usuario"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                    </button>
                                    <span className="font-medium">Usuarios</span>
                                </div>
                                <button
                                    onClick={() => setUsersExpanded(!usersExpanded)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    title={usersExpanded ? "Contraer usuarios" : "Expandir usuarios"}
                                >
                                    {usersExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center justify-between w-full">
                                <button
                                    onClick={() => setUsersExpanded(!usersExpanded)}
                                    className="text-gray-300 hover:text-white transition-colors"
                                    onMouseEnter={(e) => isMinimized && handleTooltipHover(e, 'Usuarios')}
                                    onMouseLeave={() => setTooltip(null)}
                                >
                                    <UsersIcon />
                                </button>
                                <button
                                    onClick={() => setUsersExpanded(!usersExpanded)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    onMouseEnter={(e) => isMinimized && handleTooltipHover(e, usersExpanded ? 'Contraer usuarios' : 'Expandir usuarios')}
                                    onMouseLeave={() => setTooltip(null)}
                                >
                                    {usersExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                </button>
                            </div>
                        )}
                                                        {isMinimized && tooltip === 'Usuarios' && (
                                    <div 
                                        className="fixed bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap z-[9999]"
                                        style={{ 
                                            left: tooltipPosition.x, 
                                            top: tooltipPosition.y - 10,
                                            transform: 'translateY(-50%)'
                                        }}
                                    >
                                        Usuarios
                                    </div>
                                )}
                                                        {isMinimized && (tooltip === 'Expandir usuarios' || tooltip === 'Contraer usuarios') && (
                                    <div 
                                        className="fixed bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap z-[9999]"
                                        style={{ 
                                            left: tooltipPosition.x, 
                                            top: tooltipPosition.y - 10,
                                            transform: 'translateY(-50%)'
                                        }}
                                    >
                                        {tooltip}
                                    </div>
                                )}
                    </div>
                    
                    {/* Campo de búsqueda de usuarios */}
                    {!isMinimized && usersExpanded && (
                        <VoiceSearchInput
                            value={userSearchTerm}
                            onChange={setUserSearchTerm}
                            placeholder="Buscar usuarios"
                            className="w-full px-3 py-1 bg-gray-700 text-white rounded border-none focus:ring-2 focus:ring-blue-500 mb-2"
                        />
                    )}

                    {usersExpanded && (
                        <div className={`ml-4 space-y-1 ${isMinimized ? 'ml-0 flex flex-col items-center' : ''}`}>
                        {filteredUsers.map(user => (
                            <div key={user.id} className="relative group">
                                <div className="flex items-center justify-between">
                                    <button 
                                        onClick={() => handleEditUser(user)}
                                        className="flex-1 flex items-center px-3 py-1 text-gray-400 hover:text-white text-left"
                                        onMouseEnter={(e) => isMinimized && handleTooltipHover(e, `${user.firstName} ${user.lastName}`)}
                                        onMouseLeave={() => setTooltip(null)}
                                    >
                                        <div className={`${isMinimized ? 'w-5 h-5' : 'w-6 h-6'} flex items-center justify-center`}>
                                            <UserAvatar user={user} size="sm" showTooltip={false} className={isMinimized ? 'w-5 h-5' : ''} />
                                        </div>
                                        <span className={`ml-2 ${isMinimized ? 'hidden' : 'inline'}`}>
                                            {user.firstName} {user.lastName}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(user)}
                                        className="text-red-400 hover:text-red-300 transition-colors ml-2 opacity-0 group-hover:opacity-100"
                                        title="Eliminar usuario"
                                    >
                                        <MinusIcon />
                                    </button>
                                </div>
                                {isMinimized && tooltip === `${user.firstName} ${user.lastName}` && (
                                    <div 
                                        className="fixed bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap z-[9999]"
                                        style={{ 
                                            left: tooltipPosition.x, 
                                            top: tooltipPosition.y - 10,
                                            transform: 'translateY(-50%)'
                                        }}
                                    >
                                        {user.firstName} {user.lastName}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    )}
                </div>

            </nav>

            {/* Botones inferiores */}
            <div className="p-4 space-y-2">
                <button 
                    onClick={() => setIsContactModalOpen(true)}
                    className={`w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-xs font-medium flex items-center justify-center relative group`}
                    onMouseEnter={() => isMinimized && setTooltip('Contactar')}
                    onMouseLeave={() => setTooltip(null)}
                >
                    <EnvelopeIcon />
                    <span className={`ml-2 ${isMinimized ? 'hidden' : 'inline'}`}>Contactar</span>
                    {isMinimized && tooltip === 'Contactar' && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap z-50">
                            Contactar
                        </div>
                    )}
                </button>
                <button 
                    onClick={() => setIsSupportTaskModalOpen(true)}
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-xs font-medium flex items-center justify-center relative group`}
                    onMouseEnter={() => isMinimized && setTooltip('Soporte')}
                    onMouseLeave={() => setTooltip(null)}
                >
                    <CogIcon />
                    <span className={`ml-2 ${isMinimized ? 'hidden' : 'inline'}`}>Soporte</span>
                                    {isMinimized && tooltip === 'Soporte' && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap z-[9999]">
                        Soporte
                    </div>
                )}
                </button>
                <button 
                    onClick={() => setIsInviteModalOpen(true)}
                    className={`w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-xs font-medium flex items-center justify-center relative group`}
                    onMouseEnter={() => isMinimized && setTooltip('Invitar')}
                    onMouseLeave={() => setTooltip(null)}
                >
                    <SearchIcon />
                    <span className={`ml-2 ${isMinimized ? 'hidden' : 'inline'}`}>Invitar</span>
                    {isMinimized && (
                        <div className="w-7 h-5 flex items-center justify-center opacity-0 ml-2">
                            {/* Espacio invisible para mantener alineación */}
                        </div>
                    )}
                    {isMinimized && tooltip === 'Invitar' && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg whitespace-nowrap z-50">
                            Invitar
                        </div>
                    )}
                </button>
            </div>

            {/* Modal de mensajes */}
                            <SendMessageModal
                    isOpen={isContactModalOpen}
                    onClose={() => setIsContactModalOpen(false)}
                    users={users}
                    currentUser={currentUser}
                    onSendMessage={onSendMessage || handleSendMessage}
                />

            {/* Modal de soporte */}
            {isSupportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Soporte Técnico
                            </h2>
                            <button
                                onClick={() => setIsSupportModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                                    <CogIcon />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    ¿Necesitas ayuda?
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mb-6">
                                    Nuestro equipo de soporte está aquí para ayudarte
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex-shrink-0">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                                                        <p className="text-xs font-medium text-gray-900 dark:text-white">Email de soporte</p>
                                <p className="text-xs text-gray-600 dark:text-gray-300">soporte@emooti.com</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex-shrink-0">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                                                        <p className="text-xs font-medium text-gray-900 dark:text-white">Chat en vivo</p>
                                <p className="text-xs text-gray-600 dark:text-gray-300">Disponible 24/7</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex-shrink-0">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                                                        <p className="text-xs font-medium text-gray-900 dark:text-white">Documentación</p>
                                <p className="text-xs text-gray-600 dark:text-gray-300">Guías y tutoriales</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    onClick={() => setIsSupportModalOpen(false)}
                                    className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={() => {
                                        window.open('mailto:soporte@emooti.com', '_blank');
                                        setIsSupportModalOpen(false);
                                    }}
                                    className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                >
                                    Contactar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de invitación */}
            <InviteUserModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                projects={projects}
                users={users}
                onInviteToProject={handleInviteToProject}
            />

            {/* Modal de creación de usuarios */}
            <CreateUserModal
                isOpen={isCreateUserModalOpen}
                currentUser={currentUser}
                allProjects={allProjects}
                onClose={() => setIsCreateUserModalOpen(false)}
            />

            {/* Modal de edición de usuarios */}
            <CreateUserModal
                isOpen={isEditUserModalOpen}
                currentUser={currentUser}
                allProjects={allProjects}
                userToEdit={selectedUserForEdit}
                onClose={() => {
                    setIsEditUserModalOpen(false);
                    setSelectedUserForEdit(null);
                }}
            />

            {/* Modal de creación de equipos */}
            <CreateTeamModal
                isOpen={isCreateTeamModalOpen}
                onClose={() => setIsCreateTeamModalOpen(false)}
                users={users}
            />

            {/* Modal de edición de equipos */}
            <TeamEditModal
                isOpen={isTeamEditModalOpen}
                onClose={() => setIsTeamEditModalOpen(false)}
                team={selectedTeamForEdit}
                users={users}
                onUpdateTeam={handleUpdateTeam}
                onDeleteTeam={handleDeleteTeam}
            />

            {/* Modal de confirmación para eliminar usuario */}
            <ConfirmDeleteModal
                isOpen={isDeleteUserModalOpen}
                onClose={() => {
                    setIsDeleteUserModalOpen(false);
                    setUserToDelete(null);
                }}
                onConfirm={confirmDeleteUser}
                title="Eliminar Usuario"
                message="¿Estás seguro de que deseas eliminar el usuario"
                itemName={userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : ''}
            />

            {/* Modal de confirmación para eliminar equipo */}
            <ConfirmDeleteModal
                isOpen={isDeleteTeamModalOpen}
                onClose={() => {
                    setIsDeleteTeamModalOpen(false);
                    setTeamToDelete(null);
                }}
                onConfirm={confirmDeleteTeam}
                title="Eliminar Equipo"
                message="¿Estás seguro de que deseas eliminar el equipo"
                itemName={teamToDelete ? teamToDelete.name : ''}
            />

            {/* Modal de confirmación para eliminar proyecto */}
            <ConfirmDeleteModal
                isOpen={isDeleteProjectModalOpen}
                onClose={() => {
                    setIsDeleteProjectModalOpen(false);
                    setProjectToDelete(null);
                }}
                onConfirm={confirmDeleteProject}
                title="Eliminar Proyecto"
                message="¿Estás seguro de que deseas eliminar el proyecto"
                itemName={projectToDelete ? projectToDelete.name : ''}
            />

            {/* Modal de tarea de soporte */}
            <SupportTaskModal
                isOpen={isSupportTaskModalOpen}
                onClose={() => setIsSupportTaskModalOpen(false)}
                onSave={handleCreateSupportTask}
                currentUser={currentUser}
            />
        </div>
    );
};

export default Sidebar; 