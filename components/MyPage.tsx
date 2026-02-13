import React, { useState, useEffect } from "react";
import { User } from "../types";
import {
    User as UserIcon,
    Shield,
    Hash,
    Save,
    Check,
    Lock,
    AlertCircle,
} from "lucide-react";
import { auth } from "../firebase";

interface MyPageProps {
    user: User;
    onUpdateProfile: (updatedData: Partial<User>) => Promise<void>;
}

const ID_SUFFIX = "@teamsync.app";

const MyPage: React.FC<MyPageProps> = ({ user, onUpdateProfile }) => {
    const [formData, setFormData] = useState({
        name: user.name,
        password: "",
        confirmPassword: "",
    });

    const [displayId, setDisplayId] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{
        text: string;
        type: "success" | "error";
    } | null>(null);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            name: user.name,
        }));
        if (auth.currentUser?.email) {
            // Extract ID from pseudo-email
            setDisplayId(auth.currentUser.email.replace(ID_SUFFIX, ""));
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setMessage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        if (
            formData.password &&
            formData.password !== formData.confirmPassword
        ) {
            setMessage({
                text: "새 비밀번호가 일치하지 않습니다.",
                type: "error",
            });
            setIsSaving(false);
            return;
        }

        if (formData.password && formData.password.length < 6) {
            setMessage({
                text: "비밀번호는 6자 이상이어야 합니다.",
                type: "error",
            });
            setIsSaving(false);
            return;
        }

        try {
            const updatePayload: Partial<User> = {
                name: formData.name,
            };

            // 1. Update Firestore
            await onUpdateProfile(updatePayload);

            // 2. Update Firebase Auth Profile
            if (
                auth.currentUser &&
                formData.name !== auth.currentUser.displayName
            ) {
                await auth.currentUser.updateProfile({
                    displayName: formData.name,
                });
            }

            // 3. Update Password
            if (formData.password && auth.currentUser) {
                await auth.currentUser.updatePassword(formData.password);
            }

            setMessage({
                text: "프로필이 성공적으로 업데이트되었습니다.",
                type: "success",
            });
            setFormData((prev) => ({
                ...prev,
                password: "",
                confirmPassword: "",
            }));

            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            console.error(error);
            if (error.code === "auth/requires-recent-login") {
                setMessage({
                    text: "보안을 위해 다시 로그인한 후 비밀번호를 변경해주세요.",
                    type: "error",
                });
            } else {
                setMessage({
                    text: error.message || "업데이트 중 오류가 발생했습니다.",
                    type: "error",
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges =
        formData.name !== user.name || formData.password.length > 0;

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-slate-800">
                    마이페이지
                </h2>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Profile Header */}
                <div className="bg-slate-50 p-8 border-b border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-200">
                        <span className="text-3xl font-bold text-slate-700">
                            {formData.name[0]}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">
                        {formData.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium flex items-center gap-1">
                            <Shield size={12} /> {user.role}
                        </span>
                        <span className="text-slate-400">@{displayId}</span>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                아이디 (변경 불가)
                            </label>
                            <div className="relative">
                                <Hash
                                    className="absolute left-3 top-3 text-slate-400"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    value={displayId}
                                    disabled
                                    className="w-full bg-slate-50 border-slate-200 rounded-lg shadow-sm p-2.5 pl-10 border text-slate-500 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
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
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 pl-10 border transition-all"
                                    placeholder="이름을 입력하세요"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50">
                            <h4 className="text-sm font-medium text-slate-900 mb-4 flex items-center gap-2">
                                <Lock size={16} className="text-slate-400" />
                                비밀번호 변경
                            </h4>

                            <div className="space-y-4">
                                <div>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border transition-all"
                                        placeholder="새 비밀번호 (6자 이상, 변경 시에만 입력)"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border transition-all"
                                        placeholder="새 비밀번호 확인"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                            <div className="flex-1">
                                {message && (
                                    <div
                                        className={`text-sm flex items-center gap-2 ${message.type === "success" ? "text-emerald-600" : "text-red-500"}`}
                                    >
                                        {message.type === "success" ? (
                                            <Check size={16} />
                                        ) : (
                                            <AlertCircle size={16} />
                                        )}
                                        {message.text}
                                    </div>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={isSaving || !hasChanges}
                                className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm ${
                                    isSaving || !hasChanges
                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                            >
                                <Save size={18} />
                                <span>
                                    {isSaving ? "저장 중..." : "변경사항 저장"}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MyPage;
