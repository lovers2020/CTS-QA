import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// Safe environment variable access
const getEnv = (key: string) => {
    if (typeof import.meta !== "undefined" && (import.meta as any).env) {
        return (import.meta as any).env[key] || "";
    }
    return "";
};

const apiKey = getEnv("VITE_FIREBASE_API_KEY");

let auth: any;
let db: any;
let app: any;

// Use real Firebase only if a valid-looking API key is present
if (apiKey && !apiKey.includes("여기에") && apiKey.length > 10) {
    const firebaseConfig = {
        apiKey: apiKey,
        authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
        projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
        storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
        messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
        appId: getEnv("VITE_FIREBASE_APP_ID"),
    };

    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app();
    }
    auth = app.auth();
    db = app.firestore();
} else {
    console.warn(
        "⚠️ Firebase API Key missing. Using Mock Data Service (LocalStorage).",
    );

    // --- MOCK AUTH ---
    const observers: any[] = [];
    const notifyObservers = (user: any) => observers.forEach((cb) => cb(user));

    // Helper to sync mock auth user to mock firestore users collection
    const syncUserToFirestore = (user: any) => {
        const users = JSON.parse(
            localStorage.getItem("mock_firestore_users") || "[]",
        );
        const existingIndex = users.findIndex((u: any) => u.id === user.uid);

        const userData = {
            id: user.uid,
            name: user.displayName || user.uid,
            role: user.role || "Member",
            // Removed email field requirements
        };

        if (existingIndex >= 0) {
            // Update existing
            users[existingIndex] = { ...users[existingIndex], ...userData };
        } else {
            // Create new
            users.push(userData);
        }
        localStorage.setItem("mock_firestore_users", JSON.stringify(users));
    };

    auth = {
        currentUser: null,
        onAuthStateChanged: (cb: any) => {
            observers.push(cb);
            const stored = localStorage.getItem("mock_user");
            if (stored) {
                try {
                    const user = JSON.parse(stored);
                    auth.currentUser = user;
                    setTimeout(() => cb(user), 50);
                } catch {
                    setTimeout(() => cb(null), 50);
                }
            } else {
                setTimeout(() => cb(null), 50);
            }
            return () => {
                const idx = observers.indexOf(cb);
                if (idx > -1) observers.splice(idx, 1);
            };
        },
        // We keep the method name 'signInWithEmailAndPassword' to match Firebase interface,
        // but we treat the first argument 'email' as the 'ID' (username).
        signInWithEmailAndPassword: async (loginId: string) => {
            // Check if this user exists in our "mock database" (localStorage)
            const users = JSON.parse(
                localStorage.getItem("mock_firestore_users") || "[]",
            );
            const existingUser = users.find((u: any) => u.id === loginId);

            // Determine Role
            const isAdmin = loginId.toLowerCase().includes("admin");
            // const role = isAdmin ? 'Admin' : 'Member'; // Unused

            if (existingUser) {
                // User exists, login success
                const user = {
                    uid: existingUser.id,
                    displayName: existingUser.name,
                    role: existingUser.role,
                };
                localStorage.setItem("mock_user", JSON.stringify(user));
                auth.currentUser = user;
                notifyObservers(user);
                return { user };
            } else {
                // In a real app, this should fail. For this mock, we'll auto-register
                // IF it looks like an admin for convenience, OR require registration.
                // Let's require registration for normal flow, but allow admin auto-login for demo.
                if (isAdmin) {
                    const user = {
                        uid: loginId,
                        displayName: "Admin User",
                        role: "Admin",
                    };
                    localStorage.setItem("mock_user", JSON.stringify(user));
                    syncUserToFirestore(user);
                    auth.currentUser = user;
                    notifyObservers(user);
                    return { user };
                }

                // Throw error to force registration
                const error: any = new Error("User not found");
                error.code = "auth/user-not-found";
                throw error;
            }
        },
        // Treat 'email' argument as 'loginId'
        createUserWithEmailAndPassword: async (loginId: string) => {
            // Check duplication
            const users = JSON.parse(
                localStorage.getItem("mock_firestore_users") || "[]",
            );
            if (users.find((u: any) => u.id === loginId)) {
                const error: any = new Error("ID already in use");
                error.code = "auth/email-already-in-use";
                throw error;
            }

            const uid = loginId; // ID is the UID
            const isAdmin = loginId.toLowerCase().includes("admin");
            const role = isAdmin ? "Admin" : "Member";

            const user = { uid, displayName: loginId, role };

            localStorage.setItem("mock_user", JSON.stringify(user));
            syncUserToFirestore(user);

            auth.currentUser = user;
            notifyObservers(user);
            return { user };
        },
        signOut: async () => {
            localStorage.removeItem("mock_user");
            auth.currentUser = null;
            notifyObservers(null);
        },
    };

    // --- MOCK FIRESTORE ---
    const getStore = (col: string) =>
        JSON.parse(localStorage.getItem(`mock_firestore_${col}`) || "[]");
    const setStore = (col: string, data: any[]) =>
        localStorage.setItem(`mock_firestore_${col}`, JSON.stringify(data));

    db = {
        collection: (name: string) => {
            const mockChain = {
                orderBy: () => mockChain,
                limit: () => mockChain,
                where: () => mockChain,
                get: async () => {
                    const docs = getStore(name);
                    return {
                        docs: docs.map((d: any) => ({
                            id: d.id,
                            data: () => d,
                            exists: true,
                        })),
                        empty: docs.length === 0,
                    };
                },
                add: async (data: any) => {
                    const docs = getStore(name);
                    const id = Math.random().toString(36).substr(2, 9);
                    const newDoc = { id, ...data };
                    docs.push(newDoc);
                    setStore(name, docs);
                    return { id, ...mockChain };
                },
                doc: (docId: string) => ({
                    get: async () => {
                        const docs = getStore(name);
                        const doc = docs.find((d: any) => d.id === docId);
                        return {
                            exists: !!doc,
                            data: () => doc,
                            id: docId,
                        };
                    },
                    set: async (data: any) => {
                        const docs = getStore(name);
                        const idx = docs.findIndex((d: any) => d.id === docId);
                        if (idx >= 0) docs[idx] = { id: docId, ...data };
                        else docs.push({ id: docId, ...data });
                        setStore(name, docs);
                    },
                    update: async (data: any) => {
                        const docs = getStore(name);
                        const idx = docs.findIndex((d: any) => d.id === docId);
                        if (idx >= 0) {
                            docs[idx] = { ...docs[idx], ...data };
                            setStore(name, docs);
                        }
                    },
                    delete: async () => {
                        const docs = getStore(name);
                        const newDocs = docs.filter((d: any) => d.id !== docId);
                        setStore(name, newDocs);
                    },
                }),
            };
            return mockChain;
        },
    };

    app = { auth: () => auth, firestore: () => db };
}

export { auth, db };
export default app;
