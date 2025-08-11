import React, { useState, useRef, useEffect } from 'react';
import { Project, User, Notification } from '../types';
import { 
    Squares2X2Icon,
    CalendarDaysIcon,
    ChartBarIcon,
    ArrowLeftIcon,
    SettingsIcon,
    SunIcon,
    MoonIcon,
    BellIcon
} from './icons';
import { useTheme } from '../hooks/useTheme';

interface ProjectHeaderProps {
    project: Project;
    currentView: 'board' | 'timeline' | 'dashboard';
    onViewChange: (view: 'board' | 'timeline' | 'dashboard') => void;
    onBackToProjects: () => void;
    onOpenSettings: () => void;
    currentUser: User | null;
    onLogout: () => void;
    notifications: Notification[];
    onMarkNotificationsAsRead: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
    project,
    currentView,
    onViewChange,
    onBackToProjects,
    onOpenSettings,
    currentUser,
    onLogout,
    notifications,
    onMarkNotificationsAsRead
}) => {
    const { theme, toggleTheme } = useTheme();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    const userNotifications = notifications.filter(n => n.userId === currentUser?.id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const unreadCount = userNotifications.filter(n => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " años";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " meses";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " días";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " horas";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutos";
        return "Ahora";
    };
    const viewOptions = [
        { id: 'board', label: 'Panel', icon: Squares2X2Icon },
        { id: 'timeline', label: 'Cronograma', icon: CalendarDaysIcon },
        { id: 'dashboard', label: 'Resumen', icon: ChartBarIcon }
    ] as const;

    return (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4">
                {/* Header superior */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={onBackToProjects}
                            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            <ArrowLeftIcon />
                            <span className="ml-2">Proyectos</span>
                        </button>
                        <div className="flex items-center space-x-3">
                            <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: project.color || '#6366f1' }}
                            />
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {project.name}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={onOpenSettings}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Configuración del proyecto"
                        >
                            <SettingsIcon />
                        </button>
                        
                        {/* Theme Toggle */}
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                        </button>
                        
                        {/* Notifications Bell */}
                        <div className="relative" ref={notifRef}>
                            <button onClick={() => setIsNotifOpen(prev => !prev)} className="p-2 rounded-full relative hover:bg-gray-200 dark:hover:bg-gray-700">
                                <BellIcon />
                                {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />}
                            </button>
                            {isNotifOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                                    <div className="p-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                                        <h3 className="font-semibold">Notificaciones</h3>
                                        {unreadCount > 0 && (
                                            <button onClick={onMarkNotificationsAsRead} className="text-xs text-blue-600 hover:underline">Marcar todas como leídas</button>
                                        )}
                                    </div>
                                    <ul className="max-h-80 overflow-y-auto">
                                        {userNotifications.length > 0 ? userNotifications.map(n => (
                                            <li key={n.id} className={`p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${!n.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                                <p className="text-sm">{n.message}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeAgo(n.timestamp)}</p>
                                            </li>
                                        )) : (
                                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 p-6">No tienes notificaciones.</p>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* User Dropdown */}
                        {currentUser && (
                            <div className="relative" ref={dropdownRef}>
                                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                    <img src={currentUser.avatarUrl} alt="User Avatar" className="w-9 h-9 rounded-full ring-2 ring-offset-2 ring-blue-500 cursor-pointer group relative" />
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                                        {currentUser.firstName} {currentUser.lastName}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20">
                                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                                            <p className="text-sm font-medium truncate">{currentUser.firstName} {currentUser.lastName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                onLogout();
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Menú horizontal de vistas */}
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    {viewOptions.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => onViewChange(id)}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                currentView === id
                                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <Icon />
                            <span className="ml-2">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProjectHeader; 