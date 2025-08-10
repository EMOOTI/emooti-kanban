import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Project, Task, User, Priority, Column } from '../types';
import { PRIORITY_STYLES } from '../constants';
import TaskDetailsModal from './TaskDetailsModal';
import { 
    PlusIcon, 
    CheckCircleIcon, 
    ChevronRightIcon,
    ChevronDownIcon,
    SearchIcon,
    FilterIcon,
    SortAscendingIcon,
    UserGroupIcon,
    OptionsIcon,
    CalendarIcon,
    ChatBubbleLeftIcon,
    PaperClipIcon,
    EyeIcon,
    ShareIcon,
    CogIcon,
    ListBulletIcon,
    Squares2X2Icon,
    CalendarDaysIcon,
    ChartBarIcon,
    FolderIcon,
    HomeIcon,
    InboxIcon,
    ChartBarIcon as ChartBarIcon2,
    BriefcaseIcon,
    TargetIcon,
    UsersIcon,
    ClockIcon,
    CheckIcon,
    HashIcon,
    FxIcon,
    TimerIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    SortIcon,
    CircleIcon,
    BookOpenIcon,
    AIIcon
} from './icons';

interface MyTasksViewProps {
    currentUser: User;
    projects: Project[];
    tasks: Task[];
    users: User[];
    columns: Column[];
    onSelectTask: (task: Task) => void;
    onCreateTask: () => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onNavigateToView: (view: string) => void;
    onNavigateToUsers: () => void;
    currentView?: string;
    currentProjectId?: string | null;
    onToggleComplete?: (taskId: string) => void;
}

interface TaskSection {
    id: string;
    title: string;
    tasks: Task[];
    isExpanded: boolean;
}

interface CustomColumn {
    id: string;
    title: string;
    type: 'single-select' | 'multi-select' | 'date' | 'people' | 'text' | 'number' | 'formula' | 'timer' | 'accumulation';
    icon: React.ReactNode;
}

