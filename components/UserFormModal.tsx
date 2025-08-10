
import React, { useState, useRef } from 'react';
import { User, UserRole, Project, Id } from '../types';
import { XIcon, UploadIcon, CameraIcon } from './icons';
import { sendUserAddedToProjectEmail } from '../services/notificationService';
import CameraModal from './CameraModal';
import { resizeImage } from '../services/imageService';
import { doc, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';

interface UserFormModalProps {
    userToEdit?: User | null;
    currentUser: User | null;
    allProjects: Project[];
    onClose: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ userToEdit, currentUser, allProjects, onClose }) => {
    // El estado del formulario se inicializa desde las props una sola vez, cuando el modal se monta.
    // Esto previene que los re-renderizados del componente padre borren los cambios locales.
    const [formData, setFormData] = useState<User | null>(userToEdit ?? null);
    const [avatarPreview, setAvatarPreview] = useState<string>(userToEdit?.avatarUrl || '');
    
    // Este estado gestiona los checkboxes de los proyectos y es independiente después de la inicialización.
    const [memberOfProjectIds, setMemberOfProjectIds] = useState<Set<Id>>(() => 
        userToEdit 
        ? new Set(allProjects.filter(p => p.members.includes(userToEdit.id)).map(p => p.id))
        : new Set()
    );

    // Se guarda el estado inicial de los proyectos para calcular la diferencia al guardar.
    const [initialProjectIds] = useState(memberOfProjectIds);

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [projectSearchTerm, setProjectSearchTerm] = useState('');

    const isEditing = !!userToEdit;
    const isAdminEditing = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.ProjectManager;
    
    // Filtrar proyectos basado en el término de búsqueda
    const filteredProjects = allProjects.filter(project =>
        project.name.toLowerCase().includes(projectSearchTerm.toLowerCase())
    );
    
    if(!formData) return null; // No renderizar si no hay datos de usuario

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? ({ ...prev, [name]: value }) : null);
    };
    
    const handleProjectMembershipChange = (projectId: Id) => {
        setMemberOfProjectIds(prevIds => {
            const newIds = new Set(prevIds);
            if (newIds.has(projectId)) {
                newIds.delete(projectId);
            } else {
                newIds.add(projectId);
            }
            return newIds;
        });
    };

    const handleAvatarClick = () => {
        if (isProcessingImage) return;
        fileInputRef.current?.click();
    };
    
    const processAndSetImage = async (base64String: string) => {
        setIsProcessingImage(true);
        setAvatarPreview(base64String); 
        try {
            const resizedImage = await resizeImage(base64String);
            setFormData(prev => prev ? ({ ...prev, avatarUrl: resizedImage }) : null);
            setAvatarPreview(resizedImage);
        } catch (error) {
            console.error("Error al redimensionar la imagen:", error);
            alert("Error al procesar la imagen. Inténtalo de nuevo.");
            if (formData) {
                setAvatarPreview(formData.avatarUrl);
            }
        } finally {
            setIsProcessingImage(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                processAndSetImage(base64String);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData || !formData.firstName || !formData.lastName || !formData.email || isProcessingImage) return;
        
        try {
            const batch = writeBatch(db);
            
            // 1. Actualizar el documento del usuario en el batch
            const { id, ...dataToUpdate } = formData;
            const userRef = doc(db, 'users', id);
            batch.update(userRef, dataToUpdate);
            
            // 2. Calcular y actualizar las membresías de proyectos en el mismo batch
            const projectsToAdd = [...memberOfProjectIds].filter(pId => !initialProjectIds.has(pId));
            const projectsToRemove = [...initialProjectIds].filter(pId => !memberOfProjectIds.has(pId));

            projectsToAdd.forEach(projectId => {
                const projectRef = doc(db, "projects", projectId);
                batch.update(projectRef, { members: arrayUnion(formData.id) });
            });
            projectsToRemove.forEach(projectId => {
                const projectRef = doc(db, "projects", projectId);
                batch.update(projectRef, { members: arrayRemove(formData.id) });
            });
            
            // 3. Ejecutar la escritura atómica
            await batch.commit();

            // 4. Si es creación (no edición), enviar email de bienvenida
            if (!isEditing) {
                sendUserAddedToProjectEmail(formData, 'EMOOTI');
            }

            // 5. Cerrar el modal solo si todo fue exitoso
            onClose();

        } catch (error) {
            console.error("Error al guardar los cambios del usuario:", error);
            alert("No se pudieron guardar los cambios. Inténtalo de nuevo.");
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
                <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-4 border-b border-light-border dark:border-dark-border">
                        <h2 className="text-xl font-bold">{isEditing ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <XIcon />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="flex items-center space-x-6">
                                <div className="relative group">
                                    <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                                     <div className={`absolute inset-0 bg-black rounded-full flex items-center justify-center space-x-2 transition-opacity duration-300 ${isProcessingImage ? 'bg-opacity-70 opacity-100' : 'bg-opacity-50 opacity-0 group-hover:opacity-100'}`}>
                                        {isProcessingImage ? (
                                            <div className="text-white text-xs text-center p-1">Procesando...</div>
                                        ) : (
                                            <>
                                                <button type="button" onClick={handleAvatarClick} className="text-white p-2 rounded-full hover:bg-white/20" title="Subir imagen">
                                                    <UploadIcon />
                                                </button>
                                                <button type="button" onClick={() => setIsCameraOpen(true)} className="text-white p-2 rounded-full hover:bg-white/20" title="Tomar foto">
                                                    <CameraIcon />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                <div className="grid grid-cols-1 flex-1 gap-4">
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Nombre</label>
                                        <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary" />
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Apellidos</label>
                                        <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary" />
                                    </div>
                                </div>
                            </div>
                           
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Correo Electrónico</label>
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Teléfono</label>
                                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Rol</label>
                                    <select id="role" name="role" value={formData.role} onChange={handleChange} disabled={!isAdminEditing} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed">
                                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="position" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Cargo / Puesto</label>
                                    <input type="text" id="position" name="position" value={formData.position} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">Pertenencia a Proyectos</label>
                                <div className={`space-y-2 ${!isAdminEditing ? 'opacity-70' : ''}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                            {memberOfProjectIds.size} de {allProjects.length} proyectos seleccionados
                                        </span>
                                        {isAdminEditing && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (memberOfProjectIds.size === allProjects.length) {
                                                        setMemberOfProjectIds(new Set());
                                                    } else {
                                                        setMemberOfProjectIds(new Set(allProjects.map(p => p.id)));
                                                    }
                                                }}
                                                className="text-xs text-primary hover:text-primary-hover underline"
                                            >
                                                {memberOfProjectIds.size === allProjects.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                            </button>
                                        )}
                                    </div>
                                    {memberOfProjectIds.size > 0 && (
                                        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">
                                                Proyectos seleccionados:
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {allProjects
                                                    .filter(project => memberOfProjectIds.has(project.id))
                                                    .map(project => (
                                                        <span
                                                            key={project.id}
                                                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                                                        >
                                                            <div 
                                                                className="w-2 h-2 rounded-full mr-1"
                                                                style={{ backgroundColor: project.color || '#6366f1' }}
                                                            />
                                                            {project.name}
                                                        </span>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    )}
                                    <div className="max-h-40 overflow-y-auto p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border">
                                        {allProjects.length > 0 && (
                                            <div className="mb-3">
                                                <input
                                                    type="text"
                                                    placeholder="Buscar proyectos..."
                                                    value={projectSearchTerm}
                                                    onChange={(e) => setProjectSearchTerm(e.target.value)}
                                                    className="w-full p-2 text-sm rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent"
                                                />
                                            </div>
                                        )}
                                        {filteredProjects.length > 0 ? (
                                            <div className="space-y-2">
                                                {filteredProjects.map(project => (
                                                    <label key={project.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={memberOfProjectIds.has(project.id)}
                                                            onChange={() => handleProjectMembershipChange(project.id)}
                                                            disabled={!isAdminEditing}
                                                            className="h-4 w-4 rounded text-primary focus:ring-primary disabled:cursor-not-allowed"
                                                        />
                                                        <div className="flex items-center space-x-2 flex-1">
                                                            <div 
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: project.color || '#6366f1' }}
                                                            />
                                                            <span className="text-sm font-medium">{project.name}</span>
                                                            <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                                                ({project.members.length} miembros)
                                                            </span>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center text-light-text-secondary dark:text-dark-text-secondary py-4">
                                                <p className="text-sm">
                                                    {projectSearchTerm ? 'No se encontraron proyectos que coincidan con la búsqueda' : 'No hay proyectos disponibles'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end p-4 bg-gray-50 dark:bg-dark-card-darker border-t border-light-border dark:border-dark-border rounded-b-lg">
                            <button type="button" onClick={onClose} className="px-2 py-1 mr-2 bg-gray-200 dark:bg-gray-700 dark:text-dark-text text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 text-sm">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isProcessingImage} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm w-32 h-9 flex items-center justify-center">
                                {isProcessingImage ? 'Procesando...' : (isEditing ? 'Guardar Cambios' : 'Crear Usuario')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {isCameraOpen && (
                <CameraModal 
                    onClose={() => setIsCameraOpen(false)}
                    onCapture={imageDataUrl => {
                        setIsCameraOpen(false);
                        processAndSetImage(imageDataUrl);
                    }}
                />
            )}
        </>
    );
};

export default UserFormModal;
