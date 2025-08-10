

import React, { useState, useRef, useEffect } from 'react';
import { Column as ColumnType, Id } from '../types';
import { PlusIcon, DotsHorizontalIcon, PencilIcon, TrashIcon, PaletteIcon } from './icons';
import { ColorService } from '../services/colorService';

interface ColumnProps {
    column: ColumnType;
    children: React.ReactNode;
    onTaskDrop: (columnId: Id) => void;
    addTask: () => void;
    onEdit: () => void;
    onDelete: () => void;
    draggedColumnId: Id | null;
    onColumnDragStart: (columnId: Id) => void;
    onColumnDrop: (columnId: Id) => void;
    onColumnDragEnd: () => void;
}

const Column: React.FC<ColumnProps> = ({ 
    column, 
    children, 
    onTaskDrop, 
    addTask, 
    onEdit, 
    onDelete, 
    draggedColumnId, 
    onColumnDragStart, 
    onColumnDrop, 
    onColumnDragEnd 
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (draggedColumnId && draggedColumnId !== column.id) {
            setIsDragOver(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (draggedColumnId) {
            onColumnDrop(column.id);
        } else {
            onTaskDrop(column.id);
        }
    };

    const handleHeaderDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        onColumnDragStart(column.id);
        e.dataTransfer.effectAllowed = 'move';
        // setData is required for Firefox to initiate drag
        e.dataTransfer.setData('text/plain', column.id.toString());
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const textColor = ColorService.getContrastingTextColor(column.color);
    const isBeingDragged = draggedColumnId === column.id;

    return (
        <div 
            className={`w-[85vw] md:w-72 lg:w-80 flex-shrink-0 snap-center transition-all duration-200 ${isBeingDragged ? 'opacity-30' : 'opacity-100'} ${isDragOver && !isBeingDragged ? 'outline outline-2 outline-primary outline-offset-2 rounded-lg' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm">
                <div 
                    draggable
                    onDragStart={handleHeaderDragStart}
                    onDragEnd={onColumnDragEnd}
                    className="flex items-center justify-between p-3 border-b border-light-border dark:border-dark-border rounded-t-lg cursor-grab active:cursor-grabbing"
                    style={{ backgroundColor: column.color, color: textColor }}
                >
                    <h3 className="font-semibold text-base">{column.title}</h3>
                    <div className="flex items-center space-x-1">
                        <button onClick={addTask} className="p-1 rounded-md hover:bg-black/10">
                            <PlusIcon />
                        </button>
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-1 rounded-md hover:bg-black/10">
                                <DotsHorizontalIcon />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-light-card dark:bg-dark-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                                    <div className="py-1">
                                        <button onClick={() => { onEdit(); setIsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-light-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <PencilIcon /> <span className="ml-2">Editar columna</span>
                                        </button>
                                        <button onClick={() => { onDelete(); setIsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50">
                                            <TrashIcon /> <span className="ml-2">Eliminar columna</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex-grow p-2 md:p-3 space-y-3 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Column;