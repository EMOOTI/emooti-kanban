
import React, { useState, useEffect, useRef } from 'react';
import { Project, User, Id, Team } from '../types';
import { XIcon, UploadIcon, FolderIcon } from './icons';
import { resizeImage } from '../services/imageService';
import TeamSelector from './TeamSelector';

interface ProjectFormModalProps {
    projectToEdit?: Project | null;
    allUsers: User[];
    allTeams: Team[];
    onClose: () => void;
    onSave: (project: Project | Omit<Project, 'id' | 'createdAt' | 'status' | 'ownerId'>) => void;
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ projectToEdit, allUsers, allTeams, onClose, onSave }) => {
    const isEditing = !!projectToEdit;
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        members: [] as Id[],
        teams: [] as Id[],
        imageUrl: '',
        color: '',
    });
    const [imagePreview, setImagePreview] = useState<string>('');
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    
    useEffect(() => {
        if (isEditing && projectToEdit) {
            setFormData({
                name: projectToEdit.name,
                description: projectToEdit.description,
                members: projectToEdit.members,
                teams: projectToEdit.teams || [],
                imageUrl: projectToEdit.imageUrl || '',
                color: projectToEdit.color || '',
            });
            setImagePreview(projectToEdit.imageUrl || '');
        }
    }, [projectToEdit, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'imageUrl') {
            setImagePreview(value);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessingImage(true);
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                setImagePreview(base64String); // Show temp preview
                try {
                    const resizedImage = await resizeImage(base64String);
                    setFormData(prev => ({ ...prev, imageUrl: resizedImage }));
                    setImagePreview(resizedImage);
                } catch (error) {
                    console.error("Error al redimensionar la imagen del proyecto:", error);
                    alert("No se pudo procesar la imagen.");
                    setImagePreview(formData.imageUrl); // Revert
                } finally {
                    setIsProcessingImage(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMemberToggle = (userId: Id) => {
        setFormData(prev =>
            prev.members.includes(userId)
                ? { ...prev, members: prev.members.filter(id => id !== userId) }
                : { ...prev, members: [...prev.members, userId] }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || isProcessingImage) return;

        const dataToSave = {
            name: formData.name,
            description: formData.description,
            members: formData.members,
            teams: formData.teams,
            imageUrl: formData.imageUrl,
            color: formData.color,
        };

        console.log('📝 Datos del proyecto a guardar:', dataToSave);

        if (isEditing && projectToEdit) {
            onSave({ ...projectToEdit, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-light-border dark:border-dark-border">
                    <h2 className="text-xl font-bold">{isEditing ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label htmlFor="projectName" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Nombre del Proyecto</label>
                            <input type="text" name="name" id="projectName" value={formData.name} onChange={handleChange} required className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                            <label htmlFor="projectDescription" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Descripción</label>
                            <textarea name="description" id="projectDescription" value={formData.description} onChange={handleChange} rows={3} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary"></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Imagen de Portada</label>
                            <div className="flex items-center gap-4">
                                <div className="w-40 h-24 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover"/>
                                    ) : (
                                        <FolderIcon />
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary" placeholder="Pegar URL de imagen..."/>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-light-text-secondary dark:text-dark-text-secondary hover:border-primary hover:text-primary transition-colors">
                                        <UploadIcon />
                                        <span>O subir archivo</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Añadir Miembros</label>
                            <div className="max-h-40 overflow-y-auto p-2 border rounded-lg bg-gray-100 dark:bg-gray-800 border-light-border dark:border-dark-border">
                                {allUsers.map(user => (
                                    <label key={user.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={formData.members.includes(user.id)}
                                            onChange={() => handleMemberToggle(user.id)}
                                            className="h-4 w-4 rounded text-primary focus:ring-primary"
                                        />
                                        <img src={user.avatarUrl} alt={user.firstName} className="h-8 w-8 rounded-full" />
                                        <span>{user.firstName} {user.lastName}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Añadir Equipos</label>
                            <TeamSelector
                                teams={allTeams}
                                selectedTeams={formData.teams}
                                onTeamsChange={(teamIds) => setFormData(prev => ({ ...prev, teams: teamIds }))}
                                placeholder="Seleccionar equipos..."
                            />
                        </div>
                        {!isEditing && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    🎨 El color del proyecto se asignará automáticamente para diferenciarlo de los demás proyectos.
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end p-4 bg-gray-50 dark:bg-dark-card-darker border-t border-light-border dark:border-dark-border rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-2 py-1 mr-2 bg-gray-200 dark:bg-gray-700 dark:text-dark-text text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 text-sm">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isProcessingImage} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition-colors duration-200 disabled:opacity-50 text-sm w-32 h-9 flex items-center justify-center">
                             {isProcessingImage ? 'Procesando...' : (isEditing ? 'Guardar Cambios' : 'Crear Proyecto')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectFormModal;
