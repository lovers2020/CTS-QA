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
    CalendarPlus,
    Plus,
    Bell,
    Sun,
    Trash2,
    CloudRain,
    CloudSnow,
    CloudLightning,
    CloudFog,
    CloudSun,
} from "lucide-react";
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    DragStartEvent,
    DragEndEvent,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
} from "@dnd-kit/core";

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
    onUpdateTaskStatus: (
        id: string,
        status: "Todo" | "In Progress" | "Done",
    ) => void;
    onQuickAction: (action: string) => void;
    onClearActivities: () => void;
}

// Helper to format date
const formatDueDate = (dateString?: string) => {
    if (!dateString) return "";
    if (dateString === '오늘') return '오늘';
    
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    
    // Construct today's string in YYYY-MM-DD
    const todayFormatted = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    // Compare strings directly
    if (dateString === todayFormatted) return "오늘";
    
    // Also try comparing without leading zeros just in case (e.g. 2026-2-5)
    const todaySimple = `${y}-${m}-${d}`;
    if (dateString === todaySimple) return "오늘";

    return dateString;
};

// Draggable Task Card Component
const DraggableTask = ({
    task,
    onDelete,
}: {
    task: Task;
    onDelete: (e: React.MouseEvent) => void;
}) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: task.id,
        data: { task },
    });

    const isDone = task.status === 'Done';

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                className="bg-slate-50 p-3 rounded-lg border-2 border-dashed border-slate-200 opacity-50 h-[100px]"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`p-3 rounded-lg shadow-md border hover:shadow-md transition-all group relative cursor-grab active:cursor-grabbing touch-none ${
                isDone ? "bg-slate-50 border-slate-200" : "bg-white border-slate-100"
            }`}
        >
            <div className="flex justify-between items-start mb-2">
                <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        task.priority === "High"
                            ? "bg-red-50 text-red-600"
                            : task.priority === "Medium"
                              ? "bg-orange-50 text-orange-600"
                              : "bg-slate-100 text-slate-500"
                    }`}
                >
                    {task.priority}
                </span>
                <button
                    onClick={onDelete}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    title="삭제"
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on delete button
                >
                    <Trash2 size={1} />
                </button>
            </div>
            <p className={`text-sm font-medium mb-2 ${isDone ? "text-slate-400 line-through" : "text-slate-800"}`}>
                {task.title}
            </p>

            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
                <span className="text-[11px] text-slate-500 ml-auto mr-auto">
                    {formatDueDate(task.dueDate)}
                </span>
            </div>
        </div>
    );
};

// Task Card for Overlay (Pure visual)
const TaskCardOverlay = ({ task }: { task: Task }) => {
    const isDone = task.status === 'Done';
    return (
        <div className={`p-3 rounded-lg shadow-lg border border-blue-200 rotate-3 cursor-grabbing w-full ${isDone ? "bg-slate-50" : "bg-white"}`}>
            <div className="flex justify-between items-start mb-2">
                <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        task.priority === "High"
                            ? "bg-red-50 text-red-600"
                            : task.priority === "Medium"
                              ? "bg-orange-50 text-orange-600"
                              : "bg-slate-100 text-slate-500"
                    }`}
                >
                    {task.priority}
                </span>
            </div>
            <p className={`text-sm font-medium mb-2 ${isDone ? "text-slate-400 line-through" : "text-slate-800"}`}>
                {task.title}
            </p>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                <span className="text-[10px] text-slate-400 ml-auto mr-auto">
                    {formatDueDate(task.dueDate)}
                </span>
            </div>
        </div>
    );
};

