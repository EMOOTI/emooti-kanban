import React, { useMemo, useRef, useState } from 'react';
import { 
    PieChart, 
    Pie, 
    Cell, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Task, Project, User, Column, Priority } from '../types';
import { PRIORITY_STYLES } from '../constants';
import { DownloadIcon } from './icons';

interface ReportsViewProps {
    currentUser: User;
    projects: Project[];
    tasks: Task[];
    users: User[];
    columns: Column[];
    onSelectTask: (task: Task) => void;
    onSelectProject?: (projectId: string) => void;
}

const ReportsView: React.FC<ReportsViewProps> = ({
    currentUser,
    projects,
    tasks,
    users,
    columns,
    onSelectTask,
    onSelectProject
}) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [filters, setFilters] = useState({
        dateRange: 'all' as 'all' | 'week' | 'month' | 'quarter' | 'year',
        projectId: 'all' as string,
        priority: 'all' as string,
        assignedTo: 'all' as string,
        status: 'all' as 'all' | 'completed' | 'pending'
    });
    
    // Identificar columnas de tareas completadas
    const doneColumnIds = columns.filter(col => col.isDoneColumn).map(col => col.id);

    // Aplicar filtros a las tareas
    const filteredTasks = useMemo(() => {
        let filtered = tasks;

        // Filtro por rango de fechas
        if (filters.dateRange !== 'all') {
            const now = new Date();
            let startDate = new Date();
            
            switch (filters.dateRange) {
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case 'quarter':
                    startDate.setMonth(now.getMonth() - 3);
                    break;
                case 'year':
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
            }
            
            filtered = filtered.filter(task => {
                if (!task.createdAt) return false;
                const taskDate = new Date(task.createdAt);
                return taskDate >= startDate && taskDate <= now;
            });
        }

        // Filtro por proyecto
        if (filters.projectId !== 'all') {
            filtered = filtered.filter(task => task.projectId === filters.projectId);
        }

        // Filtro por prioridad
        if (filters.priority !== 'all') {
            filtered = filtered.filter(task => task.priority === filters.priority);
        }

        // Filtro por usuario asignado
        if (filters.assignedTo !== 'all') {
            filtered = filtered.filter(task => 
                task.assignedTo === filters.assignedTo || 
                task.collaborators?.includes(filters.assignedTo)
            );
        }

        // Filtro por estado
        if (filters.status !== 'all') {
            filtered = filtered.filter(task => {
                const isCompleted = doneColumnIds.includes(task.columnId) || task.taskStatus === 'completed';
                return filters.status === 'completed' ? isCompleted : !isCompleted;
            });
        }

        return filtered;
    }, [tasks, filters, doneColumnIds]);

    // Datos para gráficos (usar filteredTasks en lugar de tasks)
    const reportData = useMemo(() => {
        const today = new Date();

        // 1. Tareas por estado
        const tasksByStatus = columns.map(column => {
            const columnTasks = filteredTasks.filter(task => task.columnId === column.id);
            return {
                name: column.name,
                value: columnTasks.length,
                color: column.color || '#6366f1'
            };
        });

        // 2. Tareas por prioridad
        const tasksByPriority = Object.entries(PRIORITY_STYLES).map(([priority, style]) => {
            const priorityTasks = filteredTasks.filter(task => task.priority === priority);
            return {
                name: priority.charAt(0).toUpperCase() + priority.slice(1),
                value: priorityTasks.length,
                color: style.backgroundColor
            };
        });

        // 3. Tareas por proyecto
        const tasksByProject = projects.map(project => {
            const projectTasks = filteredTasks.filter(task => task.projectId === project.id);
            return {
                name: project.name,
                value: projectTasks.length,
                color: project.color || '#6366f1'
            };
        });

        // 4. Tareas completadas vs pendientes
        const completedTasks = filteredTasks.filter(task => 
            doneColumnIds.includes(task.columnId) || task.taskStatus === 'completed'
        ).length;
        const pendingTasks = filteredTasks.length - completedTasks;

        const completionData = [
            { name: 'Completadas', value: completedTasks, color: '#10B981' },
            { name: 'Pendientes', value: pendingTasks, color: '#F59E0B' }
        ];

        // 5. Tareas por usuario asignado
        const tasksByUser = users.map(user => {
            const userTasks = filteredTasks.filter(task => 
                task.assignedTo === user.id || task.collaborators?.includes(user.id)
            );
            return {
                name: user.name || user.email,
                value: userTasks.length,
                color: '#6366f1'
            };
        }).filter(item => item.value > 0);

        // 6. Tareas por mes (últimos 6 meses)
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = month.toLocaleDateString('es-ES', { month: 'short' });
            
            const monthTasks = filteredTasks.filter(task => {
                if (!task.createdAt) return false;
                const taskDate = new Date(task.createdAt);
                return taskDate.getMonth() === month.getMonth() && 
                       taskDate.getFullYear() === month.getFullYear();
            });

            const completedInMonth = monthTasks.filter(task => 
                doneColumnIds.includes(task.columnId) || task.taskStatus === 'completed'
            ).length;

            monthlyData.push({
                month: monthName,
                creadas: monthTasks.length,
                completadas: completedInMonth
            });
        }

        return {
            tasksByStatus,
            tasksByPriority,
            tasksByProject,
            completionData,
            tasksByUser,
            monthlyData
        };
    }, [filteredTasks, columns, projects, users, doneColumnIds]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

    const exportToPDF = async () => {
        if (!reportRef.current) return;

        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const fileName = `emooti-reportes-${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error('Error exportando PDF:', error);
            alert('Error al exportar el PDF. Inténtalo de nuevo.');
        }
    };

    return (
        <div className="p-6 overflow-y-auto h-full bg-light-bg dark:bg-dark-bg">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-light-text dark:text-dark-text mb-2">
                        Reportes y Análisis
                    </h1>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary">
                        Análisis detallado de tareas, proyectos y productividad
                    </p>
                </div>
                <button
                    onClick={exportToPDF}
                    className="flex items-center px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors duration-200"
                >
                    <DownloadIcon />
                    <span className="ml-2">Exportar PDF</span>
                </button>
            </div>

            {/* Filtros */}
            <div className="mb-6 bg-light-card dark:bg-dark-card rounded-lg p-4 shadow-md">
                <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
                    Filtros
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                            Rango de Fechas
                        </label>
                        <select
                            value={filters.dateRange}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-light-text dark:text-dark-text"
                        >
                            <option value="all">Todas las fechas</option>
                            <option value="week">Última semana</option>
                            <option value="month">Último mes</option>
                            <option value="quarter">Último trimestre</option>
                            <option value="year">Último año</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                            Proyecto
                        </label>
                        <select
                            value={filters.projectId}
                            onChange={(e) => setFilters(prev => ({ ...prev, projectId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-light-text dark:text-dark-text"
                        >
                            <option value="all">Todos los proyectos</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                            Prioridad
                        </label>
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-light-text dark:text-dark-text"
                        >
                            <option value="all">Todas las prioridades</option>
                            {Object.keys(PRIORITY_STYLES).map(priority => (
                                <option key={priority} value={priority}>
                                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                            Asignado a
                        </label>
                        <select
                            value={filters.assignedTo}
                            onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-light-text dark:text-dark-text"
                        >
                            <option value="all">Todos los usuarios</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name || user.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                            Estado
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-light-text dark:text-dark-text"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="completed">Completadas</option>
                            <option value="pending">Pendientes</option>
                        </select>
                    </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        Mostrando {filteredTasks.length} de {tasks.length} tareas
                    </div>
                    <button
                        onClick={() => setFilters({
                            dateRange: 'all',
                            projectId: 'all',
                            priority: 'all',
                            assignedTo: 'all',
                            status: 'all'
                        })}
                        className="px-3 py-1 text-sm text-primary hover:text-primary-hover"
                    >
                        Limpiar filtros
                    </button>
                </div>
            </div>

            <div ref={reportRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gráfico de Tareas por Estado */}
                <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
                        Tareas por Estado
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={reportData.tasksByStatus}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {reportData.tasksByStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Gráfico de Tareas por Prioridad */}
                <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
                        Tareas por Prioridad
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={reportData.tasksByPriority}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {reportData.tasksByPriority.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Gráfico de Tareas por Proyecto */}
                <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
                        Tareas por Proyecto
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reportData.tasksByProject}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#6366f1" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Gráfico de Tareas por Usuario */}
                <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
                        Tareas por Usuario
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reportData.tasksByUser}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#6366f1" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Gráfico de Tareas Completadas vs Pendientes */}
                <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
                        Estado General
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={reportData.completionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {reportData.completionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Gráfico de Tendencias Mensuales */}
                <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-md p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-light-text dark:text-dark-text mb-4">
                        Tendencias Mensuales (Últimos 6 meses)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportData.monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="creadas" stroke="#8884d8" name="Tareas Creadas" />
                            <Line type="monotone" dataKey="completadas" stroke="#82ca9d" name="Tareas Completadas" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Resumen de Métricas */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-light-card dark:bg-dark-card rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {tasks.length}
                    </div>
                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        Total de Tareas
                    </div>
                </div>
                <div className="bg-light-card dark:bg-dark-card rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {tasks.filter(task => doneColumnIds.includes(task.columnId) || task.taskStatus === 'completed').length}
                    </div>
                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        Tareas Completadas
                    </div>
                </div>
                <div className="bg-light-card dark:bg-dark-card rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {projects.length}
                    </div>
                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        Proyectos Activos
                    </div>
                </div>
                <div className="bg-light-card dark:bg-dark-card rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {users.length}
                    </div>
                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        Usuarios Activos
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
