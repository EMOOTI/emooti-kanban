import React, { useState, useRef, useEffect } from 'react';
import { 
    PlusIcon, 
    CheckCircleIcon, 
    UserGroupIcon, 
    UserPlusIcon,
    BriefcaseIcon
} from './icons';

interface CreateMenuProps {
    onCreateTask: () => void;
    onCreateProject: () => void;
    onCreateTeam: () => void;
    onCreateUser: () => void;
}

const CreateMenu: React.FC<CreateMenuProps> = ({
    onCreateTask,
    onCreateProject,
    onCreateTeam,
    onCreateUser
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOptionClick = (action: () => void) => {
        console.log('🎯 CreateMenu: handleOptionClick llamado');
        action();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
            >
                <span>Crear</span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-1">
                        <button
                            onClick={() => handleOptionClick(onCreateTask)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <CheckCircleIcon />
                            <span>Tarea</span>
                        </button>
                        
                        <button
                            onClick={() => handleOptionClick(onCreateProject)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <BriefcaseIcon />
                            <span>Proyecto</span>
                        </button>
                        
                        <button
                            onClick={() => {
                                console.log('🎯 CreateMenu: Botón Equipo clickeado - ABRIENDO MODAL');
                                console.log('🎯 onCreateTeam function:', typeof onCreateTeam);
                                handleOptionClick(onCreateTeam);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <UserGroupIcon />
                            <span>Equipo</span>
                        </button>
                        
                        <button
                            onClick={() => handleOptionClick(onCreateUser)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <UserPlusIcon />
                            <span>Usuario</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateMenu; 