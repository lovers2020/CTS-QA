import React from "react";
import {
    LayoutDashboard,
    Calendar,
    BookOpen,
    LogOut,
    Hexagon,
    Users,
    UserCircle,
} from "lucide-react";
import { User } from "../types";

interface SidebarProps {
    user: User;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    user,
    activeTab,
    setActiveTab,
    onLogout,
}) => {
    const menuItems = [
        { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
        { id: "schedule", label: "일정 / 연차", icon: Calendar },
        { id: "workspace", label: "워크스페이스", icon: BookOpen },
        { id: "mypage", label: "마이페이지", icon: UserCircle },
        { id: "members", label: "멤버", icon: Users },
    ];

    return (
        <div className="w-64 bg-slate-900 text-white flex flex-col h-full shadow-xl">
            <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
                <Hexagon className="text-blue-500 w-8 h-8" strokeWidth={2.5} />
                <span className="text-xl font-bold tracking-tight">
                    TeamSync
                </span>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                                isActive
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center space-x-3 px-4 py-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                        {user.name[0]}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-slate-200 truncate">
                            {user.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                            {user.role}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="flex items-center space-x-3 px-4 py-2 w-full text-slate-400 hover:text-red-400 transition-colors text-sm"
                >
                    <LogOut size={16} />
                    <span>로그아웃</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
