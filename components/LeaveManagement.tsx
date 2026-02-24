import React, { useState } from "react";
import { ScheduleEvent, ScheduleType, User } from "../types";
import { Plus, ChevronLeft, ChevronRight, X, MapPin } from "lucide-react";

interface ScheduleManagementProps {
    user: User;
    schedules: ScheduleEvent[];
    onAddSchedule: (schedule: ScheduleEvent) => void;
}

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({
    user,
    schedules,
    onAddSchedule,
}) => {
    const [showForm, setShowForm] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [formData, setFormData] = useState({
        title: "",
        type: ScheduleType.MEETING,
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        description: "",
    });

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const prevMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
        );
    };

    const nextMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
        );
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newSchedule: ScheduleEvent = {
            id: Math.random().toString(36).substr(2, 9),
            userId: user.id,
            userName: user.name,
            title: formData.title,
            type: formData.type,
            startDate: formData.startDate,
            endDate: formData.endDate,
            startTime: formData.startTime,
            endTime: formData.endTime,
            description: formData.description,
        };

        onAddSchedule(newSchedule);
        setShowForm(false);
        setFormData({
            title: "",
            type: ScheduleType.MEETING,
            startDate: "",
            endDate: "",
            startTime: "",
            endTime: "",
            description: "",
        });
    };

    const getTypeColorStyles = (type: ScheduleType) => {
        switch (type) {
            case ScheduleType.MEETING:
                return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200";
            case ScheduleType.BUSINESS_TRIP:
                return "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200";
            case ScheduleType.VACATION:
                return "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200";
            case ScheduleType.REMOTE:
                return "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200";
            case ScheduleType.PERSONAL:
                return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty cells for days before the 1st of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(
                <div
                    key={`empty-${i}`}
                    className="bg-slate-50/30 border-b border-r border-slate-100 min-h-[120px]"
                ></div>,
            );
        }

        // Actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, "0");
            const dayStr = String(day).padStart(2, "0");
            const fullDateStr = `${year}-${month}-${dayStr}`;

            const daySchedules = schedules.filter((s) => {
                return s.startDate <= fullDateStr && s.endDate >= fullDateStr;
            });

            const isToday =
                new Date().toISOString().split("T")[0] === fullDateStr;
            const dayOfWeek = new Date(
                year,
                currentDate.getMonth(),
                day,
            ).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            days.push(
                <div
                    key={day}
                    className={`border-b border-r border-slate-100 p-2 min-h-[120px] transition-colors hover:bg-slate-50 flex flex-col ${isToday ? "bg-blue-50/30" : ""}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span
                            className={`
                text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                ${isToday ? "bg-blue-600 text-white" : isWeekend ? "text-slate-500" : "text-slate-700"}
                ${dayOfWeek === 0 && !isToday ? "text-red-500" : ""}
              `}
                        >
                            {day}
                        </span>
                        {daySchedules.length > 0 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                                {daySchedules.length}건
                            </span>
                        )}
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-[100px] scrollbar-thin scrollbar-thumb-slate-200">
                        {daySchedules.map((schedule) => (
                            <div
                                key={`${schedule.id}-${day}`}
                                className={`text-[11px] px-1.5 py-1 rounded border truncate cursor-pointer transition-colors ${getTypeColorStyles(schedule.type)}`}
                                title={`${schedule.title} (${schedule.userName})\n${schedule.description}`}
                            >
                                <div className="flex items-center gap-1">
                                    {schedule.startTime && (
                                        <span className="font-mono text-[10px] opacity-80">
                                            {schedule.startTime}
                                        </span>
                                    )}
                                    <span className="font-semibold truncate">
                                        {schedule.title}
                                    </span>
                                </div>
                                <div className="text-[10px] opacity-80 truncate">
                                    {schedule.userName}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>,
            );
        }

        // Fill remaining cells to complete the last row (optional for aesthetics)
        const totalCells = firstDay + daysInMonth;
        const remainingCells = 7 - (totalCells % 7);
        if (remainingCells < 7) {
            for (let i = 0; i < remainingCells; i++) {
                days.push(
                    <div
                        key={`empty-end-${i}`}
                        className="bg-slate-50/30 border-b border-r border-slate-100 min-h-[120px]"
                    ></div>,
                );
            }
        }

        return days;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px]">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <h2 className="text-2xl font-bold text-slate-800">
                            {currentDate.getFullYear()}년{" "}
                            {currentDate.getMonth() + 1}월
                        </h2>
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm">
                            <button
                                onClick={prevMonth}
                                className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-l-lg border-r border-slate-100 transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={goToToday}
                                className="px-3 py-1.5 text-sm font-medium hover:bg-slate-50 text-slate-600 transition-colors"
                            >
                                오늘
                            </button>
                            <button
                                onClick={nextMonth}
                                className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-r-lg border-l border-slate-100 transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 text-sm text-slate-500 hidden lg:flex">
                        {Object.values(ScheduleType).map((type) => (
                            <div key={type} className="flex items-center gap-1">
                                <div
                                    className={`w-2 h-2 rounded-full ${getTypeColorStyles(type).split(" ")[0].replace("bg-", "bg-").replace("-100", "-400")}`}
                                ></div>
                                <span>{type}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    <span>일정 등록</span>
                </button>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                    {["일", "월", "화", "수", "목", "금", "토"].map(
                        (day, i) => (
                            <div
                                key={day}
                                className={`py-3 text-center text-sm font-semibold ${i === 0 ? "text-red-500" : "text-slate-600"}`}
                            >
                                {day}
                            </div>
                        ),
                    )}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                    {renderCalendarDays()}
                </div>
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 animate-scale-in relative">
                        <button
                            onClick={() => setShowForm(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                            <Plus className="text-blue-600" size={24} />새 일정
                            등록
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    일정 제목
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                                    placeholder="예: 마케팅 전략 회의"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            title: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    일정 종류
                                </label>
                                <select
                                    className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border bg-white"
                                    value={formData.type}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            type: e.target
                                                .value as ScheduleType,
                                        })
                                    }
                                >
                                    {Object.values(ScheduleType).map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    설명/장소
                                </label>
                                <div className="relative">
                                    <MapPin
                                        className="absolute left-3 top-3 text-slate-400"
                                        size={16}
                                    />
                                    <input
                                        type="text"
                                        className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 pl-10 border"
                                        placeholder="상세 내용 입력 (선택)"
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        시작일
                                    </label>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="date"
                                            required
                                            className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                                            value={formData.startDate}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    startDate: e.target.value,
                                                })
                                            }
                                        />
                                        <input
                                            type="time"
                                            className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                                            value={formData.startTime}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    startTime: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        종료일
                                    </label>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="date"
                                            required
                                            className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                                            value={formData.endDate}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    endDate: e.target.value,
                                                })
                                            }
                                        />
                                        <input
                                            type="time"
                                            className="w-full border-slate-200 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                                            value={formData.endTime}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    endTime: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors font-medium flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    등록하기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleManagement;
