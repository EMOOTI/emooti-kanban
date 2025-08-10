import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { XMarkIcon } from './icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface ProjectSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    currentView: 'board' | 'timeline' | 'dashboard';
    onSave: (settings: ProjectSettings) => void;
    onLoadSettings?: () => Promise<'board' | 'timeline' | 'dashboard'>;
}

interface ProjectSettings {
    defaultView: 'board' | 'timeline' | 'dashboard';
}

const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
    isOpen,
    onClose,
    project,
    currentView,
    onSave,
    onLoadSettings
}) => {
    const [settings, setSettings] = useState<ProjectSettings>({
        defaultView: currentView
    });

    // Cargar configuración guardada cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            loadProjectSettings();
        }
    }, [isOpen]);

    const loadProjectSettings = async () => {
        try {
            if (onLoadSettings) {
                const savedView = await onLoadSettings();
                setSettings({
                    defaultView: savedView
                });
                console.log('📋 Configuración cargada desde App.tsx:', savedView);
            } else {
                // Fallback: cargar directamente desde Firebase
                const projectSettingsRef = doc(db, 'projectSettings', project.id);
                const settingsDoc = await getDoc(projectSettingsRef);
                
                if (settingsDoc.exists()) {
                    const savedSettings = settingsDoc.data();
                    setSettings({
                        defaultView: savedSettings.defaultView || currentView
                    });
                    console.log('📋 Configuración cargada directamente:', savedSettings);
                }
            }
        } catch (error) {
            console.error('❌ Error al cargar configuración:', error);
        }
    };

    const viewOptions = [
        { id: 'board', label: 'Panel', description: 'Vista de tablero Kanban' },
        { id: 'timeline', label: 'Cronograma', description: 'Vista de línea de tiempo' },
        { id: 'dashboard', label: 'Resumen', description: 'Vista de resumen y estadísticas' }
    ] as const;

    const handleSave = () => {
        onSave(settings);
        onClose();
    };

    const handleCancel = () => {
        setSettings({ defaultView: currentView });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: project.color || '#6366f1' }}
                        />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Configuración del Proyecto
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <XMarkIcon />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Vista Principal */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Vista Principal del Proyecto
                        </label>
                        <div className="space-y-2">
                            {viewOptions.map(({ id, label, description }) => (
                                <label key={id} className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="defaultView"
                                        value={id}
                                        checked={settings.defaultView === id}
                                        onChange={(e) => setSettings({ ...settings, defaultView: e.target.value as 'board' | 'timeline' | 'dashboard' })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <div className="ml-3 flex-1">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {label}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {description}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectSettingsModal; 