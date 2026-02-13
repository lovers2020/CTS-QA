import React, { useState } from "react";
import { User } from "../types";
import {
    Hexagon,
    Lock,
    User as UserIcon,
    ArrowRight,
    UserPlus,
    CheckCircle,
    Hash,
} from "lucide-react";
import { auth, db } from "../firebase";

interface LoginProps {
    users?: User[];
    onLogin: (user: User) => void;
    onRegister: (user: User) => void;
}

// Pseudo-domain for mapping IDs to Firebase Email Auth
const ID_SUFFIX = "@teamsync.app";

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError("");
    };

    const getEmailFromId = (id: string) => `${id}${ID_SUFFIX}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const email = getEmailFromId(formData.id);

            if (isLoginMode) {
                // Login Logic
                await auth.signInWithEmailAndPassword(email, formData.password);
                // App.tsx handles state update via observer
            } else {
                // Registration Logic
                if (formData.password !== formData.confirmPassword) {
                    setError("비밀번호가 일치하지 않습니다.");
                    setIsLoading(false);
                    return;
                }
                if (formData.password.length < 6) {
                    setError("비밀번호는 6자 이상이어야 합니다.");
                    setIsLoading(false);
                    return;
                }

                // Create User in Auth
                const userCredential =
                    await auth.createUserWithEmailAndPassword(
                        email,
                        formData.password,
                    );
                const firebaseUser = userCredential.user;

                if (firebaseUser) {
                    // Update Profile
                    await firebaseUser.updateProfile({
                        displayName: formData.name,
                    });

                    const newUser: User = {
                        id: firebaseUser.uid,
                        name: formData.name,
                        role: "Member",
                    };

                    // Save user data to Firestore
                    await db
                        .collection("users")
                        .doc(firebaseUser.uid)
                        .set(newUser);

                    onRegister(newUser);
                }
            }
        } catch (err: any) {
            console.error(err);
            if (
                err.code === "auth/invalid-credential" ||
                err.code === "auth/user-not-found" ||
                err.code === "auth/wrong-password" ||
                err.code === "auth/invalid-email"
            ) {
                setError("아이디 또는 비밀번호가 올바르지 않습니다.");
            } else if (err.code === "auth/email-already-in-use") {
                setError("이미 사용 중인 아이디입니다.");
            } else if (err.code === "auth/weak-password") {
                setError("비밀번호가 너무 약합니다 (6자 이상).");
            } else {
                setError("오류가 발생했습니다: " + err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setError("");
        setFormData({ id: "", name: "", password: "", confirmPassword: "" });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 animate-scale-in">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-blue-50 p-3 rounded-full mb-4">
                        <Hexagon
                            className="text-blue-600 w-10 h-10"
                            strokeWidth={2.5}
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                        TeamSync
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {isLoginMode
                            ? "팀 워크스페이스에 로그인하세요"
                            : "새 계정 만들기"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLoginMode && (
                        <div className="animate-fade-in-down">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                이름
                            </label>
                            <div className="relative">
                                <UserIcon
                                    className="absolute left-3 top-3 text-slate-400"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 pl-10 border transition-all"
                                    placeholder="이름 (예: 홍길동)"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            아이디
                        </label>
                        <div className="relative">
                            <Hash
                                className="absolute left-3 top-3 text-slate-400"
                                size={18}
                            />
                            <input
                                type="text"
                                name="id"
                                required
                                className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 pl-10 border transition-all"
                                placeholder="아이디 입력"
                                value={formData.id}
                                onChange={handleChange}
                                autoCapitalize="none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            비밀번호
                        </label>
                        <div className="relative">
                            <Lock
                                className="absolute left-3 top-3 text-slate-400"
                                size={18}
                            />
                            <input
                                type="password"
                                name="password"
                                required
                                className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 pl-10 border transition-all"
                                placeholder="비밀번호 (6자 이상)"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {!isLoginMode && (
                        <div className="animate-fade-in-down">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                비밀번호 확인
                            </label>
                            <div className="relative">
                                <CheckCircle
                                    className="absolute left-3 top-3 text-slate-400"
                                    size={18}
                                />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    required
                                    className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 pl-10 border transition-all"
                                    placeholder="비밀번호를 다시 입력하세요"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg animate-pulse">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-md transition-colors flex items-center justify-center gap-2 mt-2 ${isLoading ? "opacity-70 cursor-wait" : ""}`}
                    >
                        {isLoading ? (
                            "처리 중..."
                        ) : isLoginMode ? (
                            <>
                                <span>로그인</span>
                                <ArrowRight size={18} />
                            </>
                        ) : (
                            <>
                                <span>가입하기</span>
                                <UserPlus size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-500 mb-4">
                        {isLoginMode
                            ? "아직 계정이 없으신가요?"
                            : "이미 계정이 있으신가요?"}
                    </p>
                    <button
                        onClick={toggleMode}
                        className="text-blue-600 font-semibold hover:text-blue-800 hover:underline transition-colors"
                    >
                        {isLoginMode ? "회원가입 하러가기" : "로그인 하러가기"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
