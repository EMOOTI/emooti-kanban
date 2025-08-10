


import React from 'react';
import { Project, Task, Activity, User, Priority, Column } from '../types';
import { PRIORITY_STYLES } from '../constants';
import { CheckCircleIcon } from './icons';

interface DashboardViewProps {
    project: Project;
    tasks: Task[];
    columns: Column[];
    activities: Activity[];
    currentUser: User;
    onSelectTask: (task: Task) => void;
    onToggleComplete?: (taskId: string) => void;
    users: User[];
}

const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return `hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `hace ${Math.floor(interval)} días`;
    interval = seconds / 3600;
    if (interval > 1) return `hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `hace ${Math.floor(interval)} minutos`;
    return 'justo ahora';
};


const DashboardView: React.FC<DashboardViewProps> = ({ project, tasks, columns, activities, currentUser, onSelectTask, onToggleComplete, users }) => {
    
    const myTasks = tasks; // Todas las tareas para todos
    
    const doneColumnIds = columns.filter(c => c.isDoneColumn).map(c => c.id);
        
    // Considerar tanto columnas "done" como taskStatus "completed"
    const completedTasks = tasks.filter(t => 
        doneColumnIds.includes(t.columnId) || t.taskStatus === 'completed'
    ).length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Tareas pendientes: no están en columnas "done" Y no tienen taskStatus "completed"
    const myPendingTasks = myTasks.filter(t => 
        !doneColumnIds.includes(t.columnId) && t.taskStatus !== 'completed'
    );

    return (
        <div className="p-4 md:p-6 overflow-y-auto h-full">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">Resumen de {project.name}</h1>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{project.description}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-light-card dark:bg-dark-card rounded-xl shadow-md">
                    <h3 className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary">Progreso Total</h3>
                    <div className="flex items-center justify-between mt-1">
                         <span className="text-2xl font-bold">{progress}%</span>
                         <div className="w-10 h-10">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                                <path className="text-gray-200 dark:text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${progress}, 100`} strokeLinecap="round" transform="rotate(-90 18 18)"/>
                            </svg>
                         </div>
                    </div>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">{completedTasks} de {totalTasks} tareas completadas</p>
                </div>
                <div className="p-4 bg-light-card dark:bg-dark-card rounded-xl shadow-md">
                    <h3 className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary">Tareas Asignadas a Mí</h3>
                    <p className="text-3xl font-bold mt-1">{myTasks.length}</p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">Tienes {myPendingTasks.length} tareas pendientes.</p>
                </div>
                 <div className="p-4 bg-light-card dark:bg-dark-card rounded-xl shadow-md">
                    <h3 className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary">Miembros del Proyecto</h3>
                    <div className="flex -space-x-2 mt-2">
                        {users.slice(0, 5).map(user => (
                            <div className="relative">
                                <img key={user!.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-dark-card cursor-pointer group relative" src={user!.avatarUrl} alt={user!.firstName} title={user!.firstName} />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                                    {user!.firstName} {user!.lastName}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                </div>
                            </div>
                        ))}
                        {users.length > 5 && (
                            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-dark-card text-xs">
                                +{users.length - 5}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">{users.length} miembros en total.</p>
                </div>
            </div>

            {/* My Tasks & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8">
                {/* My Tasks */}
                <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-md p-4">
                    <h3 className="text-lg font-bold mb-3">Mis Tareas Pendientes</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {myPendingTasks.length > 0 ? (
                             myPendingTasks.sort((a,b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()).map(task => (
                                <div key={task.id} className="p-2 rounded-lg flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <div className="flex items-center space-x-2 flex-1 cursor-pointer" onClick={() => onSelectTask(task)}>
                                        <div>
                                            <p className="text-sm font-semibold">{task.title}</p>
                                            <p className={`text-xs font-medium px-1 py-0.5 rounded-full inline-block mt-1 text-white ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES', {month: 'short', day: 'numeric'}) : 'Sin fecha'}
                                        </div>
                                        {onToggleComplete && (
                                            <input
                                                type="checkbox"
                                                className="rounded"
                                                checked={task.taskStatus === 'completed'}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    onToggleComplete(task.id);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                onMouseDown={(e) => e.stopPropagation()}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center py-5">
                                <CheckCircleIcon />
                                <p className="mt-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">¡Todo al día! No tienes tareas pendientes en este proyecto.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-md p-4">
                    <h3 className="text-lg font-bold mb-3">Actividad Reciente</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                        {activities.slice(0, 10).map(activity => (
                            <div key={activity.id} className="flex items-start space-x-2">
                                <img src={activity.user.avatarUrl} alt={activity.user.firstName} className="h-6 w-6 rounded-full cursor-pointer group relative" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                                    {activity.user.firstName} {activity.user.lastName}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                </div>
                                <div>
                                    <p className="text-xs">
                                        <span className="font-bold">{activity.user.firstName} {activity.user.lastName}</span> {activity.action} <span className="font-semibold text-primary">"{activity.entityTitle}"</span>
                                    </p>
                                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{timeAgo(activity.timestamp)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


        </div>
    );
};

export default DashboardView;
