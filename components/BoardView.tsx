
import React, { useState, useCallback } from 'react';
import { Column as ColumnType, Task, Id, User, Team } from '../types';
import Column from './Column';
import TaskCard from './TaskCard';
import ContextMenu, { ContextMenuGroup } from './ContextMenu';
import { TrashIcon, DuplicateIcon, EyeIcon, LinkIcon, PlusIcon, ConvertToIcon, PaletteIcon } from './icons';

interface BoardViewProps {
    columns: ColumnType[];
    tasks: Task[];
    users: User[];
    teams: Team[];
    onSelectTask: (task: Task) => void;
    moveTask: (draggedTaskId: Id, newColumnId: Id, targetTaskId: Id | null) => void;
    moveColumn: (draggedColumnId: Id, targetColumnId: Id) => void;
    addTask: (columnId: Id) => void;
    deleteTask: (taskId: Id) => void;
    duplicateTask: (taskId: Id) => void;
    createFollowUpTask: (taskId: Id) => void;
    onAddColumn: () => void;
    onEditColumn: (column: ColumnType) => void;
    onDeleteColumn: (columnId: Id) => void;
    onOpenColorPicker: (task: Task) => void;
    onToggleComplete?: (taskId: Id) => void;
}

const BoardView: React.FC<BoardViewProps> = ({
    columns,
    tasks,
    users,
    teams,
    onSelectTask,
    moveTask,
    moveColumn,
    addTask,
    deleteTask,
    duplicateTask,
    createFollowUpTask,
    onAddColumn,
    onEditColumn,
    onDeleteColumn,
    onOpenColorPicker,
    onToggleComplete,
}) => {
    const [draggedTaskId, setDraggedTaskId] = useState<Id | null>(null);
    const [draggedColumnId, setDraggedColumnId] = useState<Id | null>(null);
    const [draggedOverTaskId, setDraggedOverTaskId] = useState<Id | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; task: Task } | null>(null);

    const handleTaskDragStart = (taskId: Id) => {
        setDraggedTaskId(taskId);
    };

    const handleDragEnd = () => {
        setDraggedTaskId(null);
        setDraggedColumnId(null);
        setDraggedOverTaskId(null);
    };

    const handleTaskDropInColumn = (columnId: Id) => {
        if (draggedTaskId) {
            moveTask(draggedTaskId, columnId, null);
        }
    };
    
    const handleTaskDropOnTask = (targetTask: Task) => {
        if (draggedTaskId && draggedTaskId !== targetTask.id) {
            moveTask(draggedTaskId, targetTask.columnId, targetTask.id);
        }
    };
    
    const handleColumnDragStart = (columnId: Id) => {
        setDraggedColumnId(columnId);
    };

    const handleColumnDrop = (targetColumnId: Id) => {
        if (draggedColumnId) {
            moveColumn(draggedColumnId, targetColumnId);
        }
    };

    const handleContextMenu = (event: React.MouseEvent, task: Task) => {
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY, task });
    };

    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const getTaskWithDetails = useCallback((task: Task): Task & { responsible: User | undefined } => {
        return {
            ...task,
            responsible: users.find(u => u.id === task.assignedTo)
        }
    }, [users]);
    
    const contextMenuActionGroups: ContextMenuGroup[] = contextMenu ? [
        [
            { label: 'Abrir detalles', icon: <EyeIcon />, onClick: () => onSelectTask(contextMenu.task) },
            { label: 'Cambiar color', icon: <PaletteIcon />, onClick: () => onOpenColorPicker(contextMenu.task) },
            { label: 'Copiar enlace a la tarea', icon: <LinkIcon />, onClick: () => {
                const taskUrl = `${window.location.origin}/projects/${contextMenu.task.projectId}/tasks/${contextMenu.task.id}`;
                navigator.clipboard.writeText(taskUrl);
            } },
        ],
        [
            { label: 'Duplicar tarea', icon: <DuplicateIcon />, onClick: () => duplicateTask(contextMenu.task.id) },
            { label: 'Crear tarea de seguimiento', icon: <ConvertToIcon />, onClick: () => createFollowUpTask(contextMenu.task.id) },
        ],
        [
            { label: 'Eliminar tarea', icon: <TrashIcon />, onClick: () => deleteTask(contextMenu.task.id), isDestructive: true },
        ],
    ] : [];

    return (
        <div className="flex-1 flex overflow-x-auto p-6 space-x-6 snap-x snap-mandatory" onDragEnd={handleDragEnd} onDrop={handleDragEnd}>
            {columns.map(column => (
                <Column
                    key={column.id}
                    column={column}
                    addTask={() => addTask(column.id)}
                    onTaskDrop={() => handleTaskDropInColumn(column.id)}
                    onEdit={() => onEditColumn(column)}
                    onDelete={() => onDeleteColumn(column.id)}
                    draggedColumnId={draggedColumnId}
                    onColumnDragStart={handleColumnDragStart}
                    onColumnDrop={handleColumnDrop}
                    onColumnDragEnd={handleDragEnd}
                >
                    <div 
                        className="space-y-3 min-h-[100px]" 
                        onDragOver={e => {
                            e.preventDefault();
                            setDraggedOverTaskId(null); // Clear task-specific hover when over column
                        }}
                    >
                        {tasks
                            .filter(task => task.columnId === column.id)
                            .map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={getTaskWithDetails(task)}
                                    users={users}
                                    teams={teams}
                                    onSelectTask={() => onSelectTask(task)}
                                    onDragStart={handleTaskDragStart}
                                    onDrop={handleTaskDropOnTask}
                                    onContextMenu={handleContextMenu}
                                    onDragEnter={setDraggedOverTaskId}
                                    isDraggedOver={draggedOverTaskId === task.id && draggedTaskId !== task.id}
                                    onOpenColorPicker={onOpenColorPicker}
                                    onToggleComplete={onToggleComplete}
                                    onDuplicateTask={duplicateTask}
                                    onCreateFollowUpTask={createFollowUpTask}
                                    onDeleteTask={deleteTask}
                                />
                        ))}
                    </div>
                </Column>
            ))}
             <div className="w-72 lg:w-80 flex-shrink-0 snap-center">
                <button onClick={onAddColumn} className="w-full h-12 flex items-center justify-center bg-gray-200/50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <span className="font-semibold text-sm">Añadir otra columna</span>
                </button>
            </div>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    actionGroups={contextMenuActionGroups}
                    onClose={handleCloseContextMenu}
                />
            )}
        </div>
    );
};

export default BoardView;
