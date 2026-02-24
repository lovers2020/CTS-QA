import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import ScheduleManagement from "./components/LeaveManagement";
import Workspace from "./components/Workspace";
import Login from "./components/Login";
import MemberManagement from "./components/MemberManagement";
import MyPage from "./components/MyPage";
import { User, ScheduleEvent, Doc, Folder, Task, Activity } from "./types";
import { api } from "./services/api";
import { auth, db } from "./firebase";

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState("dashboard");

    const [users, setUsers] = useState<User[]>([]);

    // Data State managed by API
    const [schedules, setSchedules] = useState<ScheduleEvent[]>([]);
    const [docs, setDocs] = useState<Doc[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    // Authentication Observer
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(
            async (firebaseUser: any) => {
                if (firebaseUser) {
                    // Fetch extended user profile (role, name) from Firestore
                    const userDocRef = db
                        .collection("users")
                        .doc(firebaseUser.uid);
                    const userSnap = await userDocRef.get();

                    if (userSnap.exists) {
                        const userData = userSnap.data() as User;
                        setCurrentUser({ ...userData, id: firebaseUser.uid });
                    } else {
                        // Fallback if user doc doesn't exist yet (shouldn't happen with correct flow)
                        setCurrentUser({
                            id: firebaseUser.uid,
                            name: firebaseUser.email?.split("@")[0] || "User",
                            role: "Member",
                        });
                    }
                } else {
                    setCurrentUser(null);
                }
                setIsLoading(false);
            },
        );

        return () => unsubscribe();
    }, []);

    // Load Data when User changes
    useEffect(() => {
        if (currentUser) {
            const loadData = async () => {
                try {
                    // Fetch all data in parallel
                    const [
                        fetchedSchedules,
                        fetchedDocs,
                        fetchedFolders,
                        fetchedTasks,
                        fetchedActivities,
                        fetchedUsers,
                    ] = await Promise.all([
                        api.getSchedules(),
                        api.getDocs(),
                        api.getFolders(),
                        api.getTasks(currentUser.id),
                        api.getActivities(),
                        api.getUsers(),
                    ]);
                    setSchedules(fetchedSchedules);
                    setDocs(fetchedDocs);
                    setFolders(fetchedFolders);
                    setTasks(fetchedTasks);
                    setActivities(fetchedActivities);
                    setUsers(fetchedUsers);
                } catch (error) {
                    console.error("Failed to load data", error);
                }
            };
            loadData();
        }
    }, [currentUser]);

    // Login/Register just updates state locally if needed, but Auth Observer handles the main logic
    const handleLogin = (_user: User) => {
        // handled by onAuthStateChanged
        setActiveTab("dashboard");
    };

    const handleRegister = (user: User) => {
        setUsers((prev) => {
            if (prev.some((u) => u.id === user.id)) return prev;
            return [...prev, user];
        });
        // handled by onAuthStateChanged
        setActiveTab("dashboard");
    };

    const handleLogout = async () => {
        await auth.signOut();
        setSchedules([]);
        setDocs([]);
        setFolders([]);
        setTasks([]);
        setActivities([]);
        setUsers([]); // Clear users on logout
        setActiveTab("dashboard");
    };

    const handleUpdateProfile = async (updatedData: Partial<User>) => {
        if (!currentUser) return;

        // Update API with ID migration support
        await api.updateUser(updatedData, currentUser.id);

        // Update Local State
        // If ID changed, updatedData.id will be present and different
        const newUserState = { ...currentUser, ...updatedData };

        // Update current user state immediately for UI responsiveness
        setCurrentUser(newUserState);

        // Update Users List state
        setUsers((prev) =>
            prev.map((u) => (u.id === currentUser.id ? newUserState : u)),
        );

        // If ID changed, we also need to reload data to ensure references are correct
        if (updatedData.id && updatedData.id !== currentUser.id) {
            const [
                fetchedSchedules,
                fetchedDocs,
                fetchedFolders,
                fetchedTasks,
            ] = await Promise.all([
                api.getSchedules(),
                api.getDocs(),
                api.getFolders(),
                api.getTasks(updatedData.id),
            ]);
            setSchedules(fetchedSchedules);
            setDocs(fetchedDocs);
            setFolders(fetchedFolders);
            setTasks(fetchedTasks);
        }
    };

    // --- Schedule Logic with API ---
    const handleAddSchedule = async (schedule: ScheduleEvent) => {
        setSchedules((prev) => [schedule, ...prev]);
        await api.addSchedule(schedule);

        const activityLog = await api.logActivity({
            user: currentUser?.name || "Unknown",
            action: "일정 등록",
            target: schedule.title,
        });
        setActivities((prev) => [activityLog, ...prev]);
    };

    // --- Workspace Logic with API ---
    const handleAddDoc = async (doc: Doc) => {
        setDocs((prev) => [...prev, doc]);
        await api.saveDoc(doc);

        const activityLog = await api.logActivity({
            user: currentUser?.name || "Unknown",
            action: "문서 생성",
            target: doc.title,
        });
        setActivities((prev) => [activityLog, ...prev]);
    };

    const handleUpdateDoc = async (updatedDoc: Doc) => {
        setDocs((prev) =>
            prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)),
        );
        await api.saveDoc(updatedDoc);
    };

    const handleDeleteDoc = async (id: string) => {
        setDocs((prev) => prev.filter((d) => d.id !== id));
        await api.deleteDoc(id);
    };

    const handleAddFolder = async (folder: Folder) => {
        setFolders((prev) => [...prev, folder]);
        await api.addFolder(folder);
    };

    const handleUpdateFolder = async (folder: Folder) => {
        setFolders((prev) =>
            prev.map((f) => (f.id === folder.id ? folder : f)),
        );
        await api.updateFolder(folder);
    };

    const handleDeleteFolder = async (folderId: string) => {
        // Optimistic Update
        setFolders((prev) => prev.filter((f) => f.id !== folderId));
        setDocs((prev) =>
            prev.map((d) =>
                d.folderId === folderId ? { ...d, folderId: undefined } : d,
            ),
        );

        // API Call
        await api.deleteFolder(folderId);

        // Update orphaned docs in DB
        const orphanedDocs = docs.filter((d) => d.folderId === folderId);
        await Promise.all(
            orphanedDocs.map((d) => api.saveDoc({ ...d, folderId: undefined })),
        );
    };

    // --- Dashboard Logic with API ---
    const handleToggleTask = async (taskId: string) => {
        const task = tasks.find((t) => t.id === taskId);
        if (task) {
            const isNowCompleted = !task.completed;
            const updatedTask = { ...task, completed: isNowCompleted };

            // Only log if becoming completed AND hasn't been logged before
            if (isNowCompleted && !task.hasLoggedCompletion) {
                // Removed activity logging for private tasks

                // Mark as logged so we don't log again
                updatedTask.hasLoggedCompletion = true;
            }

            setTasks((prev) =>
                prev.map((t) => (t.id === taskId ? updatedTask : t)),
            );
            await api.updateTask(updatedTask);
        }
    };

    const handleAddTask = async (
        title: string,
        priority: "High" | "Medium" | "Low",
    ) => {
        if (!currentUser) return;
        const newTask: Task = {
            id: Math.random().toString(36).substr(2, 9),
            userId: currentUser.id,
            title,
            dueDate: "오늘",
            completed: false,
            priority,
            hasLoggedCompletion: false,
        };
        setTasks((prev) => [...prev, newTask]);
        await api.addTask(newTask);
    };

    const handleDeleteTask = async (taskId: string) => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        await api.deleteTask(taskId);
    };

    const handleQuickAction = (action: string) => {
        if (action === "schedule") setActiveTab("schedule");
        if (action === "doc") setActiveTab("workspace");
    };

    // Member Management Logic
    const handleAddUser = async (user: User) => {
        // Admin only feature usually
        setUsers((prev) => [...prev, user]);
        await api.saveUser(user);
    };

    const handleDeleteUser = async (userId: string) => {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        await api.deleteUser(userId);
    };

    // Loading Screen
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Login Screen
    if (!currentUser) {
        return <Login onLogin={handleLogin} onRegister={handleRegister} />;
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
                        {activeTab === "dashboard" && "대시보드"}
                        {activeTab === "schedule" && "일정 및 연차 관리"}
                        {activeTab === "workspace" && "워크스페이스"}
                        {activeTab === "mypage" && "마이페이지"}
                        {activeTab === "members" && "구성원"}
                    </h1>
                </header>

                <div className="p-6 h-[calc(100vh-73px)] overflow-y-auto">
                    <div className="max-w-7xl mx-auto h-full">
                        {activeTab === "dashboard" && (
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
                        {activeTab === "schedule" && (
                            <ScheduleManagement
                                user={currentUser}
                                schedules={schedules}
                                onAddSchedule={handleAddSchedule}
                            />
                        )}
                        {activeTab === "workspace" && (
                            <Workspace
                                user={currentUser}
                                docs={docs}
                                folders={folders}
                                onAddDoc={handleAddDoc}
                                onUpdateDoc={handleUpdateDoc}
                                onDeleteDoc={handleDeleteDoc}
                                onAddFolder={handleAddFolder}
                                onUpdateFolder={handleUpdateFolder}
                                onDeleteFolder={handleDeleteFolder}
                            />
                        )}
                        {activeTab === "mypage" && (
                            <MyPage
                                user={currentUser}
                                onUpdateProfile={handleUpdateProfile}
                            />
                        )}
                        {activeTab === "members" && (
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
