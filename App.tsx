import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ScheduleManagement from './components/LeaveManagement';
import Workspace from './components/Workspace';
import Login from './components/Login';
import MemberManagement from './components/MemberManagement';
import { User, ScheduleEvent, Doc, ScheduleType, Folder, Task, Activity } from './types';
import { api } from './services/api';

// Mock Data for Users (Auth usually handled separately)
const INITIAL_USERS: User[] = [
  { id: 'admin', name: '관리자', role: 'Admin', password: '1234' },
  { id: 'u1', name: '김철수', role: 'Member', password: '1234' },
  { id: 'u2', name: '이영희', role: 'Member', password: '1234' },
  { id: 'u3', name: '박민수', role: 'Member', password: '1234' },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  
  // Data State managed by API
  const [schedules, setSchedules] = useState<ScheduleEvent[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);

  // Load initial data from "Backend"
  useEffect(() => {
    if (currentUser) {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [fetchedSchedules, fetchedDocs, fetchedTasks, fetchedActivities] = await Promise.all([
                    api.getSchedules(),
                    api.getDocs(),
                    api.getTasks(),
                    api.getActivities()
                ]);
                setSchedules(fetchedSchedules);
                setDocs(fetchedDocs);
                setTasks(fetchedTasks);
                setActivities(fetchedActivities);
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleRegister = (user: User) => {
    setUsers(prev => [...prev, user]);
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSchedules([]);
    setDocs([]);
    setTasks([]);
    setActivities([]);
  };

  // --- Schedule Logic with API ---
  const handleAddSchedule = async (schedule: ScheduleEvent) => {
    // 1. Optimistic Update or Wait for API
    setSchedules(prev => [schedule, ...prev]);
    
    // 2. Call API
    await api.addSchedule(schedule);

    // 3. Log Activity
    const activityLog = await api.logActivity({
        user: currentUser?.name || 'Unknown',
        action: '일정 등록',
        target: schedule.title
    });
    setActivities(prev => [activityLog, ...prev]);
  };

  // --- Workspace Logic with API ---
  const handleAddDoc = async (doc: Doc) => {
    setDocs(prev => [...prev, doc]);
    await api.saveDoc(doc, true);

    const activityLog = await api.logActivity({
        user: currentUser?.name || 'Unknown',
        action: '문서 생성',
        target: doc.title
    });
    setActivities(prev => [activityLog, ...prev]);
  };

  const handleUpdateDoc = async (updatedDoc: Doc) => {
    setDocs(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
    await api.saveDoc(updatedDoc, false);
    // Optional: Log update activity?
  };

  const handleDeleteDoc = async (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    await api.deleteDoc(id);
  };

  const handleAddFolder = (folder: Folder) => {
    setFolders(prev => [...prev, folder]);
    // Note: Folder persistence can be added to API similarly if needed
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    setDocs(prev => prev.map(d => d.folderId === folderId ? { ...d, folderId: undefined } : d));
  };

  // --- Dashboard Logic with API ---
  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const updatedTask = { ...task, completed: !task.completed };
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
        await api.updateTask(updatedTask);
        
        if (updatedTask.completed) {
             const activityLog = await api.logActivity({
                user: currentUser?.name || 'Unknown',
                action: '할 일 완료',
                target: task.title
            });
            setActivities(prev => [activityLog, ...prev]);
        }
    }
  };

  const handleAddTask = async (title: string, priority: 'High' | 'Medium' | 'Low') => {
    const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        dueDate: '오늘',
        completed: false,
        priority
    };
    setTasks(prev => [...prev, newTask]);
    await api.addTask(newTask);
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await api.deleteTask(taskId);
  };

  const handleQuickAction = (action: string) => {
    if (action === 'schedule') setActiveTab('schedule');
    if (action === 'doc') setActiveTab('workspace');
  };

  // Member Management Logic
  const handleAddUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Login Screen
  if (!currentUser) {
    return <Login users={users} onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar 
        user={currentUser}
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
      />
      
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-100 px-8 py-4 sticky top-0 z-10 flex justify-between items-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {activeTab === 'dashboard' && '대시보드'}
            {activeTab === 'schedule' && '일정 및 연차 관리'}
            {activeTab === 'workspace' && '워크스페이스'}
            {activeTab === 'members' && '구성원 관리'}
          </h1>
          {isLoading && <span className="text-sm text-slate-400 animate-pulse">데이터 동기화 중...</span>}
        </header>

        <div className="p-6 h-[calc(100vh-73px)] overflow-y-auto">
          <div className="max-w-7xl mx-auto h-full">
            {activeTab === 'dashboard' && (
                <Dashboard 
                    user={currentUser} 
                    users={users}
                    schedules={schedules} 
                    docs={docs}
                    tasks={tasks}
                    activities={activities}
                    onToggleTask={handleToggleTask}
                    onAddTask={handleAddTask}
                    onDeleteTask={handleDeleteTask}
                    onQuickAction={handleQuickAction}
                />
            )}
            {activeTab === 'schedule' && <ScheduleManagement user={currentUser} schedules={schedules} onAddSchedule={handleAddSchedule} />}
            {activeTab === 'workspace' && (
              <Workspace 
                user={currentUser} 
                docs={docs} 
                folders={folders}
                onAddDoc={handleAddDoc} 
                onUpdateDoc={handleUpdateDoc} 
                onDeleteDoc={handleDeleteDoc}
                onAddFolder={handleAddFolder}
                onDeleteFolder={handleDeleteFolder}
              />
            )}
            {activeTab === 'members' && currentUser.role === 'Admin' && (
              <MemberManagement 
                currentUser={currentUser}
                users={users} 
                onAddUser={handleAddUser} 
                onDeleteUser={handleDeleteUser} 
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;