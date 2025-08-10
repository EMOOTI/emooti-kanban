import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Project, Task, User, Priority, Column } from '../types';
import { PRIORITY_STYLES } from '../constants';
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
    ShieldCheckIcon,
    PlayIcon,
    BookOpenIcon,
    StarIcon
} from './icons';

interface HomeDashboardViewProps {
    currentUser: User;
    projects: Project[];
    tasks: Task[];
    users: User[];
    columns: Column[];
    onSelectTask: (task: Task) => void;
    onCreateTask: () => void;
    onSelectProject?: (projectId: string) => void;
    onCreateProject?: () => void;
    onToggleComplete?: (taskId: string) => void;
}

const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
    currentUser,
    projects,
    tasks,
    users,
    columns,
    onSelectTask,
    onCreateTask,
    onSelectProject,
    onCreateProject,
    onToggleComplete
}) => {
    console.log('=== HomeDashboardView RENDERIZADO ===');
    console.log('tasks recibidas:', tasks.length);
    console.log('currentUser:', currentUser.id);
    console.log('columns:', columns);
    console.log('=== FIN HomeDashboardView ===');
    const [activeTaskTab, setActiveTaskTab] = useState<'upcoming' | 'overdue' | 'completed'>('upcoming');
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'last-month'>('week');
    const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Cerrar el desplegable cuando se hace clic fuera
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

    // Identificar columnas de tareas completadas
    const doneColumnIds = columns.filter(col => col.isDoneColumn).map(col => col.id);

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
        console.log('=== NORMALIZACIÓN DE TAREAS ===');
        console.log('Tareas originales:', tasks);
        const normalized = tasks.map(normalizeTask);
        console.log('Tareas normalizadas:', normalized);
        console.log('=== FIN NORMALIZACIÓN ===');
        return normalized;
    }, [tasks, currentUser.id]);

    // Filtrar tareas del usuario actual
    const userTasks = useMemo(() => {
        console.log('=== FILTRADO DE TAREAS ===');
        console.log('Tareas normalizadas:', normalizedTasks);
        console.log('Usuario actual ID:', currentUser.id);
        const filtered = normalizedTasks.filter(task => {
            const isAssignedToUser = task.assignedTo === currentUser.id;
            console.log(`Tarea "${task.title}": assignedTo="${task.assignedTo}", isAssigned=${isAssignedToUser}`);
            return isAssignedToUser;
        });
        console.log('Tareas filtradas del usuario:', filtered);
        console.log('Total de tareas filtradas:', filtered.length);
        console.log('=== FIN FILTRADO ===');
        return filtered;
    }, [normalizedTasks, currentUser.id]);

    // Calcular métricas para "Mi semana/mes"
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
            // Para el mes actual, usar el primer día del mes actual
            startDate = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (timeRange === 'last-month') {
            // Para el mes anterior, usar el primer día del mes anterior
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1, 0, 0, 0, 0);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        }
        
        return userTasks.filter(task => {
            // 1. No debe estar completada
            const isCompleted = doneColumnIds.includes(task.columnId) || task.taskStatus === 'completed';
            if (isCompleted) return false;
            
            // 2. Debe tener fecha de vencimiento
            if (!task.dueDate) return false;
            
            const dueDate = new Date(task.dueDate);
            
            // 3. No debe estar atrasada (fecha de vencimiento debe ser hoy o en el futuro)
            if (dueDate < today) return false;
            
            // 4. Debe estar dentro del rango de tiempo seleccionado
            const inRange = dueDate >= startDate && dueDate <= endDate;
            
            console.log(`Tarea "${task.title}": dueDate="${task.dueDate}", isCompleted=${isCompleted}, isOverdue=${dueDate < today}, inRange=${inRange}`);
            
            return inRange;
        }).length;
    }, [userTasks, doneColumnIds, timeRange]);

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
            // Para el mes actual, usar el primer día del mes actual
            startDate = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (timeRange === 'last-month') {
            // Para el mes anterior, usar el primer día del mes anterior
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1, 0, 0, 0, 0);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        }
        
        console.log('=== CÁLCULO TAREAS COMPLETADAS ===');
        console.log('Rango de tiempo:', timeRange);
        console.log('Fecha inicio:', today.toISOString());
        console.log('Fecha fin:', endDate.toISOString());
        console.log('Columnas done:', doneColumnIds);
        console.log('Tareas del usuario:', userTasks.length);
        
        const completedTasks = userTasks.filter(task => {
            // Contar tareas completadas que:
            // 1. Están en una columna de "done" O tienen taskStatus = 'completed'
            const isCompleted = doneColumnIds.includes(task.columnId) || task.taskStatus === 'completed';
            
            console.log(`Tarea "${task.title}": isCompleted=${isCompleted}, columnId=${task.columnId}, taskStatus=${task.taskStatus}`);
            
            if (!isCompleted) return false;
            
            // 2. Tienen fecha de vencimiento en el rango especificado
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                const inRange = dueDate >= startDate && dueDate <= endDate;
                console.log(`  - dueDate=${task.dueDate}, inRange=${inRange}`);
                if (inRange) return true;
            }
            
            // 3. O fueron completadas recientemente (en el rango especificado)
            if (task.updatedAt) {
                const updatedDate = new Date(task.updatedAt);
                const inRange = updatedDate >= startDate && updatedDate <= endDate;
                console.log(`  - updatedAt=${task.updatedAt}, inRange=${inRange}`);
                if (inRange) return true;
            }
            
            console.log(`  - No cumple criterios de rango`);
            return false;
        });
        
        console.log('Tareas completadas en rango:', completedTasks.length);
        console.log('=== FIN CÁLCULO ===');
        
        return completedTasks.length;
    }, [userTasks, doneColumnIds, timeRange]);

    // Calcular tareas retrasadas en el rango de tiempo
    const overdueTasksInRange = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return userTasks.filter(task => {
            // Tareas retrasadas: están sin completar Y su fecha de vencimiento ya pasó
            const isCompleted = doneColumnIds.includes(task.columnId) || task.taskStatus === 'completed';
            if (isCompleted) return false;
            
            if (!task.dueDate) return false;
            
            const dueDate = new Date(task.dueDate);
            const isOverdue = dueDate < today;
            
            // Solo contar tareas retrasadas (fecha ya pasó)
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

    // --- Agrupación de tareas por estado para las pestañas ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueTasks = useMemo(() => {
        console.log('=== AGRUPACIÓN DE TAREAS ===');
        console.log('Tareas del usuario:', userTasks);
        console.log('Columnas completadas:', doneColumnIds);
        
        const overdue = userTasks.filter(task => {
            if (!task.dueDate) return false;
            const due = new Date(task.dueDate);
            const isCompleted = doneColumnIds.includes(task.columnId) || task.taskStatus === 'completed';
            const isOverdue = due < today && !isCompleted;
            console.log(`Tarea "${task.title}": dueDate="${task.dueDate}", isOverdue=${isOverdue}, isCompleted=${isCompleted}`);
            return isOverdue;
        });
        console.log('Tareas con retraso:', overdue.length);
        return overdue;
    }, [userTasks, doneColumnIds]);

    const upcomingTasks = useMemo(() => {
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
        
        const upcoming = userTasks.filter(task => {
            // 1. No debe estar completada
            const isCompleted = doneColumnIds.includes(task.columnId) || task.taskStatus === 'completed';
            if (isCompleted) return false;
            
            // 2. Debe tener fecha de vencimiento
            if (!task.dueDate) return false;
            
            const dueDate = new Date(task.dueDate);
            
            // 3. No debe estar atrasada (fecha de vencimiento debe ser hoy o en el futuro)
            if (dueDate < today) return false;
            
            // 4. Debe estar dentro del rango de tiempo seleccionado
            const inRange = dueDate >= startDate && dueDate <= endDate;
            
            console.log(`Tarea "${task.title}": dueDate="${task.dueDate}", isCompleted=${isCompleted}, isOverdue=${dueDate < today}, inRange=${inRange}`);
            return inRange;
        });
        console.log('Tareas próximas (según rango de tiempo):', upcoming.length);
        return upcoming;
    }, [userTasks, doneColumnIds, timeRange]);

    const completedTasks = useMemo(() => {
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
        
        const completed = userTasks.filter(task => {
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
            
            console.log(`Tarea "${task.title}": isCompleted=${isCompleted}, dueDate="${task.dueDate}", updatedAt="${task.updatedAt}"`);
            return false;
        });
        console.log('Tareas finalizadas (según rango de tiempo):', completed.length);
        console.log('=== FIN AGRUPACIÓN ===');
        return completed;
    }, [userTasks, doneColumnIds, timeRange]);

    const getProjectTasksCount = (projectId: string) => {
        return userTasks.filter(task => task.projectId === projectId).length;
    };

    const getCurrentDate = () => {
        const now = new Date();
        const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        
        const weekday = weekdays[now.getDay()];
        const day = now.getDate();
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        
        return `${weekday}, ${day} de ${month} de ${year}`;
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    const tutorialCards = [
        {
            id: 1,
            title: 'Primeros pasos',
            description: 'Aprende los conceptos básicos para empezar a usar emooti de manera efectiva.',
            duration: '3 minutos',
            icon: ChartBarIcon,
            color: 'bg-blue-500'
        },
        {
            id: 2,
            title: 'Automatiza el trabajo con las reglas',
            description: 'Optimiza tu trabajo automatizando tareas repetitivas y flujos de trabajo.',
            duration: '3 minutos',
            icon: PlayIcon,
            color: 'bg-green-500'
        },
        {
            id: 3,
            title: 'Desarrolla tu plan estratégico',
            description: 'Descubre las mejores prácticas para crear y ejecutar planes estratégicos exitosos.',
            duration: 'Lectura de 10 minutos',
            icon: BookOpenIcon,
            color: 'bg-purple-500'
        },
        {
            id: 4,
            title: 'Evita los silos de información',
            description: 'Conecta tus proyectos y equipos para una mejor colaboración y visibilidad.',
            duration: 'Lectura de 10 minutos',
            icon: StarIcon,
            color: 'bg-orange-500'
        }
    ];

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 h-full min-h-0">
            {/* Header principal */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {getCurrentDate()}
                        </p>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {getGreeting()}, {currentUser.firstName}
                        </h1>
                    </div>
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
            </div>

            {/* Contenido principal con padding */}
            <div className="p-6 space-y-6">
                {/* Sección "Aprende a usar emooti" */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Aprende a usar emooti
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {tutorialCards.map((card) => {
                            const IconComponent = card.icon;
                            return (
                                <div 
                                    key={card.id}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                                            <IconComponent />
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {card.duration}
                                        </span>
                                    </div>
                                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                                        {card.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {card.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sección "Mis tareas" */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <ShieldCheckIcon />
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Mis tareas
                            </h2>
                        </div>
                        <button 
                            onClick={onCreateTask}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center text-sm w-32 h-9"
                        >
                            <span>Crear tarea</span>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-1 mb-4">
                        <button
                            onClick={() => setActiveTaskTab('upcoming')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTaskTab === 'upcoming'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Próximas ({upcomingTasks.length})
                        </button>
                        <button
                            onClick={() => setActiveTaskTab('overdue')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTaskTab === 'overdue'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Con retraso ({overdueTasks.length})
                        </button>
                        <button
                            onClick={() => setActiveTaskTab('completed')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTaskTab === 'completed'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            Finalizadas ({completedTasks.length})
                        </button>
                    </div>

                    {/* Tabla de tareas */}
                    <div className="overflow-x-auto">
                        {(() => {
                            const tasksToShow = activeTaskTab === 'upcoming' ? upcomingTasks 
                                : activeTaskTab === 'overdue' ? overdueTasks 
                                : completedTasks;
                            
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
                                        {tasksToShow.slice(0, 5).map(task => {
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
                                                            <span className={`text-sm ${
                                                                activeTaskTab === 'overdue' ? 'text-red-500 font-medium' : 'text-gray-600 dark:text-gray-400'
                                            }`}>
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
                </div>

                {/* Sección "Proyectos" */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Proyectos
                            </h2>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Recientes</span>
                        </div>
                        <button 
                            onClick={onCreateProject}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center text-sm w-32 h-9"
                        >
                            <span>Crear proyecto</span>
                        </button>
                    </div>

                    <div className="space-y-3">
                        {projects.slice(0, 5).map(project => (
                            <div 
                                key={project.id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                onClick={() => onSelectProject?.(project.id)}
                            >
                                <div className="flex items-center space-x-3">
                                    <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: project.color || '#6366f1' }}
                                    />
                                    <span className="text-gray-900 dark:text-white">
                                        {project.name}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span>{getProjectTasksCount(project.id)} tareas</span>
                                    {getProjectTasksCount(project.id) === 0 && (
                                        <span className="text-xs">Sin tareas pendientes</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeDashboardView; 