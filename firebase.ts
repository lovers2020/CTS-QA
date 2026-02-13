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

// Initialize Firebase
// Note: For deployment, ensure all VITE_FIREBASE_* variables are set in your build environment.
const firebaseConfig = {
    apiKey: apiKey,
    authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: getEnv("VITE_FIREBASE_APP_ID"),
};

let app;
if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
} else {
    app = firebase.app();
}

const auth = app.auth();
const db = app.firestore();

export { auth, db };
export default app;