// Droppable Column Component
const DroppableColumn = ({
    status,
    title,
    icon,
    colorClass,
    tasks,
    onDeleteTask,
}: {
    status: "Todo" | "In Progress" | "Done";
    title: string;
    icon: React.ReactNode;
    colorClass: string;
    tasks: Task[];
    onDeleteTask: (id: string, e: React.MouseEvent) => void;
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: status,
    });

    return (
        // 나의 할 일 부분 
        <div
            ref={setNodeRef}
            className={`flex-1 bg-slate-50 rounded-xl p-3 flex flex-col h-full min-h-[500px] max-h-[800px] transition-colors ${isOver ? "bg-blue-50 ring-2 ring-blue-100" : ""}`}
        >
            <div
                className={`flex items-center justify-between mb-3 pb-2 border-b border-slate-200 ${colorClass}`}
            >
                <h4 className="font-semibold text-sm flex items-center gap-2">
                    {icon}
                    {title}
                </h4>
                <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-full shadow-sm">
                    {tasks.length}
                </span>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-1">
                {tasks.map((task) => (
                    <DraggableTask
                        key={task.id}
                        task={task}
                        onDelete={(e) => onDeleteTask(task.id, e)}
                    />
                ))}
                {tasks.length === 0 && (
                    <div className="text-center py-8 text-slate-300 text-xs border-2 border-dashed border-slate-200 rounded-lg">
                        여기로 드래그하세요
                    </div>
                )}
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({
    user,
    users: _users,
    schedules,
    docs: _docs,
    tasks,
    activities,
    onToggleTask: _onToggleTask,
    onAddTask,
    onDeleteTask,
    onUpdateTaskStatus,
    onQuickAction,
    onClearActivities,
}) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [newTaskInput, setNewTaskInput] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState<
        "High" | "Medium" | "Low"
    >("Medium");
    const [activeId, setActiveId] = useState<string | null>(null);

    // Sensors for Drag and Drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts (prevents accidental clicks)
            },
        }),
        useSensor(TouchSensor),
    );

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

    // Drag and Drop Handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            // Check if dropped on a column
            const status = over.id as "Todo" | "In Progress" | "Done";
            // Check if status is valid (simple validation)
            if (["Todo", "In Progress", "Done"].includes(status)) {
                onUpdateTaskStatus(active.id as string, status);
            }
        }
        setActiveId(null);
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

    const getRelativeTime = (dateString?: string) => {
        if (!dateString) return "방금 전";
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor(
            (now.getTime() - date.getTime()) / 1000,
        );

        if (diffInSeconds < 60) return "방금 전";
        if (diffInSeconds < 3600)
            return `${Math.floor(diffInSeconds / 60)}분 전`;
        if (diffInSeconds < 86400)
            return `${Math.floor(diffInSeconds / 3600)}시간 전`;
        return `${Math.floor(diffInSeconds / 86400)}일 전`;
    };

    const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
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
                                    <Clock
                                        size={20}
                                        className="text-blue-600"
                                    />
                                    오늘의 일정
                                </h3>
                                <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">
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
                                    <div className="text-slate-500 text-sm py-4">
                                        오늘 예정된 일정이 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Kanban Board */}
                        <div className="bg-white rounded-2xl  p-6 shadow-sm border border-slate-100 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <CheckCircle2
                                        size={20}
                                        className="text-emerald-600"
                                    />
                                    나의 할 일
                                </h3>

                                {/* Simple Add Task Form Inline */}
                                <form
                                    onSubmit={handleTaskSubmit}
                                    className="flex items-center gap-2"
                                >
                                    <select
                                        value={newTaskPriority}
                                        onChange={(e) =>
                                            setNewTaskPriority(
                                                e.target.value as any,
                                            )
                                        }
                                        className="text-xs bg-slate-50 border-transparent rounded-lg focus:bg-white focus:border-blue-200 focus:ring-1 focus:ring-blue-100 py-1.5 px-2 text-slate-600"
                                    >
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={newTaskInput}
                                        onChange={(e) =>
                                            setNewTaskInput(e.target.value)
                                        }
                                        className="w-48 text-xs bg-slate-50 border-transparent rounded-lg focus:bg-white focus:border-blue-200 focus:ring-1 focus:ring-blue-100 transition-all px-3 py-1.5 placeholder-slate-500"
                                        placeholder="새 할 일..."
                                    />
                                    <button
                                        type="submit"
                                        className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </form>
                            </div>

                            <div className="flex gap-4 overflow-x-auto pb-2">
                                <DroppableColumn
                                    status="Todo"
                                    title="할 일"
                                    icon={
                                        <Circle
                                            size={14}
                                            className="text-slate-400"
                                        />
                                    }
                                    colorClass="text-slate-600"
                                    tasks={tasks.filter(
                                        (t) =>
                                            (t.status ||
                                                (t.completed
                                                    ? "Done"
                                                    : "Todo")) === "Todo",
                                    )}
                                    onDeleteTask={handleDeleteTaskInternal}
                                />
                                <DroppableColumn
                                    status="In Progress"
                                    title="진행 중"
                                    icon={
                                        <Clock
                                            size={14}
                                            className="text-blue-500"
                                        />
                                    }
                                    colorClass="text-blue-600"
                                    tasks={tasks.filter(
                                        (t) =>
                                            (t.status ||
                                                (t.completed
                                                    ? "Done"
                                                    : "Todo")) ===
                                            "In Progress",
                                    )}
                                    onDeleteTask={handleDeleteTaskInternal}
                                />
                                <DroppableColumn
                                    status="Done"
                                    title="완료"
                                    icon={
                                        <CheckCircle2
                                            size={14}
                                            className="text-emerald-500"
                                        />
                                    }
                                    colorClass="text-emerald-600"
                                    tasks={tasks.filter(
                                        (t) =>
                                            (t.status ||
                                                (t.completed
                                                    ? "Done"
                                                    : "Todo")) === "Done",
                                    )}
                                    onDeleteTask={handleDeleteTaskInternal}
                                />
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

                        {/* 5. Update Feed (Activity Log) */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Bell
                                        size={18}
                                        className="text-slate-600"
                                    />
                                    업데이트 피드
                                </h3>
                                <button
                                    onClick={onClearActivities}
                                    className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                                    title="나의 로그 초기화"
                                >
                                    <Trash2 size={12} />
                                    초기화
                                </button>
                            </div>
                            <div className="space-y-4 relative pl-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-2">
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
                                            {getRelativeTime(
                                                activity.createdAt,
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

export default Dashboard;
