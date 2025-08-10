import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole, Project, Id } from '../types';
import { XIcon, UploadIcon, CameraIcon } from './icons';
import { sendUserAddedToProjectEmail } from '../services/notificationService';
import CameraModal from './CameraModal';
import { resizeImage } from '../services/imageService';
import { doc, writeBatch, arrayUnion, arrayRemove, addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';

interface CreateUserModalProps {
    isOpen: boolean;
    currentUser: User | null;
    allProjects: Project[];
    userToEdit?: User | null;
    onClose: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, currentUser, allProjects, userToEdit, onClose }) => {
    const isEditing = !!userToEdit;
    
    const [formData, setFormData] = useState<Partial<User>>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: UserRole.User,
        position: '',
        avatarUrl: ''
    });
    
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [memberOfProjectIds, setMemberOfProjectIds] = useState<Set<Id>>(new Set());

    // Actualizar datos cuando cambie userToEdit
    useEffect(() => {
        if (userToEdit) {
            setFormData({
                ...userToEdit,
                firstName: userToEdit.firstName || '',
                lastName: userToEdit.lastName || '',
                email: userToEdit.email || '',
                phone: userToEdit.phone || '',
                role: userToEdit.role || UserRole.User,
                position: userToEdit.position || '',
                avatarUrl: userToEdit.avatarUrl || ''
            });
            setAvatarPreview(userToEdit.avatarUrl || '');
            setMemberOfProjectIds(new Set(allProjects.filter(p => p.members.includes(userToEdit.id)).map(p => p.id)));
        } else {
            // Resetear para modo creación
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                role: UserRole.User,
                position: '',
                avatarUrl: ''
            });
            setAvatarPreview('');
            setMemberOfProjectIds(new Set());
        }
    }, [userToEdit, allProjects]);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessingImage, setIsProcessingImage] = useState(false);

    const isAdminEditing = currentUser?.role === UserRole.Admin || currentUser?.role === UserRole.ProjectManager;
    
    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            setFormData(prev => ({ ...prev, avatarUrl: resizedImage }));
            setAvatarPreview(resizedImage);
        } catch (error) {
            console.error("Error al redimensionar la imagen:", error);
            alert("Error al procesar la imagen. Inténtalo de nuevo.");
            setAvatarPreview(formData.avatarUrl || '');
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
        if (!formData.firstName || !formData.lastName || !formData.email || isProcessingImage) return;
        
        try {
            const batch = writeBatch(db);
            
            if (isEditing && userToEdit) {
                // Modo edición - actualizar usuario existente
                const { id, ...dataToUpdate } = formData;
                const userRef = doc(db, 'users', userToEdit.id);
                batch.update(userRef, { ...dataToUpdate, updatedAt: new Date() });
                
                // Actualizar membresías de proyectos
                const currentProjectIds = new Set(allProjects.filter(p => p.members.includes(userToEdit.id)).map(p => p.id));
                const projectsToAdd = [...memberOfProjectIds].filter(pId => !currentProjectIds.has(pId));
                const projectsToRemove = [...currentProjectIds].filter(pId => !memberOfProjectIds.has(pId));

                projectsToAdd.forEach(projectId => {
                    const projectRef = doc(db, "projects", projectId);
                    batch.update(projectRef, { members: arrayUnion(userToEdit.id) });
                });
                projectsToRemove.forEach(projectId => {
                    const projectRef = doc(db, "projects", projectId);
                    batch.update(projectRef, { members: arrayRemove(userToEdit.id) });
                });
            } else {
                // Modo creación - crear nuevo usuario
                const newUserData = {
                    ...formData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                const userRef = doc(collection(db, 'users'));
                const newUser = { ...newUserData, id: userRef.id };
                batch.set(userRef, newUserData);
                
                // Agregar el usuario a los proyectos seleccionados
                memberOfProjectIds.forEach(projectId => {
                    const projectRef = doc(db, "projects", projectId);
                    batch.update(projectRef, { members: arrayUnion(userRef.id) });
                });
                
                // Enviar email de bienvenida solo para nuevos usuarios
                sendUserAddedToProjectEmail(newUser as User, 'EMOOTI');
            }
            
            // Ejecutar la escritura atómica
            await batch.commit();

            // Limpiar formulario y cerrar modal
            if (!isEditing) {
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    role: UserRole.User,
                    position: '',
                    avatarUrl: ''
                });
                setAvatarPreview('');
                setMemberOfProjectIds(new Set());
            }
            onClose();

        } catch (error) {
            console.error(isEditing ? "Error al actualizar el usuario:" : "Error al crear el usuario:", error);
            alert(isEditing ? "No se pudo actualizar el usuario. Inténtalo de nuevo." : "No se pudo crear el usuario. Inténtalo de nuevo.");
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
                <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-4 border-b border-light-border dark:border-dark-border">
                        <h2 className="text-xl font-bold">{isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <XIcon />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="flex items-center space-x-6">
                                <div className="relative group">
                                    <img src={avatarPreview || '/default-avatar.png'} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
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
                                        <label htmlFor="firstName" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Nombre *</label>
                                        <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary text-black" />
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Apellidos *</label>
                                        <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary text-black" />
                                    </div>
                                </div>
                            </div>
                           
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Correo Electrónico *</label>
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary text-black" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Teléfono</label>
                                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary text-black" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Rol</label>
                                    <select id="role" name="role" value={formData.role} onChange={handleChange} disabled={!isAdminEditing} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed text-black">
                                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="position" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Cargo / Puesto</label>
                                    <input type="text" id="position" name="position" value={formData.position} onChange={handleChange} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border focus:ring-2 focus:ring-primary text-black" />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">Pertenencia a Proyectos</label>
                                <div className={`grid grid-cols-2 gap-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-light-border dark:border-dark-border ${!isAdminEditing ? 'opacity-70' : ''}`}>
                                    {allProjects.map(project => (
                                        <label key={project.id} className="flex items-center space-x-2">
                                            <input 
                                                type="checkbox" 
                                                checked={memberOfProjectIds.has(project.id)}
                                                onChange={() => handleProjectMembershipChange(project.id)}
                                                disabled={!isAdminEditing}
                                                className="h-4 w-4 rounded focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed"
                                                style={{
                                                    accentColor: project.color || '#3B82F6',
                                                    backgroundColor: memberOfProjectIds.has(project.id) ? (project.color || '#3B82F6') : 'transparent',
                                                    borderColor: project.color || '#3B82F6'
                                                }}
                                            />
                                            <span className="text-black">{project.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end p-4 bg-gray-50 dark:bg-dark-card-darker border-t border-light-border dark:border-dark-border rounded-b-lg">
                            <button type="button" onClick={onClose} className="px-2 py-1 mr-2 bg-gray-200 dark:bg-gray-700 dark:text-dark-text text-gray-800 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 text-sm">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isProcessingImage} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-hover transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm w-32 h-9 flex items-center justify-center">
                                {isProcessingImage ? 'Procesando...' : (isEditing ? 'Modificar Usuario' : 'Crear Usuario')}
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

export default CreateUserModal; 