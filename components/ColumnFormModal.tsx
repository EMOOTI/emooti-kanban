
import React, { useState, useEffect } from 'react';
import { Column } from '../types';
import { XIcon } from './icons';
import { ColorService } from '../services/colorService';

interface ColumnFormModalProps {
    columnToEdit?: Column | null;
    onClose: () => void;
    onSave: (columnData: Omit<Column, 'id' | 'projectId' | 'order'> | Column) => void;
}

const ColumnFormModal: React.FC<ColumnFormModalProps> = ({ columnToEdit, onClose, onSave }) => {
    const isEditing = !!columnToEdit;
    const [formData, setFormData] = useState({
        title: '',
        color: '#F3F4F6',
        isDoneColumn: false,
    });
    
    useEffect(() => {
        if (isEditing && columnToEdit) {
            setFormData({
                title: columnToEdit.title,
                color: columnToEdit.color || '#F3F4F6',
                isDoneColumn: !!columnToEdit.isDoneColumn,
            });
        }
    }, [columnToEdit, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleColorSelect = (color: string) => {
        setFormData(prev => ({...prev, color}));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) return;
        
        onSave(isEditing ? { ...columnToEdit!, ...formData } : formData);
    };

    const palette = ColorService.getColorPalette();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-light-border dark:border-dark-border">
                    <h2 className="text-xl font-bold">{isEditing ? 'Editar Columna' : 'Crear Nueva Columna'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                        <div>
                            <label htmlFor="column-title" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Título de la Columna</label>
                            <input
                                type="text"
                                id="column-title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                autoFocus
                                className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Color de Fondo</label>
                             <div className="flex flex-wrap gap-2">
                                {palette.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => handleColorSelect(color)}
                                        className={`w-8 h-8 rounded-full border border-light-border dark:border-dark-border transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${formData.color === color ? 'ring-2 ring-primary' : ''}`}
                                        style={{ backgroundColor: color }}
                                        aria-label={`Seleccionar color ${color}`}
                                    />
                                ))}
                             </div>
                        </div>
                        <div>
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="isDoneColumn"
                                    name="isDoneColumn"
                                    checked={formData.isDoneColumn}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded text-primary focus:ring-primary"
                                />
                                <label htmlFor="isDoneColumn" className="text-sm font-medium text-light-text dark:text-dark-text">
                                    Marcar como columna "finalizada"
                                </label>
                            </div>
                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2 pl-7">Las tareas en esta columna se considerarán completadas para el cálculo del progreso del proyecto.</p>
                        </div>
                    </div>
                    <div className="flex justify-end p-4 bg-gray-50 dark:bg-dark-card-darker border-t border-light-border dark:border-dark-border rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-2 py-1 mr-2 bg-gray-200 dark:bg-gray-700 dark:text-dark-text text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 text-sm">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition-colors duration-200 text-sm w-32 h-9 flex items-center justify-center">
                            {isEditing ? 'Guardar Cambios' : 'Crear Columna'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ColumnFormModal;
