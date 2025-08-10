
import React, { useState } from 'react';
import { User, UserRole, Group, Id } from '../types';
import { UserPlusIcon, UsersGroupIcon, PencilIcon, TrashIcon } from './icons';

interface UsersViewProps {
    users: User[];
    groups: Group[];
    allUsers: User[];
    currentUser: User | null;
    onAddUserClick: () => void;
    onSelectUser: (user: User) => void;
    onAddGroupClick: () => void;
    onSelectGroup: (group: Group) => void;
    onDeleteGroup: (groupId: Id) => void;
}

const UsersView: React.FC<UsersViewProps> = ({ users, groups, allUsers, currentUser, onAddUserClick, onSelectUser, onAddGroupClick, onSelectGroup, onDeleteGroup }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');
    
    const canEditUser = (user: User) => {
        if (!currentUser) return false;
        return currentUser.role === UserRole.Admin || currentUser.role === UserRole.ProjectManager || currentUser.id === user.id;
    };

    const isAdmin = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.ProjectManager;

    const renderUsers = () => (
        <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-xs uppercase">
                        <tr>
                            <th className="p-4 font-semibold">Nombre</th>
                            <th className="p-4 font-semibold">Contacto</th>
                            <th className="p-4 font-semibold">Rol</th>
                            <th className="p-4 font-semibold">Cargo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-light-border dark:divide-dark-border">
                        {users.map(user => (
                            <tr key={user.id} onClick={() => canEditUser(user) && onSelectUser(user)} className={canEditUser(user) ? 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer' : ''}>
                                <td className="p-4 flex items-center">
                                    <img src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} className="w-10 h-10 rounded-full mr-4 cursor-pointer group relative" />
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                                        {user.firstName} {user.lastName}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                    <span className="font-medium text-light-text dark:text-dark-text">{user.firstName} {user.lastName}</span>
                                </td>
                                <td className="p-4">
                                    <div>{user.email}</div>
                                    <div className="text-xs">{user.phone}</div>
                                </td>
                                <td className="p-4 capitalize">{user.role.replace('_', ' ')}</td>
                                <td className="p-4">{user.position}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {users.map(user => (
                    <div key={user.id} onClick={() => canEditUser(user) && onSelectUser(user)} className={`bg-light-bg dark:bg-dark-bg p-4 rounded-lg shadow-md border border-light-border dark:border-dark-border ${canEditUser(user) ? 'active:bg-gray-100 dark:active:bg-gray-800 cursor-pointer' : ''}`}>
                        <div className="flex items-center mb-4">
                            <img src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} className="w-12 h-12 rounded-full mr-4 cursor-pointer group relative" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                                {user.firstName} {user.lastName}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                            <div>
                                <p className="font-bold text-light-text dark:text-dark-text">{user.firstName} {user.lastName}</p>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{user.position}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
    
    const renderGroups = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(group => {
                const members = allUsers.filter(u => group.memberIds.includes(u.id));
                return (
                    <div key={group.id} className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg shadow-md border border-light-border dark:border-dark-border flex flex-col justify-between">
                        <div>
                            <div className="flex items-center mb-4">
                                <img src={group.avatarUrl} alt={group.name} className="w-12 h-12 rounded-full mr-4 object-cover cursor-pointer group relative" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                                    {group.name}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-light-text dark:text-dark-text">{group.name}</p>
                                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{group.memberIds.length} miembro(s)</p>
                                </div>
                            </div>
                            <div className="flex -space-x-2 my-4">
                                {members.slice(0, 7).map(user => (
                                    <div key={user.id} className="relative">
                                        <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 cursor-pointer group relative" src={user.avatarUrl} alt={user.firstName} title={`${user.firstName} ${user.lastName}`} />
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                                            {user.firstName} {user.lastName}
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                    </div>
                                ))}
                                {members.length > 7 && (
                                     <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-800 text-xs">
                                        +{members.length - 7}
                                    </div>
                                )}
                            </div>
                        </div>
                        {isAdmin && (
                            <div className="flex justify-end items-center gap-2 mt-4 border-t border-light-border dark:border-dark-border pt-2">
                                <button onClick={() => onSelectGroup(group)} className="p-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-primary rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                    <PencilIcon />
                                </button>
                                <button onClick={() => onDeleteGroup(group.id)} className="p-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                    <TrashIcon />
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="p-4 md:p-6 bg-light-card dark:bg-dark-card rounded-xl shadow-lg h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">Gestión de Equipos</h2>
                    {isAdmin && (
                        <button 
                            onClick={activeTab === 'users' ? onAddUserClick : onAddGroupClick} 
                            className="flex items-center justify-center px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition-colors duration-200 text-sm w-32 h-9"
                        >
                            <span>Añadir {activeTab === 'users' ? 'Usuario' : 'Grupo'}</span>
                        </button>
                    )}
                </div>

                <div className="border-b border-light-border dark:border-dark-border mb-6">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`${
                                activeTab === 'users'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                        >
                            Usuarios ({users.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('groups')}
                            className={`${
                                activeTab === 'groups'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                        >
                            Grupos ({groups.length})
                        </button>
                    </nav>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto">
                {activeTab === 'users' ? renderUsers() : renderGroups()}
            </div>
        </div>
    );
};

export default UsersView;
