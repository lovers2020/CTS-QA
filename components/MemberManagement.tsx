import React, { useState } from "react";
import { User } from "../types";
import { Trash2, Shield, User as UserIcon, ShieldCheck } from "lucide-react";

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
    const handleDelete = (userId: string) => {
        if (userId === currentUser.id) {
            alert("자신의 계정은 삭제할 수 없습니다.");
            return;
        }
        if (confirm("이 사용자를 정말 삭제하시겠습니까?")) {
            onDeleteUser(userId);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">구성원</h2>
            </div>

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
