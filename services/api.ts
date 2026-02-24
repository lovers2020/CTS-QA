import { db } from "../firebase";
import { ScheduleEvent, Activity, Doc, Task, User, Folder } from "../types";

// Helper to convert Firestore data to our types
const mapDoc = <T>(doc: any): T => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
    } as T;
};

// Helper to sanitize data (remove undefined fields)
const sanitize = (data: any) => JSON.parse(JSON.stringify(data));

// API Service
export const api = {
    // --- Schedules ---
    getSchedules: async (): Promise<ScheduleEvent[]> => {
        try {
            const querySnapshot = await db
                .collection("schedules")
                .orderBy("startDate", "asc")
                .get();
            return querySnapshot.docs.map((doc: any) =>
                mapDoc<ScheduleEvent>(doc),
            );
        } catch (e) {
            console.error("Error fetching schedules:", e);
            return [];
        }
    },

    addSchedule: async (schedule: ScheduleEvent): Promise<ScheduleEvent> => {
        const { id, ...data } = schedule;
        const docRef = await db.collection("schedules").add(sanitize(data));
        return { ...schedule, id: docRef.id };
    },

    // --- Activities (Feed) ---
    getActivities: async (): Promise<Activity[]> => {
        try {
            const querySnapshot = await db
                .collection("activities")
                .orderBy("createdAt", "desc")
                .limit(50)
                .get();
            return querySnapshot.docs.map((doc: any) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    user: data.user,
                    action: data.action,
                    target: data.target,
                    time: data.time,
                } as Activity;
            });
        } catch (e) {
            return [];
        }
    },

    logActivity: async (
        activity: Omit<Activity, "id" | "time">,
    ): Promise<Activity> => {
        const newActivity = {
            ...activity,
            time: "방금 전",
            createdAt: new Date().toISOString(),
        };
        const docRef = await db
            .collection("activities")
            .add(sanitize(newActivity));
        return { id: docRef.id, ...activity, time: "방금 전" };
    },

    // --- Docs ---
    getDocs: async (): Promise<Doc[]> => {
        try {
            const querySnapshot = await db
                .collection("docs")
                .orderBy("updatedAt", "desc")
                .get();
            return querySnapshot.docs.map((doc: any) => mapDoc<Doc>(doc));
        } catch (e) {
            return [];
        }
    },

    saveDoc: async (document: Doc): Promise<Doc> => {
        const { id, ...data } = document;
        // Always use set to handle undefined fields (which JSON.stringify removes) correctly
        // This ensures that if we set folderId to undefined, it gets removed from the DB doc upon overwrite
        await db.collection("docs").doc(id).set(sanitize(data));
        return document;
    },

    deleteDoc: async (id: string): Promise<void> => {
        await db.collection("docs").doc(id).delete();
    },

    // --- Folders ---
    getFolders: async (): Promise<Folder[]> => {
        try {
            const querySnapshot = await db
                .collection("folders")
                .orderBy("createdAt", "asc")
                .get();
            return querySnapshot.docs.map((doc: any) => mapDoc<Folder>(doc));
        } catch (e) {
            return [];
        }
    },

    addFolder: async (folder: Folder): Promise<Folder> => {
        const { id, ...data } = folder;
        await db.collection("folders").doc(id).set(sanitize(data));
        return folder;
    },

    updateFolder: async (folder: Folder): Promise<Folder> => {
        const { id, ...data } = folder;
        await db.collection("folders").doc(id).update(sanitize(data));
        return folder;
    },

    deleteFolder: async (id: string): Promise<void> => {
        await db.collection("folders").doc(id).delete();
    },

    // --- Tasks ---
    getTasks: async (userId: string): Promise<Task[]> => {
        try {
            const querySnapshot = await db.collection("tasks").get();
            const allTasks = querySnapshot.docs.map((doc: any) =>
                mapDoc<Task>(doc),
            );
            return allTasks.filter((t: Task) => t.userId === userId);
        } catch (e) {
            return [];
        }
    },

    updateTask: async (task: Task): Promise<Task> => {
        const { id, ...data } = task;
        await db.collection("tasks").doc(id).update(sanitize(data));
        return task;
    },

    addTask: async (task: Task): Promise<Task> => {
        const { id, ...data } = task;
        await db.collection("tasks").doc(id).set(sanitize(data));
        return task;
    },

    deleteTask: async (id: string): Promise<void> => {
        await db.collection("tasks").doc(id).delete();
    },

    // --- Users ---
    getUsers: async (): Promise<User[]> => {
        try {
            const querySnapshot = await db.collection("users").get();
            return querySnapshot.docs.map((doc: any) => mapDoc<User>(doc));
        } catch (e) {
            return [];
        }
    },

    saveUser: async (user: User): Promise<void> => {
        await db.collection("users").doc(user.id).set(sanitize(user));
    },

    updateUser: async (
        updatedData: Partial<User>,
        userId: string,
    ): Promise<void> => {
        await db.collection("users").doc(userId).update(sanitize(updatedData));
    },

    deleteUser: async (userId: string): Promise<void> => {
        await db.collection("users").doc(userId).delete();
    },
};
