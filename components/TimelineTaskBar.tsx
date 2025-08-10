
import React, { useState, useCallback, useEffect } from 'react';
import { Task } from '../types';
import { PRIORITY_STYLES } from '../constants';

interface TimelineTaskBarProps {
    task: Task;
    rowIndex: number;
    minDate: Date;
    dayWidth: number;
    rowHeight: number;
    onUpdateTask: (task: Task) => void;
}

const getDaysBetween = (startDate: Date, endDate: Date): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

const addDays = (date: Date, days: number): Date => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
};

const toISODate = (date: Date) => date.toISOString().split('T')[0];

const TimelineTaskBar: React.FC<TimelineTaskBarProps> = ({ task, rowIndex, minDate, dayWidth, rowHeight, onUpdateTask }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);

    const startDate = new Date(task.startDate!);
    const dueDate = new Date(task.dueDate!);
    const offsetDays = getDaysBetween(minDate, startDate);
    const durationDays = getDaysBetween(startDate, dueDate) + 1;

    const left = offsetDays * dayWidth;
    const width = durationDays * dayWidth;

    const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        setDragStartX(e.clientX);
        e.currentTarget.style.cursor = 'grabbing';
    };

    const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, side: 'left' | 'right') => {
        e.stopPropagation();
        if (side === 'left') setIsResizingLeft(true);
        else setIsResizingRight(true);
        setDragStartX(e.clientX);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging && !isResizingLeft && !isResizingRight) return;
        
        const dx = e.clientX - dragStartX;
        const dDays = Math.round(dx / dayWidth);

        if (dDays === 0) return;

        let newStartDate = startDate;
        let newDueDate = dueDate;

        if (isDragging) {
            newStartDate = addDays(startDate, dDays);
            newDueDate = addDays(dueDate, dDays);
        } else if (isResizingLeft) {
            newStartDate = addDays(startDate, dDays);
            if (newStartDate > newDueDate) newStartDate = newDueDate;
        } else if (isResizingRight) {
            newDueDate = addDays(dueDate, dDays);
             if (newDueDate < newStartDate) newDueDate = newStartDate;
        }
        
        onUpdateTask({
            ...task,
            startDate: toISODate(newStartDate),
            dueDate: toISODate(newDueDate)
        });

        setDragStartX(e.clientX);

    }, [isDragging, isResizingLeft, isResizingRight, dragStartX, dayWidth, task, onUpdateTask, startDate, dueDate]);
    
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizingLeft(false);
        setIsResizingRight(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    useEffect(() => {
        if (isDragging || isResizingLeft || isResizingRight) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizingLeft, isResizingRight, handleMouseMove, handleMouseUp]);

    return (
        <div 
            style={{ 
                top: rowIndex * rowHeight, 
                left, 
                width,
                height: rowHeight
            }} 
            className="absolute p-1"
            onMouseDown={handleDragStart}
        >
            <div
                className={`w-full h-full rounded-md flex items-center px-2 text-white shadow-md transition-all ${PRIORITY_STYLES[task.priority]} cursor-grab`}
                title={`${task.title}\n${startDate.toLocaleDateString('es-ES')} - ${dueDate.toLocaleDateString('es-ES')}`}
            >
                {/* Resize Handles */}
                <div 
                    onMouseDown={(e) => handleResizeStart(e, 'left')}
                    className="absolute left-0 top-0 h-full w-2 cursor-ew-resize z-10" 
                />
                <p className="text-sm font-medium truncate pointer-events-none">{task.title}</p>
                <div 
                    onMouseDown={(e) => handleResizeStart(e, 'right')}
                    className="absolute right-0 top-0 h-full w-2 cursor-ew-resize z-10" 
                />
            </div>
        </div>
    );
};

export default TimelineTaskBar;
