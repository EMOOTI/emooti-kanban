
import React, { useState, useEffect, useRef } from 'react';
import { Task, User, Project, Priority, Column, Team } from '../types';
import UserAvatar from './UserAvatar';
import TeamSelector from './TeamSelector';
import VoiceInput from './VoiceInput';
import { 
    XMarkIcon, 
    MicrophoneIcon, 
    CalendarIcon, 
    ChevronDownIcon,
    PlusIcon,
    SparklesIcon
} from './icons';

interface TaskDetailsModalProps {
    task: Task | null;
    users: User[];
    projects: Project[];
    columns: Column[];
    teams: Team[];
    onClose: () => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
    task,
    users,
    projects,
    columns,
    teams,
    onClose,
    onUpdateTask
}) => {
    // Función para convertir fecha ISO a formato yyyy-MM-dd
    const formatDateForInput = (dateString: string | undefined): string => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };

    // Función para manejar valores vacíos en inputs de fecha
    const handleDateChange = (value: string, setter: (value: string) => void) => {
        // Si el valor está vacío, permitirlo
        if (value === '') {
            setter('');
            return;
        }
        // Si tiene un valor válido, establecerlo
        setter(value);
    };

    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [startDate, setStartDate] = useState(formatDateForInput(task?.startDate));
    const [dueDate, setDueDate] = useState(formatDateForInput(task?.dueDate));
    const [priority, setPriority] = useState<Priority>(task?.priority || Priority.Medium);
    const [responsible, setResponsible] = useState<string[]>(task?.assignedTo ? [task.assignedTo] : []);
    const [responsibleTeam, setResponsibleTeam] = useState<string>(task?.assignedTeam || '');
    const [collaborators, setCollaborators] = useState<string[]>(task?.collaborators || []);
    const [collaboratorTeams, setCollaboratorTeams] = useState<string[]>(task?.collaboratorTeams || []);
    const [cardColor, setCardColor] = useState(task?.coverImage || '');
    const [subtasks, setSubtasks] = useState(task?.subtasks || []);
    const [newSubtask, setNewSubtask] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState(task?.projectId || '');
    const [selectedColumnId, setSelectedColumnId] = useState(task?.columnId || '');
    const titleInputRef = useRef<HTMLInputElement>(null);

    const [responsibleDropdownOpen, setResponsibleDropdownOpen] = useState(false);
    const [collaboratorsDropdownOpen, setCollaboratorsDropdownOpen] = useState(false);

    // Enfocar automáticamente el input del título cuando se abre el modal
    useEffect(() => {
        if (titleInputRef.current) {
            titleInputRef.current.focus();
            console.log('TaskDetailsModal - Input enfocado automáticamente');
        }
    }, []);

    // Cerrar dropdowns cuando se hace clic fuera de ellos
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.dropdown-container')) {
                setResponsibleDropdownOpen(false);
                setCollaboratorsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!task) return null;

    console.log('TaskDetailsModal - Componente renderizado con task:', task.id);

    const handleSave = () => {
        console.log('TaskDetailsModal - handleSave ejecutándose...');
        console.log('TaskDetailsModal - Guardando tarea:', {
            taskId: task.id,
            title,
            description,
            startDate,
            dueDate,
            priority,
            responsible,
            collaborators,
            coverImage: cardColor,
            subtasks
        });
        
        try {
            onUpdateTask(task.id, {
                title,
                description,
                startDate,
                dueDate,
                priority,
                projectId: selectedProjectId, // Agregar el projectId seleccionado
                assignedTo: responsible.length > 0 ? responsible[0] : '', // Usar el primer responsable como assignedTo
                assignedTeam: responsibleTeam,
                collaborators,
                collaboratorTeams,
                coverImage: cardColor,
                subtasks
            });
            
            console.log('TaskDetailsModal - Tarea actualizada exitosamente');
            onClose();
        } catch (error) {
            console.error('TaskDetailsModal - Error actualizando tarea:', error);
        }
    };

    const handleTitleKeyPress = (e: React.KeyboardEvent) => {
        console.log('TaskDetailsModal - handleTitleKeyPress ejecutándose, tecla:', e.key);
        if (e.key === 'Enter') {
            console.log('TaskDetailsModal - Enter detectado, guardando título...');
            e.preventDefault();
            console.log('TaskDetailsModal - Llamando a handleSave...');
            handleSave();
        }
    };

    const handleAddSubtask = () => {
        if (newSubtask.trim()) {
            setSubtasks([...subtasks, { id: Date.now().toString(), title: newSubtask.trim(), completed: false }]);
            setNewSubtask('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddSubtask();
        }
    };

    const getPriorityColor = (priority: Priority) => {
        switch (priority) {
            case Priority.Urgent: return 'bg-red-500';
            case Priority.High: return 'bg-orange-500';
            case Priority.Medium: return 'bg-yellow-500';
            case Priority.Low: return 'bg-green-500';
            default: return 'bg-yellow-500';
        }
    };

    const calculateTaskDays = () => {
        if (startDate && dueDate) {
            const start = new Date(startDate);
            const due = new Date(dueDate);
            const diffTime = Math.abs(due.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        }
        return 1;
    };

    // Función para obtener solo los usuarios que son miembros del proyecto actual
    const getProjectMembers = () => {
        if (!task) return [];
        
        // Si no hay projectId o está vacío, mostrar todos los usuarios disponibles
        if (!task.projectId || task.projectId === '') {
            return users;
        }
        
        const currentProject = projects.find(p => p.id === task.projectId);
        if (!currentProject) return [];
        
        // Filtrar usuarios que están en la lista de miembros del proyecto
        return users.filter(user => currentProject.members.includes(user.id));
    };

    // Función para manejar el cambio de responsable
    const handleResponsibleChange = (userId: string, isChecked: boolean) => {
        if (isChecked) {
            // Si se marca como responsable, remover de colaboradores
            setCollaborators(collaborators.filter(id => id !== userId));
            setResponsible([...responsible, userId]);
        } else {
            // Si se desmarca como responsable
            setResponsible(responsible.filter(id => id !== userId));
        }
    };

    // Función para manejar el cambio de colaborador
    const handleCollaboratorChange = (userId: string, isChecked: boolean) => {
        if (isChecked) {
            // Si se marca como colaborador, remover de responsables
            setResponsible(responsible.filter(id => id !== userId));
            setCollaborators([...collaborators, userId]);
        } else {
            // Si se desmarca como colaborador
            setCollaborators(collaborators.filter(id => id !== userId));
        }
    };

    // Función para obtener colaboradores disponibles (excluyendo a los responsables)
    const getAvailableCollaborators = () => {
        const projectMembers = getProjectMembers();
        return projectMembers.filter(user => !responsible.includes(user.id));
    };

    // Función para obtener responsables disponibles (excluyendo a los colaboradores)
    const getAvailableResponsibles = () => {
        const projectMembers = getProjectMembers();
        return projectMembers.filter(user => !collaborators.includes(user.id));
    };

    // Función para verificar si un usuario es colaborador
    const isCollaborator = (userId: string) => {
        return collaborators.includes(userId);
    };

    // Función para verificar si un usuario es responsable
    const isResponsible = (userId: string) => {
        return responsible.includes(userId);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {task.isNewTask ? 'Crear Nueva Tarea' : 'Detalles de la Tarea'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <XMarkIcon />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Task Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Título de la Tarea
                        </label>
                        <div className="relative">
                            <VoiceInput
                                value={title}
                                onChange={(value) => {
                                    console.log('TaskDetailsModal - onChange ejecutándose, valor:', value);
                                    setTitle(value);
                                }}
                                placeholder={task.isNewTask ? "Escribe el título de la nueva tarea..." : "Escribe el título de la tarea..."}
                                className="w-full text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none p-2"
                            />
                            <input
                                ref={titleInputRef}
                                type="text"
                                value={title}
                                onChange={(e) => {
                                    console.log('TaskDetailsModal - onChange ejecutándose, valor:', e.target.value);
                                    setTitle(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                    console.log('TaskDetailsModal - onKeyDown ejecutándose, tecla:', e.key);
                                    if (e.key === 'Enter') {
                                        console.log('TaskDetailsModal - Enter detectado, guardando...');
                                        e.preventDefault();
                                        handleSave();
                                    }
                                }}
                                onFocus={() => console.log('TaskDetailsModal - Input enfocado')}
                                className="absolute inset-0 w-full text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none p-2 opacity-0 pointer-events-none"
                                placeholder={task.isNewTask ? "Escribe el título de la nueva tarea..." : "Escribe el título de la tarea..."}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Presiona Enter para guardar el título o usa el micrófono para dictar
                        </p>
                    </div>

                    {/* Description */}
                    <VoiceInput
                        value={description}
                        onChange={setDescription}
                        placeholder="Añade una descripción más detallada..."
                        label="Descripción"
                        type="textarea"
                        rows={6}
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {/* Date Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha de Inicio
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => handleDateChange(e.target.value, setStartDate)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha de Vencimiento
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => handleDateChange(e.target.value, setDueDate)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Project and Column Selection */}
                    {task?.isNewTask && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Proyecto
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedProjectId}
                                        onChange={(e) => {
                                            setSelectedProjectId(e.target.value);
                                            setSelectedColumnId(''); // Reset column when project changes
                                        }}
                                        className="w-full p-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100"
                                    >
                                        <option value="">Seleccionar proyecto</option>
                                        {projects.map(project => (
                                            <option key={project.id} value={project.id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Columna
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedColumnId}
                                        onChange={(e) => setSelectedColumnId(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100"
                                        disabled={!selectedProjectId}
                                    >
                                        <option value="">
                                            {selectedProjectId ? 'Seleccionar columna' : 'Primero selecciona un proyecto'}
                                        </option>
                                        {columns
                                            .filter(col => col.projectId === selectedProjectId)
                                            .map(column => (
                                                <option key={column.id} value={column.id}>
                                                    {column.title}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Task Days */}
                    <div className="text-sm text-gray-600">
                        Días de tarea: {calculateTaskDays()}
                    </div>

                    {/* Priority */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Prioridad
                            </label>
                            <div className="relative">
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as Priority)}
                                    className={`w-full p-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getPriorityColor(priority)} text-white font-medium`}
                                >
                                    <option value={Priority.Urgent}>Urgente</option>
                                    <option value={Priority.High}>Alta</option>
                                    <option value={Priority.Medium}>Media</option>
                                    <option value={Priority.Low}>Baja</option>
                                </select>
                            </div>
                        </div>

                    {/* Responsable */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                            Responsables
                            </label>
                        <div className="relative dropdown-container">
                            <button
                                type="button"
                                onClick={() => setResponsibleDropdownOpen(!responsibleDropdownOpen)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 text-left flex items-center justify-between"
                            >
                                <span className={responsible.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                                    {responsible.length > 0 
                                        ? `${responsible.length} responsable(s) seleccionado(s)`
                                        : 'Seleccionar responsables'
                                    }
                                </span>
                                <ChevronDownIcon />
                            </button>
                            {responsibleDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {getAvailableResponsibles().map(user => (
                                        <label key={user.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isResponsible(user.id)}
                                                onChange={(e) => handleResponsibleChange(user.id, e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <UserAvatar user={user} size="sm" />
                                            <span className="text-sm text-gray-700">
                                            {user.firstName} {user.lastName}
                                            </span>
                                        </label>
                                    ))}
                                    {getAvailableResponsibles().length === 0 && (
                                        <div className="p-3 text-sm text-gray-500 text-center">
                                            No hay miembros disponibles para asignar como responsables
                                        </div>
                                    )}
                            </div>
                            )}
                        </div>
                        {responsible.length > 0 && (
                            <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">Responsables seleccionados:</p>
                                <div className="flex flex-wrap gap-2">
                                    {responsible.map(responsibleId => {
                                        const user = getProjectMembers().find(u => u.id === responsibleId);
                                        return user ? (
                                            <div key={responsibleId} className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                                <UserAvatar user={user} size="sm" />
                                                <span>{user.firstName} {user.lastName}</span>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Equipo Responsable */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Equipo Responsable
                        </label>
                        <TeamSelector
                            teams={teams}
                            selectedTeams={responsibleTeam ? [responsibleTeam] : []}
                            onTeamsChange={(teamIds) => {
                                // Solo permitir un equipo como responsable
                                setResponsibleTeam(teamIds.length > 0 ? teamIds[0] : '');
                                // Si se asigna un equipo, limpiar responsables individuales
                                if (teamIds.length > 0) {
                                    setResponsible([]);
                                }
                            }}
                            placeholder="Seleccionar equipo responsable..."
                            maxSelections={1}
                        />
                        {responsibleTeam && (
                            <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">Equipo responsable seleccionado:</p>
                                <div className="flex flex-wrap gap-2">
                                    {(() => {
                                        const team = teams.find(t => t.id === responsibleTeam);
                                        return team ? (
                                            <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                                <div 
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: team.color }}
                                                />
                                                <span>{team.name} ({team.members.length} miembros)</span>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Colaboradores */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                            Colaboradores
                            </label>
                        <div className="relative dropdown-container">
                            <button
                                type="button"
                                onClick={() => setCollaboratorsDropdownOpen(!collaboratorsDropdownOpen)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 text-left flex items-center justify-between"
                            >
                                <span className={collaborators.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                                    {collaborators.length > 0 
                                        ? `${collaborators.length} colaborador(es) seleccionado(s)`
                                        : 'Seleccionar colaboradores'
                                    }
                                </span>
                                <ChevronDownIcon />
                            </button>
                            {collaboratorsDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {getAvailableCollaborators().map(user => (
                                        <label key={user.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isCollaborator(user.id)}
                                                onChange={(e) => handleCollaboratorChange(user.id, e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <UserAvatar user={user} size="sm" />
                                            <span className="text-sm text-gray-700">
                                                {user.firstName} {user.lastName}
                                            </span>
                                        </label>
                                    ))}
                                    {getAvailableCollaborators().length === 0 && (
                                        <div className="p-3 text-sm text-gray-500 text-center">
                                            No hay miembros disponibles para asignar como colaboradores
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {collaborators.length > 0 && (
                            <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">Colaboradores seleccionados:</p>
                                <div className="flex flex-wrap gap-2">
                                    {collaborators.map(collaboratorId => {
                                        const user = getProjectMembers().find(u => u.id === collaboratorId);
                                        return user ? (
                                            <div key={collaboratorId} className="flex items-center space-x-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                                <UserAvatar user={user} size="sm" />
                                                <span>{user.firstName} {user.lastName}</span>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}
                        </div>

                    {/* Equipos Colaboradores */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Equipos Colaboradores
                        </label>
                        <TeamSelector
                            teams={teams}
                            selectedTeams={collaboratorTeams}
                            onTeamsChange={setCollaboratorTeams}
                            placeholder="Seleccionar equipos colaboradores..."
                        />
                        {collaboratorTeams.length > 0 && (
                            <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">Equipos colaboradores seleccionados:</p>
                                <div className="flex flex-wrap gap-2">
                                    {collaboratorTeams.map(teamId => {
                                        const team = teams.find(t => t.id === teamId);
                                        return team ? (
                                            <div key={teamId} className="flex items-center space-x-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                                <div 
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: team.color }}
                                                />
                                                <span>{team.name} ({team.members.length} miembros)</span>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color de Tarjeta
                        </label>
                        <input
                            type="text"
                            value={cardColor || 'Sin color'}
                            onChange={(e) => setCardColor(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Subtasks */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subtareas
                        </label>
                        <div className="space-y-2">
                            {subtasks.map((subtask, index) => (
                                <div key={subtask.id} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={subtask.completed}
                                        onChange={(e) => {
                                            const updatedSubtasks = [...subtasks];
                                            updatedSubtasks[index].completed = e.target.checked;
                                            setSubtasks(updatedSubtasks);
                                        }}
                                        className="rounded"
                                    />
                                    <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-500' : ''}`}>
                                        {subtask.title}
                                    </span>
                                </div>
                            ))}
                            <div className="flex items-center space-x-2 text-gray-500">
                                <PlusIcon className="h-4 w-4" />
                                <input
                                    type="text"
                                    value={newSubtask}
                                    onChange={(e) => setNewSubtask(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Añade una nueva subtarea y presiona Enter"
                                    className="flex-1 p-2 border-none focus:ring-0 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end p-6 border-t border-gray-200 space-x-3">
                    <button
                        onClick={onClose}
                        className="px-2 py-1 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailsModal;
