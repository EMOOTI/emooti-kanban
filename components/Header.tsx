
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { MenuIcon, SunIcon, MoonIcon, ArrowLeftIcon, BellIcon, CheckCircleIcon } from './icons';
import { User, Notification } from '../types';

interface HeaderProps {
    currentUser: User | null;
    onLogout: () => void;
    onMenuClick: () => void;
    onBackToProjects: () => void;
    projectName?: string;
    notifications: Notification[];
    onMarkNotificationsAsRead: () => void;
}

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


const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onMenuClick, onBackToProjects, projectName, notifications, onMarkNotificationsAsRead }) => {
    const { theme, toggleTheme } = useTheme();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    const userNotifications = useMemo(() => {
        if (!currentUser) return [];
        return notifications.filter(n => n.userId === currentUser.id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [notifications, currentUser]);

    const unreadCount = useMemo(() => userNotifications.filter(n => !n.read).length, [userNotifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!currentUser) return null;

    return (
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card">
            <div className="flex items-center">
                {projectName ? (
                    <>
                        <button onClick={onMenuClick} className="md:hidden mr-4 p-1 rounded-md text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700">
                            <MenuIcon />
                        </button>
                        <h1 className="text-xl font-semibold">{projectName}</h1>
                    </>
                ) : (
                    <h1 className="text-xl font-semibold">Mis Proyectos</h1>
                )}
            </div>
            <div className="flex items-center space-x-4">
                <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
                    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
                
                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                    <button onClick={() => setIsNotifOpen(prev => !prev)} className="p-2 rounded-full relative hover:bg-gray-200 dark:hover:bg-gray-700">
                        <BellIcon />
                        {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-dark-card" />}
                    </button>
                    {isNotifOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-light-card dark:bg-dark-card rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                            <div className="p-3 flex justify-between items-center border-b border-light-border dark:border-dark-border">
                                <h3 className="font-semibold">Notificaciones</h3>
                                {unreadCount > 0 && (
                                    <button onClick={onMarkNotificationsAsRead} className="text-xs text-primary hover:underline">Marcar todas como leídas</button>
                                )}
                            </div>
                            <ul className="max-h-80 overflow-y-auto">
                                {userNotifications.length > 0 ? userNotifications.map(n => (
                                    <li key={n.id} className={`p-3 border-b border-light-border dark:border-dark-border last:border-b-0 ${!n.read ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                                        <p className="text-sm">{n.message}</p>
                                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">{timeAgo(n.timestamp)}</p>
                                    </li>
                                )) : (
                                    <p className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary p-6">No tienes notificaciones.</p>
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                        <img src={currentUser.avatarUrl} alt="User Avatar" className="w-9 h-9 rounded-full ring-2 ring-offset-2 ring-primary cursor-pointer group relative" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                            {currentUser.firstName} {currentUser.lastName}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-light-card dark:bg-dark-card rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20">
                            <div className="px-4 py-2 border-b border-light-border dark:border-dark-border">
                                <p className="text-sm font-medium truncate">{currentUser.firstName} {currentUser.lastName}</p>
                                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary truncate">{currentUser.email}</p>
                            </div>
                            <button
                                onClick={() => {
                                    onLogout();
                                    setIsDropdownOpen(false);
                                }}
                                className="w-full text-left block px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;