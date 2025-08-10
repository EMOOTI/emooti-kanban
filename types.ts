
export type Id = string; // Firestore IDs are strings

export type View = 'home' | 'mytasks' | 'dashboard' | 'projects' | 'board' | 'timeline' | 'settings' | 'users' | 'inbox' | 'voicetest';

// Corresponds to /projects/{projectId} in Firestore
export interface Project {
    id: Id;
    name: string;
    description: string;
    ownerId: Id; // UID of the creator
    members: Id[]; // Array of UIDs
    teams: Id[]; // Array of team IDs
    createdAt: string; // ISO String, from Firestore Timestamp
    status: 'activo' | 'inactivo' | 'archivado';
    color?: string;
    imageUrl?: string;
}

export enum Priority {
    Low = 'Baja',
    Medium = 'Media',
    High = 'Alta',
    Urgent = 'Urgente',
}

// Corresponds to the roles in Firestore security rules
export enum UserRole {
    Admin = 'admin',
    ProjectManager = 'project_manager',
    User = 'user',
}

// Corresponds to /users/{uid} in Firestore
export interface User {
    id: Id; // This is the Firebase Auth UID
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: UserRole;
    position: string;
    avatarUrl: string;
    color?: string; // Color for user avatar
}

// This entity can be stored in a 'groups' collection in Firestore
export interface Group {
    id: Id;
    name:string;
    avatarUrl: string;
    memberIds: Id[]; // Using memberIds to be consistent with component logic
}

export interface Team {
    id: Id;
    name: string;
    color: string;
    members: User[];
    description?: string;
}

// Corresponds to /columns/{columnId} - a new collection
export interface Column {
    id: Id;
    projectId: Id;
    title: string;
    color?: string;
    order: number;
    isDoneColumn?: boolean;
}


// Corresponds to /tasks/{taskId} in Firestore
export interface Task {
    id: Id;
    projectId: Id;
    columnId: Id; // In Firestore, this field will be named 'status'
    title: string;
    description?: string;
    startDate?: string;
    dueDate?: string;
    priority: Priority;
    assignedTo?: Id; // Single assignee (user or team)
    assignedTeam?: Id; // Team assignee
    collaborators?: Id[]; // Array of collaborator IDs (users)
    collaboratorTeams?: Id[]; // Array of team IDs
    createdBy: Id; // User who created the task
    subtasks?: Subtask[];
    coverImage?: string; // Corresponds to 'imageUrl' in Firestore
    color?: string;
    createdAt: string; // ISO String
    updatedAt: string; // ISO String
    order: number;
    status?: 'pending' | 'completed'; // Estado de la tarea
    taskStatus?: 'pending' | 'completed'; // Estado de completado de la tarea (Firestore field)
    isNewTask?: boolean; // Flag para identificar tareas nuevas en el modal
}


export interface Subtask {
    id: Id;
    title: string;
    completed: boolean;
    responsibleId?: Id;
    dueDate?: string;
}

export interface ActivityUser {
    id: Id;
    firstName: string;
    lastName: string;
    avatarUrl: string;
}

export interface Activity {
    id: Id;
    user: ActivityUser;
    projectId: Id;
    action: string;
    entityTitle: string;
    timestamp: string;
}

export interface Notification {
    id: Id;
    userId: Id;
    message: string;
    read: boolean;
    timestamp: string;
    link?: string;
}
