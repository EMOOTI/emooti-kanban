import React, { useEffect, useRef, useState } from 'react';
import { ChevronRightIcon } from './icons';

export interface ContextMenuAction {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    isDestructive?: boolean;
    hasSubmenu?: boolean;
    disabled?: boolean;
}

export type ContextMenuGroup = ContextMenuAction[];

interface ContextMenuProps {
    x: number;
    y: number;
    actionGroups: ContextMenuGroup[];
    onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, actionGroups, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: y, left: x, opacity: 0 });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        
        // Adjust position to fit viewport
        if (menuRef.current) {
            const menuRect = menuRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let newTop = y;
            let newLeft = x;

            if (x + menuRect.width > viewportWidth) {
                newLeft = x - menuRect.width;
            }
            if (y + menuRect.height > viewportHeight) {
                newTop = y - menuRect.height;
            }
            setPosition({ top: newTop, left: newLeft, opacity: 1 });
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [x, y, onClose]);

    const handleActionClick = (action: ContextMenuAction) => {
        action.onClick();
        onClose();
    };

    return (
        <div
            ref={menuRef}
            style={{ top: position.top, left: position.left, opacity: position.opacity }}
            className="absolute z-[100] w-60 bg-light-card dark:bg-dark-card rounded-lg shadow-2xl ring-1 ring-black ring-opacity-5 transition-opacity duration-100"
            onClick={(e) => e.stopPropagation()}
        >
            {actionGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="p-1">
                    {groupIndex > 0 && <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />}
                    <ul>
                        {group.map((action, actionIndex) => (
                            <li key={actionIndex}>
                                <button
                                    onClick={() => !action.disabled && handleActionClick(action)}
                                    disabled={action.disabled}
                                    className={`w-full text-left flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                                        action.disabled
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : action.isDestructive
                                            ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50'
                                            : 'text-light-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        {action.icon && <span className="mr-3 h-5 w-5 flex items-center justify-center">{action.icon}</span>}
                                        <span>{action.label}</span>
                                    </div>
                                    {action.hasSubmenu && <span className="text-light-text-secondary dark:text-dark-text-secondary"><ChevronRightIcon /></span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default ContextMenu;