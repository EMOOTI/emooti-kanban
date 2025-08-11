
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db, auth } from './services/firebase';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { User, View, Project, Task, Column } from './types';
import { useTheme } from './hooks/useTheme';
import LoginView from './components/LoginView';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import HomeDashboardView from './components/HomeDashboardView';
import ProjectsView from './components/ProjectsView';
import MyTasksView from './components/MyTasksView';
import SettingsView from './components/SettingsView';

const App: React.FC = () => {
    const { theme } = useTheme();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [view, setView] = useState<View>('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // Firestore State
    const [users, setUsers] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [columns, setColumns] = useState<Column[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            console.log('Auth state changed:', firebaseUser?.email);
            setIsLoadingAuth(false);
            
            if (firebaseUser) {
                // Simular usuario para pruebas
                setCurrentUser({
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    firstName: 'Usuario',
                    lastName: 'Prueba',
                    role: 'User' as any,
                    avatarUrl: 'https://via.placeholder.com/40'
                } as User);
            } else {
                setCurrentUser(null);
            }
        });

        return () => authUnsubscribe();
    }, []);

    // Firestore Listeners
    useEffect(() => {
        if (!currentUser) return;
        
        const unsubscribers: (() => void)[] = [];
        
        // Listen for all users
        const usersQuery = query(collection(db, "users"));
        const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(usersData);
        });
        unsubscribers.push(unsubUsers);

        // Listen for projects where the current user is a member
        const projectsQuery = query(collection(db, 'projects'), where('members', 'array-contains', currentUser.id));
        const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
            const projectsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    teams: data.teams || [],
                } as Project;
            });
            setProjects(projectsData);
        });
        unsubscribers.push(unsubProjects);

        // Listen for columns
        const columnsQuery = query(collection(db, 'columns'));
        const unsubColumns = onSnapshot(columnsQuery, (snapshot) => {
            const columnsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Column));
            setColumns(columnsData.sort((a, b) => a.order - b.order));
        });
        unsubscribers.push(unsubColumns);

        // Listen for tasks
        const tasksQuery = query(collection(db, 'tasks'));
        const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
            const tasksData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    columnId: data.status,
                    subtasks: data.subtasks || [],
                    collaborators: data.collaborators || [],
                } as Task;
            });
            setTasks(tasksData.sort((a, b) => a.order - b.order));
        });
        unsubscribers.push(unsubTasks);

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [currentUser]);

    const handleLogout = () => {
        auth.signOut();
    };

    const handleNavigateToView = (newView: string) => {
        setView(newView as View);
    };

    const userProjects = projects.filter(p => p.members.includes(currentUser?.id || ''));

    if (isLoadingAuth) {
        return (
            <div className={`h-screen w-screen flex items-center justify-center ${theme}`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-lg">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-screen w-screen flex flex-col ${theme}`}>
            {!currentUser ? (
                <LoginView />
            ) : (
                <div className="flex h-full">
                    <Sidebar 
                        currentUser={currentUser}
                        projects={userProjects}
                        allProjects={projects}
                        users={users}
                        currentView={view}
                        onNavigateToView={handleNavigateToView}
                        onSelectProject={() => {}}
                        onAddProject={() => {}}
                        deleteUser={() => {}}
                        deleteProject={() => {}}
                        onEditProject={() => {}}
                        onAddMembers={() => {}}
                        onNavigateToSupport={() => {}}
                        onSendMessage={() => {}}
                    />
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="bg-green-500 text-white text-lg font-bold px-4 py-2 text-center">
                            ✅ Emooti v2.1 - MENÚ DE USUARIO ACTIVADO
                        </div>
                        <Header 
                            currentUser={currentUser}
                            onLogout={handleLogout}
                            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            onBackToProjects={() => {}}
                            notifications={[]}
                            onMarkNotificationsAsRead={() => {}}
                        />
                        <div className="flex-1 overflow-hidden">
                            {view === 'home' && (
                                <HomeDashboardView 
                                    currentUser={currentUser}
                                    projects={userProjects}
                                    tasks={tasks}
                                    users={users}
                                    columns={columns}
                                    onSelectTask={() => {}}
                                    onCreateTask={() => {}}
                                    onToggleComplete={() => {}}
                                />
                            )}
                            {view === 'projects' && (
                                <ProjectsView 
                                    projects={userProjects}
                                    currentUser={currentUser}
                                    onSelectProject={() => {}}
                                    onEditProject={() => {}}
                                    onDeleteProject={() => {}}
                                    onAddProject={() => {}}
                                    onOpenColorPicker={() => {}}
                                    onAddMembers={() => {}}
                                    onCreateAITask={() => {}}
                                />
                            )}
                            {view === 'mytasks' && (
                                <MyTasksView 
                                    currentUser={currentUser}
                                    projects={userProjects}
                                    tasks={tasks}
                                    users={users}
                                    columns={columns}
                                    onSelectTask={() => {}}
                                    onCreateTask={() => {}}
                                    onUpdateTask={() => {}}
                                    onNavigateToView={handleNavigateToView}
                                    onNavigateToUsers={() => {}}
                                    currentView={view}
                                    currentProjectId={null}
                                    onToggleComplete={() => {}}
                                />
                            )}
                            {view === 'settings' && (
                                <SettingsView 
                                    user={currentUser}
                                    onUpdateUser={() => {}}
                                />
                            )}
                            {!['home', 'projects', 'mytasks', 'settings'].includes(view) && (
                                <div className="p-4">
                                    <h1 className="text-2xl font-bold mb-4">Vista: {view}</h1>
                                    <div className="bg-blue-100 p-4 rounded">
                                        <p>Esta vista está en desarrollo</p>
                                        <p>Proyectos: {projects.length}</p>
                                        <p>Tareas: {tasks.length}</p>
                                        <p>Usuarios: {users.length}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;