const MyTasksView: React.FC<MyTasksViewProps> = ({
    currentUser,
    projects,
    tasks,
    users,
    columns,
    onSelectTask,
    onCreateTask,
    onUpdateTask,
    onNavigateToView,
    onNavigateToUsers,
    currentView = 'mytasks',
    currentProjectId,
    onToggleComplete
}) => {
    console.log('=== MyTasksView RENDERIZADO ===');
    console.log('currentView:', currentView);
    console.log('tasks recibidas:', tasks.length);
    console.log('currentUser:', currentUser?.id);
    console.log('projects:', projects.length);
    console.log('columns:', columns.length);
    console.log('users:', users.length);
    console.log('=== FIN MyTasksView ===');
    
    const [activeView, setActiveView] = useState<'list' | 'board' | 'calendar' | 'panel' | 'files'>('list');
    const [activeTaskTab, setActiveTaskTab] = useState<'no-date' | 'today' | 'next-days' | 'next-week' | 'later' | 'overdue'>('today');
    const [searchTerm, setSearchTerm] = useState('');
    const [showTitleDropdown, setShowTitleDropdown] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['recently-assigned']));
    const [sortBy, setSortBy] = useState<'name' | 'dueDate' | 'priority' | 'project'>('dueDate');
    const [filterProject, setFilterProject] = useState<string>('all');
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'last-month'>('week');
    const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    
    // Ref para manejar el dropdown
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Manejar clics fuera del dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowTimeRangeDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Efecto para cerrar el menú del título cuando se hace clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const titleDropdown = document.querySelector('[data-title-dropdown]');
            if (titleDropdown && !titleDropdown.contains(target)) {
                setShowTitleDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
    
    // Estados para ordenamiento
    const [sortConfig, setSortConfig] = useState<{
        column: string;
        direction: 'asc' | 'desc';
    } | null>(null);

    // Identificar columnas de tareas completadas
    const doneColumnIds = columns.filter(col => col.isDoneColumn).map(col => col.id);
    console.log('=== COLUMNAS ===');
    console.log('Todas las columnas:', columns);
    console.log('Columnas marcadas como completadas:', columns.filter(col => col.isDoneColumn));
    console.log('IDs de columnas completadas:', doneColumnIds);
    console.log('=== FIN COLUMNAS ===');

    // Función para normalizar tareas (asignar valores por defecto)
    const normalizeTask = (task: Task): Task => {
        const normalizedTask = { ...task };
        
        // Si no tiene createdBy, usar el assignedTo o un valor por defecto
        if (!normalizedTask.createdBy) {
            normalizedTask.createdBy = normalizedTask.assignedTo || currentUser.id;
        }
        
        // Si no tiene assignedTo, asignar al creador
        if (!normalizedTask.assignedTo) {
            normalizedTask.assignedTo = normalizedTask.createdBy;
        }
        
        // Si no tiene startDate, usar la fecha de creación
        if (!normalizedTask.startDate) {
            normalizedTask.startDate = normalizedTask.createdAt;
        }
        
        // Si no tiene dueDate, usar el día siguiente a la creación
        if (!normalizedTask.dueDate) {
            const creationDate = new Date(normalizedTask.createdAt);
            creationDate.setDate(creationDate.getDate() + 1);
            normalizedTask.dueDate = creationDate.toISOString();
        }
        
        return normalizedTask;
    };

    // Normalizar todas las tareas
    const normalizedTasks = useMemo(() => {
        console.log('Normalizando tareas...');
        return tasks.map(normalizeTask);
    }, [tasks, currentUser.id]);

    // Filtrar tareas del usuario actual (GLOBAL - para indicadores)
    const userTasks = useMemo(() => {
        console.log('=== MyTasksView - FILTRADO DE TAREAS GLOBAL ===');
        console.log('Tareas normalizadas:', normalizedTasks.length);
        console.log('Usuario actual ID:', currentUser.id);
        const filtered = normalizedTasks.filter(task => task.assignedTo === currentUser.id);
        console.log('Tareas filtradas del usuario:', filtered.length);
        console.log('Tareas del usuario:', filtered.map(t => ({ title: t.title, assignedTo: t.assignedTo, dueDate: t.dueDate, taskStatus: t.taskStatus, columnId: t.columnId })));
        console.log('=== FIN FILTRADO GLOBAL ===');
        return filtered;
    }, [normalizedTasks, currentUser.id]);

    // Filtrar tareas por término de búsqueda
    const filteredTasks = useMemo(() => {
        if (!searchTerm.trim()) return normalizedTasks;
        
        const searchLower = searchTerm.toLowerCase();
        return normalizedTasks.filter(task => 
            task.title.toLowerCase().includes(searchLower) ||
            (task.description && task.description.toLowerCase().includes(searchLower)) ||
            (task.projectId && getProjectName(task.projectId).toLowerCase().includes(searchLower))
        );
    }, [normalizedTasks, searchTerm]);

    // Filtrar por proyecto si es necesario
    const projectFilteredTasks = useMemo(() => {
        if (filterProject === 'all') return filteredTasks;
        return filteredTasks.filter(task => task.projectId === filterProject);
    }, [filteredTasks, filterProject]);

    // Ordenar tareas
    const sortedTasks = useMemo(() => {
        const sorted = [...projectFilteredTasks];
        
        switch (sortBy) {
            case 'name':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            case 'dueDate':
                return sorted.sort((a, b) => {
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                });
            case 'priority':
                const priorityOrder: Record<Priority, number> = { 
                    [Priority.Low]: 1, 
                    [Priority.Medium]: 2, 
                    [Priority.High]: 3, 
                    [Priority.Urgent]: 4 
                };
                return sorted.sort((a, b) => (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0));
            case 'project':
                return sorted.sort((a, b) => {
                    const projectA = getProjectName(a.projectId || '');
                    const projectB = getProjectName(b.projectId || '');
                    return projectA.localeCompare(projectB);
                });
            default:
                return sorted;
        }
    }, [projectFilteredTasks, sortBy]);

    // Calcular tareas pendientes en el rango de tiempo
    const pendingTasksInRange = useMemo(() => {
        const today = new Date();
        let startDate = new Date();
        let endDate = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (timeRange === 'week') {
            startDate = today;
            endDate.setHours(23, 59, 59, 999);
            endDate.setDate(today.getDate() + 7);
        } else if (timeRange === 'month') {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (timeRange === 'last-month') {
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1, 0, 0, 0, 0);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        }
        
        const pending = userTasks.filter(task => {
            const isCompleted = doneColumnIds.includes(task.columnId) || task.taskStatus === 'completed';
            if (isCompleted) return false;
            
            if (!task.dueDate) return false;
            
            const dueDate = new Date(task.dueDate);
            return dueDate >= startDate && dueDate <= endDate;
        });
        
        console.log('=== MyTasksView - TAREAS PENDIENTES ===');
        console.log('Rango de tiempo:', timeRange);
        console.log('Fecha inicio:', startDate);
        console.log('Fecha fin:', endDate);
        console.log('Tareas pendientes encontradas:', pending.length);
        console.log('Tareas pendientes:', pending.map(t => ({ title: t.title, dueDate: t.dueDate, taskStatus: t.taskStatus, columnId: t.columnId })));
        console.log('=== FIN PENDIENTES ===');
        
        return pending.length;
    }, [userTasks, doneColumnIds, timeRange]);

    // Calcular tareas completadas en el rango de tiempo
    const completedTasksInRange = useMemo(() => {
        const today = new Date();
        let startDate = new Date();
        let endDate = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (timeRange === 'week') {
            startDate = today;
            endDate.setHours(23, 59, 59, 999);
            endDate.setDate(today.getDate() + 7);
        } else if (timeRange === 'month') {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (timeRange === 'last-month') {
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1, 0, 0, 0, 0);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        }
        
        return userTasks.filter(task => {
            const isCompleted = doneColumnIds.includes(task.columnId) || task.taskStatus === 'completed';
            if (!isCompleted) return false;
            
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                const inRange = dueDate >= startDate && dueDate <= endDate;
                if (inRange) return true;
            }
            
            if (task.updatedAt) {
                const updatedDate = new Date(task.updatedAt);
                const inRange = updatedDate >= startDate && updatedDate <= endDate;
                if (inRange) return true;
            }
            
            return false;
        }).length;
    }, [userTasks, doneColumnIds, timeRange]);

    // Calcular tareas retrasadas en el rango de tiempo
    const overdueTasksInRange = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return userTasks.filter(task => {
            const isCompleted = doneColumnIds.includes(task.columnId) || task.taskStatus === 'completed';
            if (isCompleted) return false;
            
            if (!task.dueDate) return false;
            
            const dueDate = new Date(task.dueDate);
            const isOverdue = dueDate < today;
            
            return isOverdue;
        }).length;
    }, [userTasks, doneColumnIds]);

    // Calcular métricas para "Proyectos"
    const myProjectsCount = useMemo(() => {
        return projects.filter(project => project.members.includes(currentUser.id)).length;
    }, [projects, currentUser.id]);

    const uniqueCollaboratorsCount = useMemo(() => {
        const myProjects = projects.filter(project => project.members.includes(currentUser.id));
        const allCollaborators = new Set<string>();
        
        myProjects.forEach(project => {
            project.members.forEach(memberId => {
                if (memberId !== currentUser.id) {
                    allCollaborators.add(memberId);
                }
            });
        });
        
        return allCollaborators.size;
    }, [projects, currentUser.id]);

    // Agrupar tareas por secciones
    const taskSections = useMemo((): TaskSection[] => {
        console.log('Organizando tareas en secciones:', userTasks);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        nextWeek.setHours(23, 59, 59, 999);

        // Tareas asignadas recientemente (últimos 7 días)
        const recentlyAssigned = userTasks.filter(task => {
            if (!task.createdAt) return false;
            const taskDate = new Date(task.createdAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            weekAgo.setHours(0, 0, 0, 0);
            return taskDate >= weekAgo;
        });

        // Tareas para hoy
        const todayTasks = userTasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === today.getTime();
        });

        // Tareas para la próxima semana (excluyendo hoy)
        const nextWeekTasks = userTasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate > today && dueDate <= nextWeek;
        });

        // Tareas para más tarde (sin fecha o fecha posterior a la próxima semana)
        const laterTasks = userTasks.filter(task => {
            if (!task.dueDate) return true;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate > nextWeek;
        });

        console.log('Secciones organizadas:', {
            recentlyAssigned: recentlyAssigned.length,
            todayTasks: todayTasks.length,
            nextWeekTasks: nextWeekTasks.length,
            laterTasks: laterTasks.length
        });

        return [
            {
                id: 'recently-assigned',
                title: 'Asignadas recientemente',
                tasks: recentlyAssigned,
                isExpanded: expandedSections.has('recently-assigned')
            },
            {
                id: 'today',
                title: 'Para hacer hoy',
                tasks: todayTasks,
                isExpanded: expandedSections.has('today')
            },
            {
                id: 'next-week',
                title: 'Para hacer la próxima semana',
                tasks: nextWeekTasks,
                isExpanded: expandedSections.has('next-week')
            },
            {
                id: 'later',
                title: 'Para hacer más tarde',
                tasks: laterTasks,
                isExpanded: expandedSections.has('later')
            }
        ];
    }, [userTasks, expandedSections]);

    const toggleSection = (sectionId: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedSections(newExpanded);
    };

    const handleTaskToggle = (taskId: string) => {
        if (onToggleComplete) {
            onToggleComplete(taskId);
        }
    };

    const getProjectName = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        return project ? project.name : 'Sin proyecto';
    };

    const getProjectColor = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        return project ? project.color : '#6366f1';
    };

    const getAssigneeName = (userId: string) => {
        const user = users.find(u => u.id === userId);
        return user ? `${user.firstName} ${user.lastName}` : 'Sin asignar';
    };

    const getAssigneeInitials = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return '?';
        return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    };

    const formatDueDate = (dueDate: string) => {
        if (!dueDate) return 'Sin fecha';
        const date = new Date(dueDate);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
    };

    const getTaskStatusIcon = (task: Task) => {
        if (task.taskStatus === 'completed' || doneColumnIds.includes(task.columnId)) {
            return <CheckCircleIcon />;
        }
        return <div className="w-4 h-4 rounded-full bg-blue-500" />;
    };

    const getTaskAttachments = (task: Task) => {
        // Simular archivos adjuntos basado en el título
        const hasAttachments = task.title.includes('información') || task.title.includes('equipos');
        return hasAttachments ? 1 : 0;
    };

    const getTaskComments = (task: Task) => {
        // Simular comentarios basado en el título
        const hasComments = task.title.includes('reunión') || task.title.includes('brief');
        return hasComments ? 1 : 0;
    };

    // Calcular tareas por categoría de filtro basado en fecha de inicio
    const noDateTasks = useMemo(() => {
        return normalizedTasks.filter(task => {
            if (task.taskStatus === 'completed' || doneColumnIds.includes(task.columnId)) return false;
            return !task.startDate && !task.dueDate;
        });
    }, [normalizedTasks, doneColumnIds]);

    const todayTasks = useMemo(() => {
        return normalizedTasks.filter(task => {
            if (task.taskStatus === 'completed' || doneColumnIds.includes(task.columnId)) return false;
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === today.getTime();
        });
    }, [normalizedTasks, doneColumnIds]);

    const nextDaysTasks = useMemo(() => {
        return normalizedTasks.filter(task => {
            if (task.taskStatus === 'completed' || doneColumnIds.includes(task.columnId)) return false;
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            const nextWeek = new Date();
            today.setHours(0, 0, 0, 0);
            nextWeek.setHours(0, 0, 0, 0);
            nextWeek.setDate(today.getDate() + 7);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate > today && dueDate < nextWeek;
        });
    }, [normalizedTasks, doneColumnIds]);

    const nextWeekTasks = useMemo(() => {
        return normalizedTasks.filter(task => {
            if (task.taskStatus === 'completed' || doneColumnIds.includes(task.columnId)) return false;
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            const nextWeek = new Date();
            const twoWeeks = new Date();
            nextWeek.setHours(0, 0, 0, 0);
            twoWeeks.setHours(0, 0, 0, 0);
            nextWeek.setDate(nextWeek.getDate() + 7);
            twoWeeks.setDate(twoWeeks.getDate() + 14);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate >= nextWeek && dueDate < twoWeeks;
        });
    }, [normalizedTasks, doneColumnIds]);

    const laterTasks = useMemo(() => {
        return normalizedTasks.filter(task => {
            if (task.taskStatus === 'completed' || doneColumnIds.includes(task.columnId)) return false;
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            const twoWeeks = new Date();
            twoWeeks.setHours(0, 0, 0, 0);
            twoWeeks.setDate(twoWeeks.getDate() + 14);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate >= twoWeeks;
        });
    }, [normalizedTasks, doneColumnIds]);

    const overdueTasks = useMemo(() => {
        return normalizedTasks.filter(task => {
            if (task.taskStatus === 'completed' || doneColumnIds.includes(task.columnId)) return false;
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate < today;
        });
    }, [normalizedTasks, doneColumnIds]);

    const columnTypes: CustomColumn[] = [
        { id: 'single-select', title: 'Selección única', type: 'single-select', icon: <ClockIcon /> },
        { id: 'multi-select', title: 'Selección múltiple', type: 'multi-select', icon: <CheckIcon /> },
        { id: 'date', title: 'Fecha', type: 'date', icon: <CalendarIcon /> },
        { id: 'people', title: 'Personas', type: 'people', icon: <UserGroupIcon /> },
        { id: 'text', title: 'Texto', type: 'text', icon: <span className="text-lg font-bold">A</span> },
        { id: 'number', title: 'Número', type: 'number', icon: <HashIcon /> },
        { id: 'formula', title: 'Fórmula', type: 'formula', icon: <FxIcon /> },
        { id: 'timer', title: 'Temporizador', type: 'timer', icon: <TimerIcon /> },
        { id: 'accumulation', title: 'Acumulación', type: 'accumulation', icon: <ArrowUpIcon /> }
    ];

    const addCustomColumn = (columnType: CustomColumn) => {
        const newColumn: CustomColumn = {
            id: `${columnType.type}-${Date.now()}`,
            title: columnType.title,
            type: columnType.type,
            icon: columnType.icon
        };
        setCustomColumns([...customColumns, newColumn]);
        setShowColumnMenu(false);
    };

    // Función para manejar el ordenamiento
    const handleSort = (column: string) => {
        setSortConfig(prev => {
            if (prev?.column === column) {
                return {
                    column,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc'
                };
            }
            return {
                column,
                direction: 'asc'
            };
        });
    };

    // Funciones para el menú contextual del título
    const handleTitleDropdownToggle = () => {
        setShowTitleDropdown(!showTitleDropdown);
    };

    const handleAddTask = () => {
        setShowTitleDropdown(false);
        onCreateTask();
    };

    const handleAddTaskWithAI = () => {
        setShowTitleDropdown(false);
        // TODO: Implementar creación de tarea con IA
        console.log('🔧 Crear tarea con IA');
    };

    const handleAddTaskWithEmail = () => {
        setShowTitleDropdown(false);
        // TODO: Implementar creación de tarea con email
        console.log('🔧 Crear tarea con email');
    };

    const handleSyncAndExport = () => {
        setShowTitleDropdown(false);
        // TODO: Implementar sincronización y exportación
        console.log('🔧 Sincronizar y exportar');
    };

    // Función para ordenar tareas dentro de una sección
    const sortTasksInSection = (tasks: Task[]): Task[] => {
        if (!sortConfig) return tasks;

        return [...tasks].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortConfig.column) {
                case 'name':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'dueDate':
                    aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
                    bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
                    break;
                case 'priority':
                    const priorityOrder: Record<Priority, number> = { 
                        [Priority.Low]: 1, 
                        [Priority.Medium]: 2, 
                        [Priority.High]: 3, 
                        [Priority.Urgent]: 4 
                    };
                    aValue = priorityOrder[a.priority] || 0;
                    bValue = priorityOrder[b.priority] || 0;
                    break;
                case 'project':
                    aValue = getProjectName(a.projectId || '').toLowerCase();
                    bValue = getProjectName(b.projectId || '').toLowerCase();
                    break;
                case 'assignee':
                    aValue = getAssigneeName(a.assignedTo || '').toLowerCase();
                    bValue = getAssigneeName(b.assignedTo || '').toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    // Verificación de seguridad
    if (!currentUser) {
        console.log('MyTasksView: currentUser es null o undefined');
        return <div className="h-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
        </div>;
    }

    // Verificar que las variables calculadas existen
    console.log('MyTasksView - Variables calculadas:');
    console.log('pendingTasksInRange:', pendingTasksInRange);
    console.log('completedTasksInRange:', completedTasksInRange);
    console.log('overdueTasksInRange:', overdueTasksInRange);
    console.log('myProjectsCount:', myProjectsCount);
    console.log('uniqueCollaboratorsCount:', uniqueCollaboratorsCount);

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 relative">
                            <div className="flex items-center space-x-2 cursor-pointer" onClick={handleTitleDropdownToggle}>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Mis tareas
                                </h1>
                                <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${showTitleDropdown ? 'rotate-180' : ''}`} />
                            </div>
                            
                            {/* Menú contextual del título */}
                            {showTitleDropdown && (
                                <div data-title-dropdown className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[200px]">
                                    <button
                                        onClick={handleAddTask}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center space-x-2"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        <span>Agregar tarea</span>
                                    </button>
                                    <button
                                        onClick={handleAddTaskWithAI}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center space-x-2"
                                    >
                                        <AIIcon className="w-4 h-4" />
                                        <span>Agregar tarea con IA</span>
                                    </button>
                                    <button
                                        onClick={handleAddTaskWithEmail}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center space-x-2"
                                    >
                                        <ChatBubbleLeftIcon className="w-4 h-4" />
                                        <span>Agregar tarea con email</span>
                                    </button>
                                    <button
                                        onClick={handleSyncAndExport}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center space-x-2"
                                    >
                                        <ArrowUpIcon className="w-4 h-4" />
                                        <span>Sincronizar y exportar</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Indicadores */}
                        <div className="flex items-start space-x-12">
                            <div className="text-center relative flex-1" ref={dropdownRef}>
                                <div className="flex items-center justify-center space-x-2 cursor-pointer mb-2" onClick={() => setShowTimeRangeDropdown(!showTimeRangeDropdown)}>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {timeRange === 'week' ? 'Mi semana' : timeRange === 'month' ? 'Mi mes' : 'Mi mes anterior'}
                                    </p>
                                    <ChevronDownIcon />
                                </div>
                                
                                {showTimeRangeDropdown && (
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[140px]">
                                        <button
                                            onClick={() => {
                                                setTimeRange('week');
                                                setShowTimeRangeDropdown(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                                timeRange === 'week' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            Mi semana
                            </button>
                                        <button
                                            onClick={() => {
                                                setTimeRange('month');
                                                setShowTimeRangeDropdown(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                                timeRange === 'month' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            Mi mes
                                        </button>
                                        <button
                                            onClick={() => {
                                                setTimeRange('last-month');
                                                setShowTimeRangeDropdown(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                                timeRange === 'last-month' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            Mi mes anterior
                            </button>
                                    </div>
                                )}
                                
                                <div className="flex items-center justify-center space-x-6">
                                    <div className="text-center min-w-[70px]">
                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {pendingTasksInRange}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Pendientes</p>
                                    </div>
                                    <div className="text-center min-w-[70px]">
                                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                            {overdueTasksInRange}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Retrasadas</p>
                                    </div>
                                    <div className="text-center min-w-[70px]">
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            {completedTasksInRange}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Finalizadas</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center flex-1">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Proyectos</p>
                                <div className="flex items-center justify-center space-x-8">
                                    <div className="text-center min-w-[80px]">
                                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                            {myProjectsCount}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Mis proyectos</p>
                                    </div>
                                    <div className="text-center min-w-[80px]">
                                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                            {uniqueCollaboratorsCount}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Colaboradores</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Navigation Tabs */}
                    <div className="flex items-center space-x-6 mt-4">
                        <button 
                            className={`px-3 py-2 rounded-md font-medium ${activeView === 'list' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
                            onClick={() => setActiveView('list')}
                        >
                            Lista
                        </button>
                        <button 
                            className={`px-3 py-2 rounded-md font-medium ${activeView === 'board' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
                            onClick={() => setActiveView('board')}
                        >
                            Tablero
                        </button>
                        <button 
                            className={`px-3 py-2 rounded-md font-medium ${activeView === 'calendar' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
                            onClick={() => setActiveView('calendar')}
                        >
                            Calendario
                        </button>
                        <button 
                            className={`px-3 py-2 rounded-md font-medium ${activeView === 'panel' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
                            onClick={() => setActiveView('panel')}
                        >
                            Panel
                        </button>
                        <button 
                            className={`px-3 py-2 rounded-md font-medium ${activeView === 'files' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
                            onClick={() => setActiveView('files')}
                        >
                            Archivos
                        </button>
                        <button className="px-2 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex space-x-1 mt-4">
                        <button
                            onClick={() => setActiveTaskTab('today')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTaskTab === 'today'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Para hacer hoy ({todayTasks.length})
                        </button>
                        <button
                            onClick={() => setActiveTaskTab('next-days')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTaskTab === 'next-days'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Para hacer en próximos días ({nextDaysTasks.length})
                        </button>
                        <button
                            onClick={() => setActiveTaskTab('next-week')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTaskTab === 'next-week'
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Para hacer la próxima semana ({nextWeekTasks.length})
                        </button>
                        <button
                            onClick={() => setActiveTaskTab('later')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTaskTab === 'later'
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Para hacer más tarde ({laterTasks.length})
                        </button>
                        <button
                            onClick={() => setActiveTaskTab('overdue')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTaskTab === 'overdue'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Tareas con retraso ({overdueTasks.length})
                        </button>
                        <button
                            onClick={() => setActiveTaskTab('no-date')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTaskTab === 'no-date'
                                    ? 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Asignadas sin fecha ({noDateTasks.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {/* Botón eliminado - ahora se accede desde el menú contextual del título */}
                    </div>
                    <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                            <FilterIcon className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                            <SortAscendingIcon className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                            <Squares2X2Icon className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                            <OptionsIcon className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                            <SearchIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800">
                {/* Table Header */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-6 gap-0 px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                        <div 
                            className="flex items-center justify-between border-r border-gray-200 dark:border-gray-700 pr-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => handleSort('name')}
                        >
                            <span>Nombre</span>
                            <div className="flex items-center">
                                {sortConfig?.column === 'name' ? (
                                    sortConfig.direction === 'asc' ? 
                                        <ArrowUpIcon className="w-3 h-3 text-blue-600" /> : 
                                        <ArrowDownIcon className="w-3 h-3 text-blue-600" />
                                ) : (
                                    <CircleIcon className="w-3 h-3 text-gray-400" />
                                )}
                            </div>
                        </div>
                        <div 
                            className="flex items-center justify-between border-r border-gray-200 dark:border-gray-700 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => handleSort('dueDate')}
                        >
                            <span>Fecha de entrega</span>
                            <div className="flex items-center">
                                {sortConfig?.column === 'dueDate' ? (
                                    sortConfig.direction === 'asc' ? 
                                        <ArrowUpIcon className="w-3 h-3 text-blue-600" /> : 
                                        <ArrowDownIcon className="w-3 h-3 text-blue-600" />
                                ) : (
                                    <CircleIcon className="w-3 h-3 text-gray-400" />
                                )}
                            </div>
                        </div>
                        <div 
                            className="flex items-center justify-between border-r border-gray-200 dark:border-gray-700 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => handleSort('assignee')}
                        >
                            <span>Colaboradores</span>
                            <div className="flex items-center">
                                {sortConfig?.column === 'assignee' ? (
                                    sortConfig.direction === 'asc' ? 
                                        <ArrowUpIcon className="w-3 h-3 text-blue-600" /> : 
                                        <ArrowDownIcon className="w-3 h-3 text-blue-600" />
                                ) : (
                                    <CircleIcon className="w-3 h-3 text-gray-400" />
                                )}
                            </div>
                        </div>
                        <div 
                            className="flex items-center justify-between border-r border-gray-200 dark:border-gray-700 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => handleSort('project')}
                        >
                            <span>Proyectos</span>
                            <div className="flex items-center">
                                {sortConfig?.column === 'project' ? (
                                    sortConfig.direction === 'asc' ? 
                                        <ArrowUpIcon className="w-3 h-3 text-blue-600" /> : 
                                        <ArrowDownIcon className="w-3 h-3 text-blue-600" />
                                ) : (
                                    <CircleIcon className="w-3 h-3 text-gray-400" />
                                )}
                            </div>
                        </div>
                        <div className="border-r border-gray-200 dark:border-gray-700 px-4">
                            <span>Visibilidad de la tarea</span>
                        </div>
                        <div className="relative px-4">
                            <button 
                                onClick={() => setShowColumnMenu(!showColumnMenu)}
                                className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <PlusIcon className="w-4 h-4" />
                            </button>
                            
                            {/* Column Menu */}
                            {showColumnMenu && (
                                <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Tipos de campo</h3>
                                    </div>
                                    <div className="py-2">
                                        {columnTypes.map((columnType) => (
                                            <button
                                                key={columnType.id}
                                                onClick={() => addCustomColumn(columnType)}
                                                className="w-full flex items-center space-x-3 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                {columnType.icon}
                                                <span>{columnType.title}</span>
                                                {(columnType.type === 'formula' || columnType.type === 'timer') && (
                                                    <span className="ml-auto text-xs text-blue-600 dark:text-blue-400">Nuevo</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                                        <button className="w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                                            Mostrar más
                                        </button>
                                    </div>
                                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                                        <button className="w-full flex items-center space-x-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <BookOpenIcon className="w-4 h-4" />
                                            <span>Desde la biblioteca</span>
                                            <ChevronRightIcon className="w-4 h-4 ml-auto" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabla de tareas */}
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]">
                    {(() => {
                        const tasksToShow = (() => {
                            switch (activeTaskTab) {
                                case 'no-date':
                                    return noDateTasks;
                                case 'today':
                                    return todayTasks;
                                case 'next-days':
                                    return nextDaysTasks;
                                case 'next-week':
                                    return nextWeekTasks;
                                case 'later':
                                    return laterTasks;
                                case 'overdue':
                                    return overdueTasks;
                                default:
                                    return noDateTasks;
                            }
                        })();
                        
                        if (tasksToShow.length === 0) {
                            return (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    No hay tareas en esta categoría
                                            </div>
                            );
                        }

                        return (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                                            Tarea
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                                            Proyecto
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                                            Fecha de entrega
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                                            Colaboradores
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                                            Visibilidad
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasksToShow.map(task => {
                                        const project = projects.find(p => p.id === task.projectId);
                                        const assignedUser = users.find(u => u.id === task.assignedTo);
                                        const projectMembers = project ? users.filter(u => project.members.includes(u.id) && u.id !== currentUser.id) : [];
                                        
                                        return (
                                            <tr 
                                            key={task.id}
                                                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                                onClick={() => onSelectTask(task)}
                                        >
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center space-x-3">
                                                        <input 
                                                            type="checkbox" 
                                                            className="rounded"
                                                            checked={task.taskStatus === 'completed' || doneColumnIds.includes(task.columnId)}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                if (onToggleComplete) {
                                                                    onToggleComplete(task.id);
                                                                }
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                        />
                                                            <span 
                                                            className={`text-gray-900 dark:text-white ${
                                                                task.taskStatus === 'completed' || doneColumnIds.includes(task.columnId) ? 'line-through text-gray-500 dark:text-gray-400' : ''
                                                            }`}
                                                            >
                                                                {task.title}
                                                            </span>
                                                        </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {project && (
                                                        <div className="flex items-center space-x-2">
                                                            <div 
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: project.color || '#6366f1' }}
                                                            />
                                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                                {project.name}
                                                            </span>
                                                                </div>
                                                            )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {task.dueDate ? (
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            {new Date(task.dueDate).toLocaleDateString('es-ES', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                            </span>
                                                        ) : (
                                                        <span className="text-sm text-gray-400 dark:text-gray-500">
                                                            Sin fecha
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center space-x-1">
                                                        {projectMembers.slice(0, 3).map(member => (
                                                            <div 
                                                                key={member.id}
                                                                className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300"
                                                                title={`${member.firstName} ${member.lastName}`}
                                                            >
                                                                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                                                </div>
                                            ))}
                                                        {projectMembers.length > 3 && (
                                                            <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-500 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                                                                +{projectMembers.length - 3}
                                        </div>
                                    )}
                                                        {projectMembers.length === 0 && (
                                                            <span className="text-sm text-gray-400 dark:text-gray-500">
                                                                Solo tú
                                                            </span>
                            )}
                        </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                        Público
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        );
                    })()}
                </div>

                {/* Add Section Button */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <button className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                        <PlusIcon className="w-4 h-4" />
                        <span>Agregar sección</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyTasksView; 