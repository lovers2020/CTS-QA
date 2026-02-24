import React, { useState } from "react";
import { User } from "../types";
import {
    Trash2,
    Shield,
    User as UserIcon,
    ShieldCheck,
    Plus,
    Check,
} from "lucide-react";

interface MemberManagementProps {
    currentUser: User;
    users: User[];
    onAddUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
}

const MemberManagement: React.FC<MemberManagementProps> = ({
    currentUser,
    users,
    onAddUser,
    onDeleteUser,
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newUser, setNewUser] = useState({
        id: "",
        name: "",
        password: "",
        role: "Member" as "Admin" | "Member",
    });

    const handleDelete = (userId: string) => {
        if (userId === currentUser.id) {
            alert("자신의 계정은 삭제할 수 없습니다.");
            return;
        }
        if (confirm("이 사용자를 정말 삭제하시겠습니까?")) {
            onDeleteUser(userId);
        }
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.id || !newUser.name || !newUser.password) {
            alert("모든 필드를 입력해주세요.");
            return;
        }

        // Simple ID validation
        if (users.some((u) => u.id === newUser.id)) {
            alert("이미 존재하는 아이디입니다.");
            return;
        }

        onAddUser({
            id: newUser.id,
            name: newUser.name,
            role: newUser.role,
            password: newUser.password,
        });

        setIsAdding(false);
        setNewUser({ id: "", name: "", password: "", role: "Member" });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">
                    구성원 관리
                </h2>
                {currentUser.role === "Admin" && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        <span>구성원 추가</span>
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 mb-6 animate-fade-in-down">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        새 구성원 추가
                    </h3>
                    <form
                        onSubmit={handleAddSubmit}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                아이디 (이메일)
                            </label>
                            <input
                                type="text"
                                value={newUser.id}
                                onChange={(e) =>
                                    setNewUser({
                                        ...newUser,
                                        id: e.target.value,
                                    })
                                }
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="user@teamsync.app"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                이름
                            </label>
                            <input
                                type="text"
                                value={newUser.name}
                                onChange={(e) =>
                                    setNewUser({
                                        ...newUser,
                                        name: e.target.value,
                                    })
                                }
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="홍길동"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                비밀번호
                            </label>
                            <input
                                type="password"
                                value={newUser.password}
                                onChange={(e) =>
                                    setNewUser({
                                        ...newUser,
                                        password: e.target.value,
                                    })
                                }
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="******"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                권한
                            </label>
                            <select
                                value={newUser.role}
                                onChange={(e) =>
                                    setNewUser({
                                        ...newUser,
                                        role: e.target.value as
                                            | "Admin"
                                            | "Member",
                                    })
                                }
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="Member">Member</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                            >
                                <Check size={16} />
                                <span>추가하기</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                이름 / 아이디
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                권한
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                관리
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((user) => (
                            <tr
                                key={user.id}
                                className="hover:bg-slate-50 transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mr-3">
                                            {user.role === "Admin" ? (
                                                <ShieldCheck
                                                    size={20}
                                                    className="text-blue-600"
                                                />
                                            ) : (
                                                <UserIcon size={20} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">
                                                {user.name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                @{user.id}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            user.role === "Admin"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-slate-100 text-slate-800"
                                        }`}
                                    >
                                        {user.role === "Admin" && (
                                            <Shield
                                                size={12}
                                                className="mr-1"
                                            />
                                        )}
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {currentUser.role === "Admin" &&
                                        user.id !== currentUser.id && (
                                            <button
                                                onClick={() =>
                                                    handleDelete(user.id)
                                                }
                                                className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                                                title="삭제"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MemberManagement;
