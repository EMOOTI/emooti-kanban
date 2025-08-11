
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db, auth } from './services/firebase';
import { collection, doc, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, Timestamp, writeBatch, setDoc, getDoc, getDocs, arrayUnion } from 'firebase/firestore';

import { View, Task, Subtask, User, Id, Project, Column, Priority, UserRole, Notification, Activity, Group, ActivityUser } from './types';
import { AIService } from './services/aiService';
import { ColorService } from './services/colorService';
import { useTheme } from './hooks/useTheme';
import { useTeams } from './hooks/useTeams';
import { notificationService as pushNotificationService } from './services/notificationService';
import Header from './components/Header';
import BoardView from './components/BoardView';
import TimelineView from './components/TimelineView';
import SettingsView from './components/SettingsView';
import UsersView from './components/UsersView';
import ProjectsView from './components/ProjectsView';
import DashboardView from './components/DashboardView';
import HomeDashboardView from './components/HomeDashboardView';
import MyTasksView from './components/MyTasksView';
import SupportView from './components/SupportView';
import InboxView from './components/InboxView';
import VoiceTest from './components/VoiceTest';
import ReportsView from './components/ReportsView';
import AddMembersModal from './components/AddMembersModal';
import TaskDetailsModal from './components/TaskDetailsModal';
import FollowUpTaskModal from './components/FollowUpTaskModal';
import UserFormModal from './components/UserFormModal';
import ProjectFormModal from './components/ProjectFormModal';
import LoginView from './components/LoginView';
import ColorPickerModal from './components/ColorPickerModal';
import ColumnFormModal from './components/ColumnFormModal';
import GroupFormModal from './components/GroupFormModal';
import ConfirmModal from './components/ConfirmModal';
import ProjectSettingsModal from './components/ProjectSettingsModal';
import * as notificationService from './services/notificationService';
import { MenuIcon, XIcon, BoardIcon, TimelineIcon, UsersIcon, SettingsIcon, ArrowLeftIcon, DashboardIcon, HomeIcon, CheckCircleIcon } from './components/icons';
import Sidebar from './components/Sidebar';
import ProjectHeader from './components/ProjectHeader';

interface ConfirmationState {
    title: string;
    message: React.ReactNode;
    confirmText: string;
    onConfirm: () => void;
    isDestructive?: boolean;
}

