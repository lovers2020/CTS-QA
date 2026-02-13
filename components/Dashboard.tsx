import React, { useEffect, useState } from "react";
import {
    User,
    ScheduleEvent,
    ScheduleType,
    Doc,
    Task,
    Activity,
} from "../types";
import {
    Clock,
    CheckCircle2,
    Circle,
    FileText,
    CalendarPlus,
    Video,
    Home,
    Briefcase,
    Plus,
    Bell,
    ArrowRight,
    Sun,
    Plane,
    Users,
    Trash2,
    Cloud,
    CloudRain,
    CloudSnow,
    CloudLightning,
    CloudFog,
    CloudSun,
} from "lucide-react";

interface DashboardProps {
    user: User;
    users: User[];
    schedules: ScheduleEvent[];
    docs: Doc[];
    tasks: Task[];
    activities: Activity[];
    onToggleTask: (id: string) => void;
    onAddTask: (title: string, priority: "High" | "Medium" | "Low") => void;
    onDeleteTask: (id: string) => void;
    onQuickAction: (action: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
    user,
    users,
    schedules,
    docs,
    tasks,
    activities,
    onToggleTask,
    onAddTask,
    onDeleteTask,
    onQuickAction,
}) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [newTaskInput, setNewTaskInput] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState<
        "High" | "Medium" | "Low"
    >("Medium");

    // Weather State
    const [weather, setWeather] = useState<{
        temp: number;
        code: number;
        text: string;
    } | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Weather for Suwon (Lat: 37.2636, Lon: 127.0286)
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Using 'current' parameter for more accurate real-time data and explicit timezone
                const res = await fetch(
                    "https://api.open-meteo.com/v1/forecast?latitude=37.2636&longitude=127.0286&current=temperature_2m,weather_code&timezone=Asia%2FSeoul",
                );
                const data = await res.json();

                if (!data.current) return;

                const { temperature_2m, weather_code } = data.current;

                // WMO Weather interpretation
                let text = "맑음";
                if (weather_code >= 1 && weather_code <= 3) text = "구름 조금";
                else if (weather_code >= 45 && weather_code <= 48)
                    text = "안개";
                else if (weather_code >= 51 && weather_code <= 67) text = "비";
                else if (weather_code >= 71 && weather_code <= 77) text = "눈";
                else if (weather_code >= 80 && weather_code <= 82)
                    text = "소나기";
                else if (weather_code >= 85 && weather_code <= 86) text = "눈";
                else if (weather_code >= 95) text = "뇌우";

                setWeather({
                    temp: temperature_2m,
                    code: weather_code,
                    text,
                });
            } catch (error) {
                console.error("Failed to fetch weather", error);
            }
        };
        fetchWeather();
    }, []);

    const getWeatherIcon = (code: number) => {
        if (code === 0)
            return <Sun size={14} className="text-orange-400 mr-2" />;
        if (code >= 1 && code <= 3)
            return <CloudSun size={14} className="text-slate-400 mr-2" />;
        if (code >= 45 && code <= 48)
            return <CloudFog size={14} className="text-slate-400 mr-2" />;
        if (code >= 51 && code <= 67)
            return <CloudRain size={14} className="text-blue-400 mr-2" />;
        if (code >= 71 && code <= 77)
            return <CloudSnow size={14} className="text-sky-300 mr-2" />;
        if (code >= 80 && code <= 82)
            return <CloudRain size={14} className="text-blue-500 mr-2" />;
        if (code >= 85 && code <= 86)
            return <CloudSnow size={14} className="text-sky-300 mr-2" />;
        if (code >= 95)
            return (
                <CloudLightning size={14} className="text-yellow-500 mr-2" />
            );
        return <Sun size={14} className="text-orange-400 mr-2" />;
    };

    const handleTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskInput.trim()) return;
        onAddTask(newTaskInput, newTaskPriority);
        setNewTaskInput("");
        setNewTaskPriority("Medium");
    };

    const handleDeleteTaskInternal = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("이 할 일을 삭제하시겠습니까?")) {
            onDeleteTask(taskId);
        }
    };

    // Filter data for Personal Area
    const todayStr = new Date().toISOString().split("T")[0];
    const myTodaySchedules = schedules
        .filter(
            (s) =>
                s.userId === user.id &&
                s.startDate <= todayStr &&
                s.endDate >= todayStr,
        )
        .sort((a, b) =>
            (a.startTime || "00:00").localeCompare(b.startTime || "00:00"),
        );

    const recentDocs = [...docs]
        .filter((d) => d.authorId === user.id || d.category === "Team")
        .sort(
            (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
        )
        .slice(0, 3);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">
                        안녕하세요, {user.name}님! 👋
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        오늘도 힘찬 하루 되세요. 현재 시각은{" "}
                        {currentTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                        입니다.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center">
                        {weather ? (
                            <>
                                {getWeatherIcon(weather.code)}
                                수원: {weather.text} {weather.temp}°C
                            </>
                        ) : (
                            <>
                                <Sun
                                    size={14}
                                    className="text-slate-300 mr-2 animate-pulse"
                                />
                                날씨 불러오는 중...
                            </>
                        )}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN: Personal Work Focus (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 1. Today's Agenda (Timeline) */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Clock size={20} className="text-blue-600" />
                                오늘의 일정
                            </h3>
                            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                {todayStr}
                            </span>
                        </div>

                        <div className="relative pl-4 border-l-2 border-slate-100 space-y-8 ml-2">
                            {myTodaySchedules.length > 0 ? (
                                myTodaySchedules.map((schedule, idx) => (
                                    <div key={idx} className="relative">
                                        {/* Dot */}
                                        <div
                                            className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                                                schedule.type ===
                                                ScheduleType.MEETING
                                                    ? "bg-blue-500"
                                                    : "bg-slate-300"
                                            } shadow-sm`}
                                        ></div>

                                        {/* Content */}
                                        <div className="flex items-start justify-between group">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono text-sm font-semibold text-slate-600">
                                                        {schedule.startTime ||
                                                            "All Day"}
                                                        {schedule.endTime
                                                            ? ` - ${schedule.endTime}`
                                                            : ""}
                                                    </span>
                                                    {schedule.type ===
                                                        ScheduleType.MEETING && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-500 rounded font-medium border border-red-100">
                                                            Meeting
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="font-semibold text-slate-800 text-lg leading-tight mb-1">
                                                    {schedule.title}
                                                </h4>
                                                <p className="text-sm text-slate-500">
                                                    {schedule.description ||
                                                        "상세 내용 없음"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-slate-400 text-sm py-4">
                                    오늘 예정된 일정이 없습니다.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 2. My Tasks */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <CheckCircle2
                                        size={20}
                                        className="text-emerald-600"
                                    />
                                    나의 할 일
                                </h3>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                    {tasks.filter((t) => !t.completed).length}건
                                    남음
                                </span>
                            </div>
                            <div className="flex-1 space-y-3 mb-4">
                                {tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => onToggleTask(task.id)}
                                        className={`group flex items-start space-x-3 p-3 rounded-xl transition-all cursor-pointer border ${
                                            task.completed
                                                ? "bg-slate-50 border-slate-100 opacity-60"
                                                : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
                                        }`}
                                    >
                                        <div
                                            className={`mt-0.5 ${task.completed ? "text-slate-400" : "text-slate-300"}`}
                                        >
                                            {task.completed ? (
                                                <CheckCircle2
                                                    size={20}
                                                    className="text-emerald-500"
                                                />
                                            ) : (
                                                <Circle size={20} />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p
                                                    className={`text-sm font-medium ${task.completed ? "text-slate-500 line-through" : "text-slate-800"}`}
                                                >
                                                    {task.title}
                                                </p>
                                                <button
                                                    onClick={(e) =>
                                                        handleDeleteTaskInternal(
                                                            task.id,
                                                            e,
                                                        )
                                                    }
                                                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-0.5 rounded"
                                                    title="삭제"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span
                                                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                                        task.priority === "High"
                                                            ? "bg-red-50 text-red-600"
                                                            : task.priority ===
                                                                "Medium"
                                                              ? "bg-orange-50 text-orange-600"
                                                              : "bg-slate-100 text-slate-500"
                                                    }`}
                                                >
                                                    {task.priority}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {task.dueDate}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <form
                                onSubmit={handleTaskSubmit}
                                className="mt-auto pt-3 border-t border-slate-50"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={newTaskInput}
                                            onChange={(e) =>
                                                setNewTaskInput(e.target.value)
                                            }
                                            className="w-full text-sm bg-slate-50 border-transparent rounded-lg focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-100 transition-all pl-3 pr-2 py-2 placeholder-slate-400"
                                            placeholder="새로운 할 일 입력..."
                                        />
                                    </div>
                                    <select
                                        value={newTaskPriority}
                                        onChange={(e) =>
                                            setNewTaskPriority(
                                                e.target.value as any,
                                            )
                                        }
                                        className="text-sm bg-slate-50 border-transparent rounded-lg focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-100 py-2 px-2 text-slate-600"
                                    >
                                        <option value="High">높음</option>
                                        <option value="Medium">중간</option>
                                        <option value="Low">낮음</option>
                                    </select>
                                    <button
                                        type="submit"
                                        className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* 3. Recent Docs */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <FileText
                                        size={20}
                                        className="text-indigo-600"
                                    />
                                    최근 본 문서
                                </h3>
                            </div>
                            <div className="flex-1 space-y-3">
                                {recentDocs.map((doc) => (
                                    <button
                                        key={doc.id}
                                        onClick={() => onQuickAction("doc")}
                                        className="w-full text-left p-3 rounded-xl border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-all group"
                                    >
                                        <div className="flex items-center space-x-3 mb-1">
                                            <span className="text-xl">
                                                {doc.emoji}
                                            </span>
                                            <span className="font-medium text-slate-700 group-hover:text-indigo-700 truncate flex-1">
                                                {doc.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-slate-400 pl-1">
                                            <span>
                                                {new Date(
                                                    doc.updatedAt,
                                                ).toLocaleDateString()}{" "}
                                                수정됨
                                            </span>
                                            <ArrowRight
                                                size={12}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400"
                                            />
                                        </div>
                                    </button>
                                ))}
                                {recentDocs.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        최근 문서가 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Team & Utility (1/3 width) */}
                <div className="space-y-6">
                    {/* 4. Quick Actions */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
                        <h3 className="font-bold text-slate-100 mb-4 text-sm uppercase tracking-wider">
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => onQuickAction("schedule")}
                                className="flex flex-col items-center justify-center p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/5"
                            >
                                <CalendarPlus
                                    size={24}
                                    className="mb-2 text-blue-300"
                                />
                                <span className="text-xs font-medium">
                                    일정 추가
                                </span>
                            </button>
                            <button
                                onClick={() => onQuickAction("doc")}
                                className="flex flex-col items-center justify-center p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/5"
                            >
                                <Plus
                                    size={24}
                                    className="mb-2 text-emerald-300"
                                />
                                <span className="text-xs font-medium">
                                    새 문서
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* 5. Update Feed (Activity Log) - Renumbered conceptually */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Bell size={18} className="text-slate-600" />
                                업데이트 피드
                            </h3>
                        </div>
                        <div className="space-y-4 relative pl-2">
                            <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-100"></div>
                            {activities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="relative pl-6"
                                >
                                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                    </div>
                                    <p className="text-xs text-slate-600">
                                        <span className="font-bold text-slate-800">
                                            {activity.user}
                                        </span>
                                        님이
                                        <br />
                                        <span className="font-medium text-blue-600 truncate block my-0.5">
                                            {activity.target}
                                        </span>
                                        {activity.action}했습니다.
                                    </p>
                                    <span className="text-[10px] text-slate-400">
                                        {activity.time}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
