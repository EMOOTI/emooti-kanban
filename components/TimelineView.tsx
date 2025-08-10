
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Task } from '../types';
import { PlusIcon, MinusIcon } from './icons';
import TimelineTaskBar from './TimelineTaskBar';

const MIN_DAY_WIDTH = 30;
const MAX_DAY_WIDTH = 150;
const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 50;

const getDaysBetween = (startDate: Date, endDate: Date): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

interface TimelineViewProps {
    tasks: Task[];
    onUpdateTask: (task: Task) => void;
    onAddTask: () => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ tasks, onUpdateTask, onAddTask }) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const taskListRef = useRef<HTMLDivElement>(null);
    
    const [dayWidth, setDayWidth] = useState(50);

    // No se filtran tareas por usuario, se usan todas las tareas recibidas en props
    const validTasks = useMemo(() => tasks.filter(t => t.startDate && t.dueDate), [tasks]);
    
    const { dateRange, gridWidth, minDate } = useMemo(() => {
        if (validTasks.length === 0) {
            const start = new Date();
            start.setDate(1);
            const end = new Date(new Date().setMonth(start.getMonth() + 1));
            return { dateRange: [], gridWidth: 0, minDate: start };
        }

        const dates = validTasks.flatMap(t => [new Date(t.startDate!), new Date(t.dueDate!)]);
        let min = new Date(Math.min(...dates.map(d => d.getTime())));
        let max = new Date(Math.max(...dates.map(d => d.getTime())));
        
        min.setDate(min.getDate() - 7);
        max.setDate(max.getDate() + 14);

        const range: Date[] = [];
        for (let d = new Date(min); d <= max; d.setDate(d.getDate() + 1)) {
            range.push(new Date(d));
        }
        
        return { dateRange: range, gridWidth: range.length * dayWidth, minDate: min };
    }, [validTasks, dayWidth]);
    
    const handleZoomIn = () => setDayWidth(w => Math.min(w + 20, MAX_DAY_WIDTH));
    const handleZoomOut = () => setDayWidth(w => Math.max(w - 20, MIN_DAY_WIDTH));

    const handleGridScroll = () => {
        if (gridRef.current && taskListRef.current) {
            taskListRef.current.scrollTop = gridRef.current.scrollTop;
            (document.querySelector('.timeline-header') as HTMLElement).style.left = `-${gridRef.current.scrollLeft}px`;
        }
    };
    
    const todayOffset = useMemo(() => {
       const today = new Date();
       if (today < minDate || today > dateRange[dateRange.length - 1]) return -1;
       return getDaysBetween(minDate, today) * dayWidth;
    }, [minDate, dayWidth, dateRange]);

    useEffect(() => {
        const gridEl = gridRef.current;
        if (gridEl && todayOffset > 0) {
            gridEl.scrollLeft = todayOffset - gridEl.clientWidth / 2;
        }
    }, [todayOffset]);


    return (
        <div className="flex flex-col h-full w-full bg-light-card dark:bg-dark-card rounded-xl shadow-lg overflow-hidden">
            <div className="p-2 border-b border-light-border dark:border-dark-border flex items-center justify-between space-x-2">
                <button onClick={onAddTask} className="flex items-center px-3 py-1 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition-colors duration-200">
                    <PlusIcon />
                    <span className="ml-2">Nueva Tarea</span>
                </button>
                <button onClick={handleZoomOut} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"><MinusIcon/></button>
                <button onClick={handleZoomIn} className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"><PlusIcon/></button>
            </div>
            <div className="flex flex-1 overflow-hidden">
                <div className="w-56 border-r border-light-border dark:border-dark-border flex-shrink-0">
                    <div style={{ height: HEADER_HEIGHT }} className="flex items-center p-4 border-b border-light-border dark:border-dark-border">
                        <h3 className="font-bold text-lg">Tareas</h3>
                    </div>
                    <div ref={taskListRef} className="overflow-y-hidden" style={{ height: `calc(100% - ${HEADER_HEIGHT}px - 40px)`}}>
                        {validTasks.map(task => (
                            <div key={task.id} style={{ height: ROW_HEIGHT }} className="flex items-center p-2 border-b border-light-border dark:border-dark-border truncate">
                                <span className="truncate text-sm" title={task.title}>{task.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto" ref={gridRef} onScroll={handleGridScroll}>
                    <div className="relative" style={{ width: gridWidth, height: validTasks.length * ROW_HEIGHT + HEADER_HEIGHT }}>
                        {/* Header */}
                        <div style={{ width: gridWidth }} className="timeline-header sticky top-0 bg-light-card dark:bg-dark-card z-20 flex">
                            {dateRange.map((date, i) => (
                                <div key={i} style={{ width: dayWidth }} className="flex-shrink-0 flex flex-col items-center justify-center border-r border-b border-light-border dark:border-dark-border">
                                    <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{date.toLocaleDateString('es-ES', { month: 'short' })}</span>
                                    <span className="font-semibold">{date.getDate()}</span>
                                    { dayWidth > 60 && <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{date.toLocaleDateString('es-ES', { weekday: 'short' })}</span>}
                                </div>
                            ))}
                        </div>

                        <div className="relative" style={{ height: validTasks.length * ROW_HEIGHT }}>
                            {dateRange.map((_, i) => (
                                <div key={i} style={{ left: i * dayWidth, height: '100%' }} className={`absolute top-0 w-px z-0 ${i % 7 === 0 ? 'bg-gray-300 dark:bg-gray-600' : 'bg-light-border dark:bg-dark-border'}`}></div>
                            ))}
                            {validTasks.map((_, i) => (
                                <div key={i} style={{ top: i * ROW_HEIGHT, width: '100%' }} className="absolute left-0 h-px bg-light-border dark:bg-dark-border z-0"></div>
                            ))}
                             { dayWidth > 40 && dateRange.map((_, i) => (
                                Array.from({length: 24}).map((__, hourIndex) => (
                                    <div key={`${i}-${hourIndex}`} style={{ left: i * dayWidth + (hourIndex * dayWidth/24), height: '100%'}} className="absolute top-0 w-px bg-gray-100 dark:bg-gray-800 z-0"></div>
                                ))
                            ))}

                            {todayOffset >= 0 && (
                               <div style={{ left: todayOffset, height: '100%' }} className="absolute top-0 w-0.5 bg-red-500 z-10">
                                   <div className="absolute -top-5 -translate-x-1/2 left-1/2 text-xs text-red-500 font-bold">Hoy</div>
                               </div>
                            )}

                            {validTasks.map((task, i) => (
                                <TimelineTaskBar
                                    key={task.id}
                                    task={task}
                                    rowIndex={i}
                                    minDate={minDate}
                                    dayWidth={dayWidth}
                                    rowHeight={ROW_HEIGHT}
                                    onUpdateTask={onUpdateTask}
                                />
                            ))}
                        </div>
                    </div>
                     {validTasks.length === 0 && (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-light-text-secondary dark:text-dark-text-secondary">No hay tareas con fechas para mostrar en el cronograma.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TimelineView;