const App: React.FC = () => {
    const { theme } = useTheme();
    
    // Firestore-driven State
    const [users, setUsers] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [columns, setColumns] = useState<Column[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const { teams } = useTeams();
    
    // Local UI & Notification State
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
    
    // Session & Navigation State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [currentProjectId, setCurrentProjectId] = useState<Id | null>(null);
    const [view, setView] = useState<View>('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Modal State
    const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);
    const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [projectForColorChange, setProjectForColorChange] = useState<Project | null>(null);
    const [taskForColorChange, setTaskForColorChange] = useState<Task | null>(null);
    const [columnToEdit, setColumnToEdit] = useState<Column | null>(null);
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isProjectSettingsModalOpen, setIsProjectSettingsModalOpen] = useState(false);
    const [projectForAddMembers, setProjectForAddMembers] = useState<Project | null>(null);
    const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);
    const [isFollowUpTaskModalOpen, setIsFollowUpTaskModalOpen] = useState(false);
    const [taskForFollowUp, setTaskForFollowUp] = useState<Task | null>(null);
    const [isSupportView, setIsSupportView] = useState(false);

    // --- Firebase Auth Listener ---
    useEffect(() => {
        let profileUnsubscribe: (() => void) | undefined;
        let userLoadTimeout: NodeJS.Timeout;
        
        const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            // Limpiar listeners anteriores
            if (profileUnsubscribe) {
                profileUnsubscribe();
                profileUnsubscribe = undefined;
            }
            if (userLoadTimeout) {
                clearTimeout(userLoadTimeout);
            }
    
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
    
                profileUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
                    if (userLoadTimeout) {
                        clearTimeout(userLoadTimeout);
                    }
                    
                    if (docSnap.exists()) {
                        setCurrentUser({ id: docSnap.id, ...docSnap.data() } as User);
                        setIsLoadingAuth(false);
                    } else {
                        if (process.env.NODE_ENV === 'development') {
                            console.log(`Waiting for user document (${firebaseUser.uid}) to be created...`);
                        }
                        // Set a timeout to handle cases where the document is never created (e.g., failed write due to security rules)
                        userLoadTimeout = setTimeout(() => {
                            if (process.env.NODE_ENV === 'development') {
                                console.error("User document creation timed out. This may be due to Firestore security rules. Signing out.");
                            }
                            auth.signOut();
                        }, 8000);
                    }
                }, (error) => {
                    if (process.env.NODE_ENV === 'development') {
                        console.error("Error fetching user profile:", error);
                    }
                    auth.signOut();
                });
            } else {
                setCurrentUser(null);
                setProjects([]);
                setTasks([]);
                setColumns([]);
                setCurrentProjectId(null);
                setIsLoadingAuth(false);
            }
        });
    
        return () => {
            authUnsubscribe();
            if (profileUnsubscribe) {
                profileUnsubscribe();
            }
            if (userLoadTimeout) {
                clearTimeout(userLoadTimeout);
            }
        };
    }, []);

    // Initialize push notifications
    useEffect(() => {
        const initNotifications = async () => {
            if (currentUser) {
                const enabled = await pushNotificationService.initialize();
                setPushNotificationsEnabled(enabled);
                
                if (enabled) {
                    console.log('✅ Notificaciones push habilitadas');
                }
            }
        };

        initNotifications();
    }, [currentUser]);
    
    // --- Firestore Listeners ---
    useEffect(() => {
        if (!currentUser) return;
        
        const unsubscribers: (() => void)[] = [];
        
        // Listen for all users
        const usersQuery = query(collection(db, "users"));
        const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(usersData);
        });
        unsubscribers.push(unsubUsers);

        // Listen for projects where the current user is a member
        const projectsQuery = query(collection(db, 'projects'), where('members', 'array-contains', currentUser.id));
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Consultando proyectos para usuario:', currentUser.id);
        }
        
        const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
            if (process.env.NODE_ENV === 'development') {
                console.log('📊 Snapshot de proyectos recibido:', snapshot.docs.length, 'documentos');
            }
            
            const projectsData = snapshot.docs.map(doc => {
                const data = doc.data();
                if (process.env.NODE_ENV === 'development') {
                    console.log('📄 Datos del proyecto:', { id: doc.id, name: data.name, members: data.members });
                }
                
                // Manejar createdAt que puede ser Timestamp o string
                let createdAt = data.createdAt;
                if (createdAt && typeof createdAt.toDate === 'function') {
                    createdAt = createdAt.toDate().toISOString();
                } else if (typeof createdAt === 'string') {
                    createdAt = createdAt;
                } else {
                    createdAt = new Date().toISOString();
                }
                
                return {
                    id: doc.id,
                    ...data,
                    teams: data.teams || [], // Inicializar teams si no existe
                    createdAt: createdAt,
                } as Project;
            });
            
            if (process.env.NODE_ENV === 'development') {
                console.log('📋 Proyectos cargados:', projectsData.map(p => ({ id: p.id, name: p.name, members: p.members })));
            }
            setProjects(projectsData);
        });
        unsubscribers.push(unsubProjects);

        // Listen for columns of the current project
        if (currentProjectId) {
            const columnsQuery = query(collection(db, 'columns'), where('projectId', '==', currentProjectId));
            const unsubColumns = onSnapshot(columnsQuery, (snapshot) => {
                const columnsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Column));
                setColumns(columnsData.sort((a, b) => a.order - b.order));
            });
            unsubscribers.push(unsubColumns);

            // Listen for tasks of the current project
            const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', currentProjectId));
            const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
                const tasksData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    
                    // Manejar createdAt y updatedAt que pueden ser Timestamp o string
                    let createdAt = data.createdAt;
                    let updatedAt = data.updatedAt;
                    
                    if (createdAt && typeof createdAt.toDate === 'function') {
                        createdAt = createdAt.toDate().toISOString();
                    } else if (typeof createdAt === 'string') {
                        createdAt = createdAt;
                    } else {
                        createdAt = new Date().toISOString();
                    }
                    
                    if (updatedAt && typeof updatedAt.toDate === 'function') {
                        updatedAt = updatedAt.toDate().toISOString();
                    } else if (typeof updatedAt === 'string') {
                        updatedAt = updatedAt;
                    } else {
                        updatedAt = new Date().toISOString();
                    }
                    
                    return {
                        id: doc.id,
                        ...data,
                        columnId: data.status, // Map Firestore's 'status' to app's 'columnId'
                        createdAt: createdAt,
                        updatedAt: updatedAt,
                        subtasks: data.subtasks || [],
                        collaborators: data.collaborators || [],
                        collaboratorTeams: data.collaboratorTeams || [],
                    } as Task;
                });
                
                if (process.env.NODE_ENV === 'development') {
                    console.log('Tareas cargadas desde Firestore:', tasksData);
                }
                setTasks(tasksData.sort((a, b) => a.order - b.order));
            });
            unsubscribers.push(unsubTasks);
        } else {
            // Si no hay proyecto seleccionado, limpiar tareas y columnas
            setTasks([]);
            setColumns([]);
        }

        // Listen for groups
        const groupsQuery = query(collection(db, 'groups'));
        const unsubGroups = onSnapshot(groupsQuery, (snapshot) => {
            const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
            setGroups(groupsData);
        });
        unsubscribers.push(unsubGroups);

        // Listen for notifications for the current user
        const notificationsQuery = query(collection(db, 'notifications'), where('userId', '==', currentUser.id));
        const unsubNotifications = onSnapshot(notificationsQuery, (snapshot) => {
            const notificationsData = snapshot.docs.map(doc => {
                const data = doc.data();
                let timestamp = data.timestamp;
                if (timestamp && typeof timestamp.toDate === 'function') {
                    timestamp = timestamp.toDate().toISOString();
                }
                return { id: doc.id, ...data, timestamp } as Notification;
            });
            setNotifications(notificationsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        });
        unsubscribers.push(unsubNotifications);

        // Listen for activities
        const activitiesQuery = query(collection(db, 'activities'));
        const unsubActivities = onSnapshot(activitiesQuery, (snapshot) => {
            const activitiesData = snapshot.docs.map(doc => {
                const data = doc.data();
                let timestamp = data.timestamp;
                if (timestamp && typeof timestamp.toDate === 'function') {
                    timestamp = timestamp.toDate().toISOString();
                }
                return { id: doc.id, ...data, timestamp } as Activity;
            });
            setActivities(activitiesData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        });
        unsubscribers.push(unsubActivities);

        // Cleanup function
        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [currentUser, currentProjectId]);


    // --- Activity & Notification Logging (Local) ---
    const logActivity = useCallback((action: string, projectId: Id, entityTitle: string) => {
        if (!currentUser) return;
        const userSnapshot: ActivityUser = {
            id: currentUser.id,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            avatarUrl: currentUser.avatarUrl,
        };
        const newActivity: Activity = {
            id: `act-${Date.now()}`,
            user: userSnapshot,
            projectId,
            action,
            entityTitle,
            timestamp: new Date().toISOString()
        };
        setActivities(prev => [newActivity, ...prev].slice(0, 100)); // Keep last 100 activities
    }, [currentUser]);
    
    const createNotification = useCallback((userId: Id, message: string, link?: string) => {
        const newNotification: Notification = {
            id: `notif-${Date.now()}`,
            userId,
            message,
            link,
            read: false,
            timestamp: new Date().toISOString()
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    // --- Authentication ---
    const handleLogout = () => {
        auth.signOut();
    };

    // --- Project Management (Firestore) ---
    const handleSelectProject = async (projectId: Id) => {
        setCurrentProjectId(projectId);
        
        // Cargar configuración guardada del proyecto
        try {
            const projectSettingsRef = doc(db, 'projectSettings', projectId);
            const settingsDoc = await getDoc(projectSettingsRef);
            
            if (settingsDoc.exists()) {
                const settings = settingsDoc.data();
                console.log('📋 Configuración del proyecto cargada:', settings);
                setView(settings.defaultView || 'dashboard');
            } else {
                // Si no hay configuración guardada, usar dashboard por defecto
                setView('dashboard');
            }
        } catch (error) {
            console.error('❌ Error al cargar configuración del proyecto:', error);
            setView('dashboard');
        }
    }
    const handleGoToProjects = () => setCurrentProjectId(null);

    const handleAddOrUpdateProject = useCallback(async (projectData: Project | Omit<Project, 'id' | 'createdAt' | 'status' | 'ownerId'>) => {
        if (!currentUser) {
            console.error('❌ No hay usuario actual');
            return;
        }
        
        console.log('🔧 handleAddOrUpdateProject llamado con:', projectData);
        console.log('👤 Usuario actual ID:', currentUser.id);
        
        if ('id' in projectData) {
            // Updating
            console.log('🔄 Actualizando proyecto existente:', projectData.id);
            const projectDoc = doc(db, 'projects', projectData.id);
            await updateDoc(projectDoc, { ...projectData });
            logActivity('actualizó el proyecto', projectData.id, projectData.name);
        } else {
            // Creating
            console.log('👤 Usuario actual:', currentUser);
            const membersArray = [...(projectData.members || []), currentUser.id];
            console.log('👥 Array de miembros a guardar:', membersArray);
            
            // Asignar color automáticamente si no se proporciona uno
            const existingColors = projects.map(p => p.color).filter((color): color is string => !!color);
            const projectColor = projectData.color || ColorService.getNextAvailableColor(existingColors);
            
            const newProject = {
                ...projectData,
                ownerId: currentUser.id,
                members: membersArray, // Agregar al usuario actual como miembro
                createdAt: Timestamp.now(),
                status: 'activo',
                teams: projectData.teams || [], // Inicializar teams si no existe
                color: projectColor // Asignar color automáticamente
            };
            console.log('💾 Guardando proyecto en Firestore:', newProject);
            
            try {
                const projectRef = await addDoc(collection(db, 'projects'), newProject);
                console.log('✅ Proyecto creado exitosamente:', { 
                    id: projectRef.id, 
                    name: newProject.name, 
                    members: newProject.members,
                    ownerId: newProject.ownerId 
                });
                logActivity('creó el proyecto', projectRef.id, newProject.name);
            } catch (error) {
                console.error('❌ Error al crear proyecto:', error);
                alert('Error al crear el proyecto. Por favor, intenta de nuevo.');
                return;
            }
        }
        setIsProjectModalOpen(false);
        setProjectToEdit(null);
    }, [currentUser, logActivity]);
    
    const handleDeleteProject = (projectId: Id) => {
        if (currentUser?.role !== UserRole.Admin) {
            alert("No tienes permiso para eliminar proyectos.");
            return;
        }
        const projectToDelete = projects.find(p => p.id === projectId);
        if (!projectToDelete) return;

        setConfirmation({
            title: `Eliminar Proyecto: "${projectToDelete.name}"`,
            message: <p>¿Estás seguro? Esta acción es irreversible y eliminará todas las tareas y columnas asociadas.</p>,
            confirmText: 'Sí, eliminar proyecto',
            onConfirm: async () => {
                logActivity('eliminó el proyecto', projectToDelete.id, projectToDelete.name);
                const batch = writeBatch(db);
                // Delete project, its tasks, and its columns
                batch.delete(doc(db, 'projects', projectId));
                tasks.filter(t => t.projectId === projectId).forEach(t => batch.delete(doc(db, 'tasks', t.id)));
                columns.filter(c => c.projectId === projectId).forEach(c => batch.delete(doc(db, 'columns', c.id)));
                await batch.commit();
                if(currentProjectId === projectId) handleGoToProjects();
            },
            isDestructive: true,
        });
    };
    
    const handleUpdateProjectColor = async (projectId: Id, color: string) => {
        await updateDoc(doc(db, 'projects', projectId), { color });
        setProjectForColorChange(null);
    };

    // Función para asignar colores a proyectos existentes que no tienen color
    const assignColorsToExistingProjects = async () => {
        if (!currentUser) return;
        
        try {
            console.log('🎨 Asignando colores a proyectos existentes...');
            
            // Obtener todos los proyectos del usuario
            const userProjects = projects.filter(p => p.members.includes(currentUser.id));
            const projectsWithoutColor = userProjects.filter(p => !p.color);
            
            if (projectsWithoutColor.length === 0) {
                console.log('✅ Todos los proyectos ya tienen color asignado');
                return;
            }
            
            console.log(`🎨 Encontrados ${projectsWithoutColor.length} proyectos sin color`);
            
            // Obtener colores existentes
            const existingColors = userProjects
                .filter(p => p.color)
                .map(p => p.color)
                .filter((color): color is string => !!color);
            
            // Asignar colores a proyectos sin color
            const batch = writeBatch(db);
            
            projectsWithoutColor.forEach(project => {
                const projectColor = ColorService.getNextAvailableColor(existingColors);
                existingColors.push(projectColor);
                
                const projectRef = doc(db, 'projects', project.id);
                batch.update(projectRef, { color: projectColor });
                
                console.log(`🎨 Asignando color ${projectColor} al proyecto: ${project.name}`);
            });
            
            await batch.commit();
            console.log('✅ Colores asignados exitosamente a todos los proyectos');
            
        } catch (error) {
            console.error('❌ Error al asignar colores a proyectos:', error);
        }
    };

    // Efecto para asignar colores a proyectos existentes cuando se cargan los proyectos
    useEffect(() => {
        if (currentUser && projects.length > 0) {
            // Verificar si hay proyectos sin color
            const projectsWithoutColor = projects.filter(p => !p.color);
            if (projectsWithoutColor.length > 0) {
                console.log(`🎨 Encontrados ${projectsWithoutColor.length} proyectos sin color, asignando colores...`);
                assignColorsToExistingProjects();
            }
        }
    }, [currentUser, projects]);

    // --- Column Management (Firestore) ---
    const handleAddOrUpdateColumn = async (columnData: Omit<Column, 'id' | 'projectId' | 'order'> | Column) => {
        if (!currentProjectId) return;
        if ('id' in columnData) {
            const {id, ...dataToUpdate} = columnData;
            await updateDoc(doc(db, 'columns', id), dataToUpdate);
            logActivity('actualizó la columna', currentProjectId, columnData.title);
        } else {
            const order = columns.filter(c => c.projectId === currentProjectId).length;
            const newColumn = { ...columnData, projectId: currentProjectId, order };
            const colRef = await addDoc(collection(db, 'columns'), newColumn);
            logActivity('creó la columna', currentProjectId, newColumn.title);
        }
        setIsColumnModalOpen(false);
        setColumnToEdit(null);
    };

    const handleDeleteColumn = (columnId: Id) => {
        if (!currentProjectId) return;
        const columnToDelete = columns.find(c => c.id === columnId);
        if (!columnToDelete) return;
    
        const tasksInColumn = tasks.filter(t => t.columnId === columnId).length;
        if (tasksInColumn > 0) {
            alert("No se puede eliminar una columna que contiene tareas.");
            return;
        }
    
        setConfirmation({
            title: `Eliminar Columna: "${columnToDelete.title}"`,
            message: '¿Estás seguro? Esta acción es irreversible.',
            confirmText: 'Sí, eliminar',
            onConfirm: async () => {
                await deleteDoc(doc(db, 'columns', columnId));
                logActivity('eliminó la columna', currentProjectId, columnToDelete.title);
            },
            isDestructive: true
        });
    };
    
    // --- Kanban & Task Logic (Firestore) ---
    const addTask = useCallback(async (columnId: Id) => {
        if (!currentProjectId || !currentUser) return;
        
        // Crear una tarea temporal para el modal con la columna específica
        const newTask: Task = {
            id: 'temp-' + Date.now(), // ID temporal
            title: '',
            description: '',
            priority: Priority.Medium,
            assignedTo: currentUser.id,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            projectId: currentProjectId,
            columnId: columnId,
            status: 'pending',
            order: tasks.filter(t => t.columnId === columnId).length,
            subtasks: [],
            collaboratorTeams: [], // Inicializar collaboratorTeams
            isNewTask: true // Flag para identificar que es una tarea nueva
        };
        
        setSelectedTaskForModal(newTask);
    }, [currentProjectId, currentUser, tasks]);

    const updateTask = useCallback(async (updatedTask: Task) => {
        console.log('App - updateTask llamado con:', updatedTask);
        
        const originalTask = tasks.find(t => t.id === updatedTask.id);
        if(!originalTask) {
            console.error('App - No se encontró la tarea original:', updatedTask.id);
            return;
        }

        console.log('App - Tarea original:', originalTask);

        // Merge the original task with the updates
        const mergedTask = { ...originalTask, ...updatedTask };
        console.log('App - Tarea fusionada:', mergedTask);

        // Map app's `columnId` back to Firestore's `status`
        const { id, columnId, ...dataToUpdate } = mergedTask;
        const taskDoc = {
            ...dataToUpdate,
            status: columnId,
            updatedAt: Timestamp.now(),
            collaboratorTeams: mergedTask.collaboratorTeams || [] // Inicializar collaboratorTeams si no existe
        }

        console.log('App - Datos a actualizar en Firestore:', taskDoc);

        await updateDoc(doc(db, 'tasks', id), taskDoc);
        console.log('App - Tarea actualizada exitosamente en Firestore');

        if (originalTask.assignedTo !== mergedTask.assignedTo && mergedTask.assignedTo && currentUser) {
             createNotification(mergedTask.assignedTo, `${currentUser.firstName} te ha asignado la tarea "${mergedTask.title}".`);
        }
        // Comentado para evitar que el modal se re-abra después de guardar
        // if(selectedTaskForModal && selectedTaskForModal.id === mergedTask.id) {
        //     setSelectedTaskForModal(mergedTask);
        // }
    }, [tasks, selectedTaskForModal, currentUser, createNotification]);


    const deleteTask = useCallback(async (taskId: Id) => {
        const taskToDelete = tasks.find(t => t.id === taskId);
        if(taskToDelete && currentProjectId){
            await deleteDoc(doc(db, 'tasks', taskId));
            logActivity('eliminó la tarea', currentProjectId, taskToDelete.title);
            if(selectedTaskForModal && selectedTaskForModal.id === taskId) setSelectedTaskForModal(null);
        }
    }, [selectedTaskForModal, tasks, currentProjectId, logActivity]);

    const handleUpdateTaskColor = async (taskId: Id, color: string) => {
        await updateDoc(doc(db, 'tasks', taskId), { color });
        setTaskForColorChange(null);
    };

    const moveTask = useCallback(async (draggedTaskId: Id, newColumnId: Id, targetTaskId: Id | null) => {
        await updateDoc(doc(db, 'tasks', draggedTaskId), { status: newColumnId, updatedAt: Timestamp.now() });
        // Note: Reordering logic (`order` field) would require a more complex batch update.
        // For simplicity, this is omitted but would be needed in a full implementation.
    }, []);

    const moveColumn = useCallback(async (draggedColumnId: Id, targetColumnId: Id) => {
        if (draggedColumnId === targetColumnId || !currentProjectId) return;
    
        const columnsInProject = columns
            .filter(c => c.projectId === currentProjectId)
            .sort((a, b) => a.order - b.order);
    
        const draggedIndex = columnsInProject.findIndex(c => c.id === draggedColumnId);
        const targetIndex = columnsInProject.findIndex(c => c.id === targetColumnId);
    
        if (draggedIndex === -1 || targetIndex === -1) return;
    
        const [draggedItem] = columnsInProject.splice(draggedIndex, 1);
        columnsInProject.splice(targetIndex, 0, draggedItem);
    
        const batch = writeBatch(db);
        columnsInProject.forEach((col, index) => {
            const docRef = doc(db, 'columns', col.id);
            batch.update(docRef, { order: index });
        });
        await batch.commit();

        const columnName = columns.find(c => c.id === draggedColumnId)?.title || '';
        logActivity(`movió la columna "${columnName}"`, currentProjectId, '');
    }, [columns, currentProjectId, logActivity]);
    
    const duplicateTask = async (taskId: Id) => {
        const taskToDuplicate = tasks.find(t => t.id === taskId);
        if (!taskToDuplicate) return;

        const { id, createdAt, updatedAt, ...rest } = taskToDuplicate;
        const duplicatedTaskData = {
            ...rest,
            title: `${taskToDuplicate.title} (Copia)`,
            createdBy: currentUser?.id || taskToDuplicate.createdBy, // Usuario que duplica la tarea
            assignedTo: currentUser?.id || taskToDuplicate.assignedTo, // Asignar al usuario que duplica
            collaboratorTeams: taskToDuplicate.collaboratorTeams || [], // Mantener equipos colaboradores
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            status: taskToDuplicate.columnId,
        };
        
        await addDoc(collection(db, 'tasks'), duplicatedTaskData);
        if(currentProjectId) logActivity('duplicó la tarea', currentProjectId, duplicatedTaskData.title);
    };

    const createFollowUpTask = async (taskId: Id) => {
        const originalTask = tasks.find(t => t.id === taskId);
        if (!originalTask) return;
        
        setTaskForFollowUp(originalTask);
        setIsFollowUpTaskModalOpen(true);
    };

    const handleCreateFollowUpTask = async (taskData: {
        title: string;
        projectId: string;
        assignedTo: string;
        collaborators: string[];
        description?: string;
    }) => {
        if (!currentUser || !taskForFollowUp) return;

        const targetColumn = columns.find(c => c.projectId === taskData.projectId);
        if (!targetColumn) return;

        const newTaskData = {
            projectId: taskData.projectId,
            status: targetColumn.id,
            title: taskData.title,
            priority: taskForFollowUp.priority,
            assignedTo: taskData.assignedTo,
            collaborators: taskData.collaborators,
            collaboratorTeams: [], // Inicializar collaboratorTeams
            createdBy: currentUser.id,
            description: taskData.description || `Tarea de seguimiento para: "${taskForFollowUp.title}"`,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            order: tasks.filter(t => t.columnId === targetColumn.id).length
        };

        await addDoc(collection(db, 'tasks'), newTaskData);
        logActivity('creó una tarea de seguimiento para', taskData.projectId, taskForFollowUp.title);
        
        setIsFollowUpTaskModalOpen(false);
        setTaskForFollowUp(null);
    };

    const addSubtask = (taskId: Id, subtask: Omit<Subtask, 'id'>) => {
        const newSubtask = { ...subtask, id: `sub-${Date.now()}` };
        updateTaskWithSubtasks(taskId, s => s ? [...s, newSubtask] : [newSubtask]);
    };
    const updateSubtask = (taskId: Id, updatedSubtask: Subtask) => updateTaskWithSubtasks(taskId, s => s?.map(sub => sub.id === updatedSubtask.id ? updatedSubtask : sub));
    const deleteSubtask = (taskId: Id, subtaskId: Id) => updateTaskWithSubtasks(taskId, s => s?.filter(sub => sub.id !== subtaskId));
    
    const updateTaskWithSubtasks = (taskId: Id, subtaskUpdater: (subtasks: Subtask[] | undefined) => Subtask[] | undefined) => {
        const taskToUpdate = tasks.find(t => t.id === taskId);
        if (!taskToUpdate) return;
        updateTask({ ...taskToUpdate, subtasks: subtaskUpdater(taskToUpdate.subtasks) });
    };

    // --- User & Group Management ---
    const handleAddOrUpdateUser = useCallback(async (userData: User) => {
        const { id, ...dataToUpdate } = userData;
        await updateDoc(doc(db, 'users', id), dataToUpdate);
    }, []);
    
    const handleAddOrUpdateGroup = useCallback(async (groupData: Group | Omit<Group, 'id'>) => {
        if ('id' in groupData) {
            const {id, ...dataToUpdate} = groupData;
            await updateDoc(doc(db, 'groups', id), dataToUpdate);
        } else {
            await addDoc(collection(db, 'groups'), groupData);
        }
        setIsGroupModalOpen(false);
        setGroupToEdit(null);
    }, []);

    const handleDeleteGroup = useCallback((groupId: Id) => {
        const groupToDelete = groups.find(g => g.id === groupId);
        if (!groupToDelete) return;
        setConfirmation({
            title: `Eliminar Grupo: "${groupToDelete.name}"`,
            message: '¿Estás seguro?',
            confirmText: 'Sí, eliminar',
            onConfirm: async () => {
                await deleteDoc(doc(db, 'groups', groupId));
            },
            isDestructive: true
        });
    }, [groups]);

    // Función para eliminar usuario
    const deleteUser = useCallback(async (userId: Id) => {
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) return;

        // Verificar permisos (solo admin puede eliminar usuarios)
        if (currentUser?.role !== UserRole.Admin) {
            alert("No tienes permiso para eliminar usuarios.");
            return;
        }

        try {
            const batch = writeBatch(db);
            
            // Eliminar el usuario
            batch.delete(doc(db, 'users', userId));
            
            // Remover al usuario de todos los proyectos donde esté como miembro
            projects.forEach(project => {
                if (project.members.includes(userId)) {
                    const updatedMembers = project.members.filter(memberId => memberId !== userId);
                    batch.update(doc(db, 'projects', project.id), { members: updatedMembers });
                }
            });

            // Eliminar todas las tareas asignadas al usuario
            tasks.forEach(task => {
                if (task.assignedTo === userId || task.createdBy === userId) {
                    batch.delete(doc(db, 'tasks', task.id));
                }
            });

            await batch.commit();
            console.log('Usuario eliminado exitosamente:', userToDelete.firstName, userToDelete.lastName);
        } catch (error) {
            console.error('Error eliminando usuario:', error);
            alert('Error al eliminar el usuario. Por favor, intenta de nuevo.');
        }
    }, [users, projects, tasks, currentUser]);

    // Función para eliminar proyecto
    const deleteProject = useCallback(async (projectId: Id) => {
        const projectToDelete = projects.find(p => p.id === projectId);
        if (!projectToDelete) return;

        // Verificar permisos (solo admin puede eliminar proyectos)
        if (currentUser?.role !== UserRole.Admin) {
            alert("No tienes permiso para eliminar proyectos.");
            return;
        }

        // Verificar restricciones especiales para proyectos críticos
        if (isProjectProtected(projectToDelete.name)) {
            alert("No se puede eliminar el proyecto '" + projectToDelete.name + "'. Solo un administrador puede eliminar este tipo de proyectos.");
            return;
        }

        try {
            const batch = writeBatch(db);
            
            // Eliminar el proyecto
            batch.delete(doc(db, 'projects', projectId));
            
            // Eliminar todas las columnas del proyecto
            columns.forEach(column => {
                if (column.projectId === projectId) {
                    batch.delete(doc(db, 'columns', column.id));
                }
            });

            // Eliminar todas las tareas del proyecto
            tasks.forEach(task => {
                if (task.projectId === projectId) {
                    batch.delete(doc(db, 'tasks', task.id));
                }
            });

            await batch.commit();
            console.log('Proyecto eliminado exitosamente:', projectToDelete.name);
            
            // Si el proyecto actual es el eliminado, navegar a proyectos
            if (currentProjectId === projectId) {
                handleGoToProjects();
            }
        } catch (error) {
            console.error('Error eliminando proyecto:', error);
            alert('Error al eliminar el proyecto. Por favor, intenta de nuevo.');
        }
    }, [projects, columns, tasks, currentUser, currentProjectId]);

    const handleMarkNotificationsAsRead = () => {
        if(!currentUser) return;
        setNotifications(prev => prev.map(n => n.userId === currentUser.id ? {...n, read: true} : n));
    };

    // Derived State
    const currentProject = useMemo(() => projects.find(p => p.id === currentProjectId), [projects, currentProjectId]);
    const projectColumns = useMemo(() => columns
        .filter(c => c.projectId === currentProjectId)
        .sort((a, b) => a.order - b.order), 
    [columns, currentProjectId]);
    const projectTasks = useMemo(() => tasks.filter(t => t.projectId === currentProjectId), [tasks, currentProjectId]);
    // Función helper para verificar si un proyecto está protegido
    const isProjectProtected = (projectName: string): boolean => {
        const protectedProjects = ['Soporte', 'Compras'];
        return protectedProjects.includes(projectName);
    };

    // Función para ordenar proyectos (protegidos al final)
    const sortProjectsWithProtectedAtEnd = (projectList: Project[]): Project[] => {
        return [...projectList].sort((a, b) => {
            const aIsProtected = isProjectProtected(a.name);
            const bIsProtected = isProjectProtected(b.name);
            
            if (aIsProtected && !bIsProtected) return 1; // a va al final
            if (!aIsProtected && bIsProtected) return -1; // b va al final
            return 0; // mantener orden original entre proyectos del mismo tipo
        });
    };

    const userProjects = useMemo(() => {
        if (!currentUser) return [];
        const filteredProjects = projects.filter(p => p.members.includes(currentUser.id));
        return sortProjectsWithProtectedAtEnd(filteredProjects);
    }, [projects, currentUser]);

    // Versión ordenada de todos los proyectos para modales
    const sortedAllProjects = useMemo(() => {
        return sortProjectsWithProtectedAtEnd(projects);
    }, [projects]);
    const projectActivities = useMemo(() => activities.filter(a => a.projectId === currentProjectId), [activities, currentProjectId]);
    const projectUsers = useMemo(() => users.filter(u => currentProject?.members.includes(u.id)), [users, currentProject]);

    // Crear tarea desde el cronograma: crea columna 'Pendiente de asignación' si no existe
    const addTaskFromTimeline = useCallback(async () => {
        if (!currentProjectId || !currentUser) return;
        
        // Buscar o crear columna por defecto
        let column = columns.find(c => c.projectId === currentProjectId && c.title === 'Pendiente de asignación');
        if (!column) {
            const order = columns.filter(c => c.projectId === currentProjectId).length;
            const newColumn = { title: 'Pendiente de asignación', projectId: currentProjectId, order };
            const colRef = await addDoc(collection(db, 'columns'), newColumn);
            column = { id: colRef.id, ...newColumn } as Column;
        }
        
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        
        // Crear una tarea temporal para el modal
        const newTask: Task = {
            id: 'temp-' + Date.now(), // ID temporal
            title: '',
            description: '',
            priority: Priority.Medium,
            assignedTo: currentUser.id,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            projectId: currentProjectId,
            columnId: column.id,
            status: 'pending',
            startDate: today.toISOString().slice(0,10),
            dueDate: tomorrow.toISOString().slice(0,10),
            order: tasks.filter(t => t.columnId === column.id).length,
            subtasks: [],
            isNewTask: true // Flag para identificar que es una tarea nueva
        };
        
        setSelectedTaskForModal(newTask);
    }, [currentProjectId, currentUser, columns, tasks]);

    // --- RENDER LOGIC ---
    if (isLoadingAuth) {
        return <div className="h-screen w-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg"><p>Cargando sesión...</p></div>;
    }

    if (!currentUser) {
        return <LoginView />;
    }

    const handleNavigateToView = (newView: string) => {
        console.log('Navegando a vista:', newView);
        setView(newView as View);
        setCurrentProjectId(null); // Reset project when navigating to main views
    };

    const handleNavigateToUsers = () => {
        setView('users');
    };

    const handleNavigateToSupport = () => {
        setIsSupportView(!isSupportView); // Toggle entre true y false
    };

    const handleSendMessage = async (messageData: {
        toUserId: string;
        subject: string;
        message: string;
        priority: Priority;
    }) => {
        try {
            // Obtener información del usuario destinatario
            const recipientUser = users.find(user => user.id === messageData.toUserId);
            if (!recipientUser) {
                throw new Error('Usuario destinatario no encontrado');
            }

            // Crear el mensaje en Firestore
            const messageRef = collection(db, 'messages');
            const newMessage = {
                fromUserId: currentUser!.id,
                fromUserName: `${currentUser!.firstName} ${currentUser!.lastName}`,
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
            
            showNotification('Mensaje enviado', 'El mensaje se ha enviado correctamente', 'success');
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            showNotification('Error', 'No se pudo enviar el mensaje', 'error');
        }
    };

    const handleNavigateBackFromSupport = () => {
        setIsSupportView(false);
    };

    const handleSelectTaskForModal = (task: Task) => {
        setSelectedTaskForModal(task);
    };

    const handleCloseTaskModal = () => {
        console.log('App - handleCloseTaskModal ejecutándose...');
        setSelectedTaskForModal(null);
        console.log('App - selectedTaskForModal establecido a null');
    };

    const handleCreateNewTask = () => {
        if (!currentUser) return;
        
        console.log('🔧 handleCreateNewTask llamado');
        console.log('🔧 currentProjectId:', currentProjectId);
        console.log('🔧 proyectos disponibles:', projects.length);
        
        // Crear una tarea temporal para el modal
        const newTask: Task = {
            id: 'temp-' + Date.now(), // ID temporal
            title: '',
            description: '',
            priority: Priority.Medium,
            assignedTo: currentUser.id,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            projectId: currentProjectId || '', // Puede estar vacío si no hay proyecto seleccionado
            columnId: '',
            status: 'pending',
            order: 0,
            subtasks: [],
            isNewTask: true // Flag para identificar que es una tarea nueva
        };
        
        console.log('🔧 Nueva tarea temporal creada:', newTask);
        setSelectedTaskForModal(newTask);
    };

    const handleUpdateTaskFromModal = (taskId: string, updates: Partial<Task>) => {
        console.log('🔧 App - handleUpdateTaskFromModal llamado con:', { taskId, updates });
        console.log('🔧 currentUser:', currentUser?.id);
        console.log('🔧 currentProjectId:', currentProjectId);
        
        // Verificar si es una tarea nueva (tiene ID temporal)
        if (taskId.startsWith('temp-')) {
            console.log('🔧 Es una tarea nueva (ID temporal)');
            // Es una tarea nueva, crear en Firestore
            if (!currentUser) {
                console.error('❌ No hay usuario actual');
                return;
            }
            
            // Usar el proyecto seleccionado en el modal o el proyecto actual
            const projectId = updates.projectId || currentProjectId;
            console.log('🔧 projectId seleccionado:', projectId);
            console.log('🔧 updates.projectId:', updates.projectId);
            console.log('🔧 currentProjectId:', currentProjectId);
            
            if (!projectId) {
                console.error('❌ No se puede crear la tarea: no hay proyecto seleccionado');
                alert('Por favor, selecciona un proyecto para la tarea antes de guardar.');
                return;
            }
            
            const newTaskData = {
                projectId: projectId,
                status: updates.columnId || columns.find(c => c.projectId === projectId)?.id || '',
                title: updates.title || 'Nueva Tarea',
                description: updates.description || '',
                priority: updates.priority || Priority.Medium,
                assignedTo: updates.assignedTo || currentUser.id,
                createdBy: currentUser.id,
                startDate: updates.startDate || '',
                dueDate: updates.dueDate || '',
                coverImage: updates.coverImage || '',
                subtasks: updates.subtasks || [],
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                order: tasks.filter(t => t.columnId === (updates.columnId || '')).length,
            };
            
            console.log('🔧 Datos de la nueva tarea a crear:', newTaskData);
            
            addDoc(collection(db, 'tasks'), newTaskData).then((docRef) => {
                console.log('✅ Tarea creada exitosamente en Firestore con ID:', docRef.id);
                logActivity('creó la tarea', projectId, newTaskData.title);
                setSelectedTaskForModal(null);
            }).catch((error) => {
                console.error('❌ Error al crear la tarea en Firestore:', error);
                alert('Error al crear la tarea. Por favor, intenta de nuevo.');
            });
        } else {
            // Es una tarea existente, actualizar
            const originalTask = tasks.find(t => t.id === taskId);
            if (!originalTask) {
                console.error('App - No se encontró la tarea original:', taskId);
                return;
            }

            const updatedTask = { ...originalTask, ...updates };
            console.log('App - Tarea actualizada para updateTask:', updatedTask);
            
            updateTask(updatedTask);
        }
    };

    const handleToggleTaskComplete = async (taskId: Id) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !currentUser) return;

        const currentStatus = task.taskStatus || 'pending';
        const newStatus: 'pending' | 'completed' = currentStatus === 'completed' ? 'pending' : 'completed';
        
        try {
            // Actualizar directamente en Firestore sin usar updateTask para evitar conflictos
            await updateDoc(doc(db, 'tasks', taskId), { 
                taskStatus: newStatus, // Usar un campo diferente para evitar conflictos
                updatedAt: Timestamp.now() 
            });
            
            // Registrar la actividad
            const action = newStatus === 'completed' ? 'completó la tarea' : 'marcó como pendiente la tarea';
            await logActivity(action, task.projectId, task.title);
            
            console.log(`✅ Tarea ${newStatus === 'completed' ? 'completada' : 'marcada como pendiente'}:`, task.title);
        } catch (error) {
            console.error('❌ Error al actualizar estado de la tarea:', error);
        }
    };

    const handleProjectViewChange = (projectView: 'board' | 'timeline' | 'dashboard') => {
        setView(projectView);
    };

    const handleOpenProjectSettings = () => {
        setIsProjectSettingsModalOpen(true);
    };

    const loadProjectSettings = async (projectId: string) => {
        try {
            const projectSettingsRef = doc(db, 'projectSettings', projectId);
            const settingsDoc = await getDoc(projectSettingsRef);
            
            if (settingsDoc.exists()) {
                const settings = settingsDoc.data();
                console.log('📋 Configuración del proyecto cargada:', settings);
                return settings.defaultView || 'dashboard';
            }
        } catch (error) {
            console.error('❌ Error al cargar configuración del proyecto:', error);
        }
        return 'dashboard';
    };

    const showNotification = (title: string, message: string, type: 'success' | 'error' | 'info') => {
        setNotification({ type, title, message });
        // Auto-hide notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
    };

    const handleSaveProjectSettings = async (settings: { defaultView: 'board' | 'timeline' | 'dashboard' }) => {
        if (!currentProjectId || !currentUser) return;

        try {
            // Guardar configuración en Firebase
            const projectSettingsRef = doc(db, 'projectSettings', currentProjectId);
            await setDoc(projectSettingsRef, {
                projectId: currentProjectId,
                defaultView: settings.defaultView,
                updatedBy: currentUser.id,
                updatedAt: Timestamp.now()
            });

            // Aplicar la vista seleccionada
            setView(settings.defaultView);

            // Mostrar notificación de éxito
            showNotification('Configuración guardada', 'La vista principal del proyecto se ha actualizado correctamente.', 'success');
            
            console.log('✅ Configuración del proyecto guardada en Firebase:', settings);
        } catch (error) {
            console.error('❌ Error al guardar configuración del proyecto:', error);
            showNotification('Error', 'No se pudo guardar la configuración. Inténtalo de nuevo.', 'error');
        }
    };

    // Función para añadir miembros a un proyecto
    const handleAddMembersToProject = async (projectId: string, memberIds: string[]) => {
        if (!currentUser) {
            console.error('❌ No hay usuario actual');
            return;
        }
        
        console.log('🔧 handleAddMembersToProject llamado con:', { projectId, memberIds });
        
        try {
            const batch = writeBatch(db);
            
            // Añadir miembros al proyecto
            const projectRef = doc(db, 'projects', projectId);
            batch.update(projectRef, { 
                members: arrayUnion(...memberIds) 
            });
            
            console.log('✅ Miembros añadidos al batch para proyecto:', projectId);
            
            // Crear una tarea de bienvenida para cada nuevo miembro
            const project = projects.find(p => p.id === projectId);
            if (project) {
                const defaultColumn = columns.find(c => c.projectId === projectId);
                if (defaultColumn) {
                    memberIds.forEach(memberId => {
                        const welcomeTask = {
                            projectId: projectId,
                            status: defaultColumn.id,
                            title: `Bienvenido a ${project.name}`,
                            description: `Tarea de bienvenida para el nuevo miembro del proyecto.`,
                            priority: Priority.Medium,
                            assignedTo: memberId, // Asignar como responsable
                            createdBy: currentUser.id,
                            createdAt: Timestamp.now(),
                            updatedAt: Timestamp.now(),
                            order: tasks.filter(t => t.columnId === defaultColumn.id).length,
                            collaboratorTeams: []
                        };
                        
                        // Añadir la tarea al batch
                        const taskRef = doc(collection(db, 'tasks'));
                        batch.set(taskRef, welcomeTask);
                        
                        // Crear notificación para el nuevo miembro
                        const notification = {
                            userId: memberId,
                            message: `Has sido añadido al proyecto "${project.name}" y tienes una nueva tarea asignada.`,
                            read: false,
                            timestamp: Timestamp.now(),
                            link: `/project/${projectId}`
                        };
                        
                        const notificationRef = doc(collection(db, 'notifications'));
                        batch.set(notificationRef, notification);
                    });
                }
            }
            
            await batch.commit();
            console.log('✅ Miembros añadidos exitosamente al proyecto:', projectId);
            
            // Cerrar el modal
            setIsAddMembersModalOpen(false);
            setProjectForAddMembers(null);
            
        } catch (error) {
            console.error('❌ Error al añadir miembros al proyecto:', error);
            alert('Error al añadir miembros al proyecto. Por favor, intenta de nuevo.');
        }
    };

    const handleCreateAITask = async (project: Project) => {
        try {
            console.log('🤖 Generando tarea con IA para proyecto:', project.name);
            
            // Obtener tareas existentes del proyecto
            const projectTasks = tasks.filter(task => task.projectId === project.id);
            
            // Generar tarea con IA
            const aiTask = await AIService.generateTaskForProject(project, projectTasks);
            
            // Crear la nueva tarea en Firestore
            const newTaskData = {
                projectId: project.id,
                status: columns.find(c => c.projectId === project.id)?.id || '',
                title: aiTask.title,
                description: aiTask.description,
                priority: aiTask.priority,
                assignedTo: currentUser?.id || '',
                createdBy: currentUser?.id || '',
                startDate: '',
                dueDate: '',
                coverImage: '',
                subtasks: [],
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                order: projectTasks.length,
            };
            
            const taskRef = await addDoc(collection(db, 'tasks'), newTaskData);
            
            console.log('✅ Tarea generada con IA creada exitosamente:', aiTask.title);
            logActivity('creó una tarea con IA', project.id, aiTask.title);
            
            // Mostrar notificación de éxito
            alert(`Tarea generada con IA: "${aiTask.title}"\n\nRazonamiento: ${aiTask.reasoning}`);
            
        } catch (error) {
            console.error('❌ Error generando tarea con IA:', error);
            throw error;
        }
    };

    const MainContent = () => {
        if (view === 'home' && !currentProjectId) {
            return (
                <HomeDashboardView 
                    currentUser={currentUser}
                    projects={userProjects}
                    tasks={tasks}
                    users={users}
                    columns={columns}
                    onSelectTask={handleSelectTaskForModal}
                    onCreateTask={handleCreateNewTask}
                    onToggleComplete={handleToggleTaskComplete}
                />
            );
        }

        if (view === 'mytasks') {
            return (
                <MyTasksView 
                    currentUser={currentUser}
                    projects={userProjects}
                    tasks={tasks}
                    users={users}
                    columns={columns}
                    onSelectTask={handleSelectTaskForModal}
                    onCreateTask={handleCreateNewTask}
                    onUpdateTask={(taskId, updates) => {
                        const task = tasks.find(t => t.id === taskId);
                        if (task) {
                            updateTask({ ...task, ...updates });
                        }
                    }}
                    onNavigateToView={handleNavigateToView}
                    onNavigateToUsers={handleNavigateToUsers}
                    currentView={view}
                    currentProjectId={currentProjectId}
                    onToggleComplete={handleToggleTaskComplete}
                />
            );
        }

        if (view === 'projects') {
            return (
                <ProjectsView 
                    projects={userProjects}
                    currentUser={currentUser}
                    onSelectProject={handleSelectProject} 
                    onEditProject={setProjectToEdit}
                    onDeleteProject={(projectId) => {
                        setConfirmation({
                            title: 'Eliminar Proyecto',
                            message: `¿Estás seguro de que quieres eliminar este proyecto?`,
                            confirmText: 'Eliminar',
                            onConfirm: () => deleteProject(projectId),
                            isDestructive: true
                        });
                    }}
                    onAddProject={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
                    onOpenColorPicker={setProjectForColorChange}
                    onAddMembers={(project) => {
                        console.log('🔧 onAddMembers llamado para proyecto:', project.name);
                        setProjectForAddMembers(project);
                        setIsAddMembersModalOpen(true);
                    }}
                    onCreateAITask={handleCreateAITask}
                />
            );
        }

        if (view === 'users') {
            return (
                <UsersView 
                    users={users}
                    groups={groups}
                    allUsers={users}
                    currentUser={currentUser}
                    onAddUserClick={() => { setSelectedUserForEdit(null); setIsUserModalOpen(true); }}
                    onSelectUser={setSelectedUserForEdit}
                    onAddGroupClick={() => { setGroupToEdit(null); setIsGroupModalOpen(true); }}
                    onSelectGroup={setGroupToEdit}
                    onDeleteGroup={(groupId) => {
                        setConfirmation({
                            title: 'Eliminar Grupo',
                            message: `¿Estás seguro de que quieres eliminar este grupo?`,
                            confirmText: 'Eliminar',
                            onConfirm: () => {
                                // Implementar eliminación de grupo
                                console.log('Eliminar grupo:', groupId);
                            },
                            isDestructive: true
                        });
                    }}
                />
            );
        }

        if (view === 'inbox') {
            return (
                <InboxView 
                    currentUser={currentUser}
                    onSendMessage={handleSendMessage}
                />
            );
        }

        if (view === 'reports') {
            return (
                <ReportsView
                    currentUser={currentUser}
                    projects={sortedAllProjects}
                    tasks={tasks}
                    users={users}
                    columns={columns}
                    onSelectTask={setSelectedTaskForModal}
                    onSelectProject={handleSelectProject}
                />
            );
        }

        if (view === 'voicetest') {
            return <VoiceTest />;
        }

        if (isSupportView) {
            return (
                <SupportView 
                    currentUser={currentUser}
                    projects={userProjects}
                    users={users}
                    onSelectProject={handleSelectProject}
                    onEditProject={setProjectToEdit}
                    onDeleteProject={(projectId) => {
                        setConfirmation({
                            title: 'Eliminar Proyecto',
                            message: `¿Estás seguro de que quieres eliminar este proyecto?`,
                            confirmText: 'Eliminar',
                            onConfirm: () => deleteProject(projectId),
                            isDestructive: true
                        });
                    }}
                    onAddMembers={(project) => {
                        setProjectForAddMembers(project);
                        setIsAddMembersModalOpen(true);
                    }}
                    onNavigateBack={handleNavigateBackFromSupport}
                />
            );
        }

        if (view === 'settings') {
            return (
                <SettingsView 
                    user={currentUser}
                    onUpdateUser={handleAddOrUpdateUser}
                />
            );
        }

        // Project views (board, timeline, dashboard)
        if (currentProjectId) {
            const currentProject = projects.find(p => p.id === currentProjectId);
            if (!currentProject) return null;

            return (
                <div className="flex flex-col h-full">
                    <ProjectHeader 
                        project={currentProject}
                        currentView={view as 'board' | 'timeline' | 'dashboard'}
                        onViewChange={(newView) => setView(newView)}
                        onBackToProjects={handleGoToProjects}
                        onOpenSettings={handleOpenProjectSettings}
                    />
                    <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
                        <div className="h-full p-6 md:p-8 lg:p-10">
                            {view === 'board' && (
                                <BoardView 
                                    columns={projectColumns} 
                                    tasks={projectTasks}
                                    users={projectUsers}
                                    teams={teams}
                                    onSelectTask={handleSelectTaskForModal} 
                                    moveTask={moveTask} 
                                    moveColumn={moveColumn}
                                    addTask={addTask} 
                                    deleteTask={deleteTask} 
                                    duplicateTask={duplicateTask} 
                                    createFollowUpTask={createFollowUpTask} 
                                    onAddColumn={() => { setColumnToEdit(null); setIsColumnModalOpen(true); }}
                                    onEditColumn={(col) => { setColumnToEdit(col); setIsColumnModalOpen(true); }}
                                    onDeleteColumn={handleDeleteColumn}
                                    onOpenColorPicker={setTaskForColorChange}
                                    onToggleComplete={handleToggleTaskComplete}
                                />
                            )}
                            {view === 'timeline' && (
                                <TimelineView tasks={projectTasks} onUpdateTask={updateTask} onAddTask={addTaskFromTimeline}/>
                            )}
                            {view === 'dashboard' && (
                                <DashboardView 
                                    project={currentProject} 
                                    tasks={projectTasks} 
                                    columns={projectColumns} 
                                    activities={projectActivities} 
                                    currentUser={currentUser} 
                                    onSelectTask={handleSelectTaskForModal} 
                                    onToggleComplete={handleToggleTaskComplete}
                                    users={projectUsers} 
                                />
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    console.log('Vista actual:', view);
    return (
        <div className={`h-screen w-screen flex flex-col ${theme}`}>
            {!currentUser ? (
                <LoginView />
            ) : (
                <div className="flex h-full">
                    <Sidebar 
                        currentUser={currentUser}
                        projects={userProjects}
                        allProjects={sortedAllProjects}
                        users={users}
                        currentView={view}
                        onNavigateToView={handleNavigateToView}
                        onSelectProject={handleSelectProject}
                        onAddProject={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }}
                        deleteUser={deleteUser}
                        deleteProject={deleteProject}
                        onEditProject={setProjectToEdit}
                        onAddMembers={(project) => {
                            setProjectForAddMembers(project);
                            setIsAddMembersModalOpen(true);
                        }}
                        onNavigateToSupport={handleNavigateToSupport}
                        onSendMessage={handleSendMessage}
                    />
                    <div className="flex-1 overflow-hidden">
                        <MainContent />
                    </div>
                </div>
            )}

            {/* Modals */}
            {selectedTaskForModal && (
                <TaskDetailsModal
                    task={selectedTaskForModal}
                    users={users}
                    projects={sortedAllProjects}
                    columns={columns}
                    teams={teams}
                    onClose={handleCloseTaskModal}
                    onUpdateTask={handleUpdateTaskFromModal}
                />
            )}

            {isUserModalOpen && (
                <UserFormModal
                    userToEdit={selectedUserForEdit}
                    currentUser={currentUser}
                    allProjects={sortedAllProjects}
                    onClose={() => { setIsUserModalOpen(false); setSelectedUserForEdit(null); }}
                />
            )}
            {(isProjectModalOpen || projectToEdit) && (
                <ProjectFormModal 
                    projectToEdit={projectToEdit}
                    allUsers={users}
                    allTeams={teams}
                    onClose={() => { setIsProjectModalOpen(false); setProjectToEdit(null); }} 
                    onSave={handleAddOrUpdateProject} 
                />
            )}
            {isColumnModalOpen && (
                 <ColumnFormModal
                    columnToEdit={columnToEdit}
                    onClose={() => { setIsColumnModalOpen(false); setColumnToEdit(null); }}
                    onSave={handleAddOrUpdateColumn}
                />
            )}
             {isGroupModalOpen && (
                <GroupFormModal
                    groupToEdit={groupToEdit}
                    allUsers={users}
                    onClose={() => { setIsGroupModalOpen(false); setGroupToEdit(null); }}
                    onSave={handleAddOrUpdateGroup}
                />
            )}
            {projectForColorChange && (
                <ColorPickerModal
                    onClose={() => setProjectForColorChange(null)}
                    onSelectColor={(color) => handleUpdateProjectColor(projectForColorChange.id, color)}
                />
            )}
            {taskForColorChange && (
                <ColorPickerModal
                    onClose={() => setTaskForColorChange(null)}
                    onSelectColor={(color) => handleUpdateTaskColor(taskForColorChange.id, color)}
                />
            )}
            {confirmation && (
                <ConfirmModal
                    {...confirmation}
                    cancelText="Cancelar"
                    onClose={() => setConfirmation(null)}
                />
            )}
            {isProjectSettingsModalOpen && currentProject && (
                <ProjectSettingsModal
                    isOpen={isProjectSettingsModalOpen}
                    onClose={() => setIsProjectSettingsModalOpen(false)}
                    project={currentProject}
                    currentView={view as 'board' | 'timeline' | 'dashboard'}
                    onSave={handleSaveProjectSettings}
                    onLoadSettings={() => loadProjectSettings(currentProject.id)}
                />
            )}
            {isAddMembersModalOpen && projectForAddMembers && (
                <AddMembersModal
                    project={projectForAddMembers}
                    allUsers={users}
                    onClose={() => {
                        setIsAddMembersModalOpen(false);
                        setProjectForAddMembers(null);
                    }}
                    onAddMembers={handleAddMembersToProject}
                />
            )}

            {isFollowUpTaskModalOpen && taskForFollowUp && (
                <FollowUpTaskModal
                    isOpen={isFollowUpTaskModalOpen}
                    onClose={() => {
                        setIsFollowUpTaskModalOpen(false);
                        setTaskForFollowUp(null);
                    }}
                    originalTask={taskForFollowUp}
                    projects={sortedAllProjects}
                    users={users}
                    currentUser={currentUser!}
                    onCreateFollowUpTask={handleCreateFollowUpTask}
                />
            )}

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 ${
                    notification.type === 'success' ? 'border-green-500' : 
                    notification.type === 'error' ? 'border-red-500' : 
                    'border-blue-500'
                }`}>
                    <div className="p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                {notification.type === 'success' && (
                                    <div className="h-5 w-5 text-green-400">
                                        <CheckCircleIcon />
                                    </div>
                                )}
                                {notification.type === 'error' && (
                                    <div className="h-5 w-5 text-red-400">
                                        <XIcon />
                                    </div>
                                )}
                                {notification.type === 'info' && (
                                    <div className="h-5 w-5 text-blue-400">ℹ</div>
                                )}
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {notification.title}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {notification.message}
                                </p>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                                <button
                                    onClick={() => setNotification(null)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <XIcon />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;