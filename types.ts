export enum ScheduleType {
    MEETING = "회의",
    BUSINESS_TRIP = "외근/출장",
    VACATION = "휴가",
    REMOTE = "재택 근무",
    PERSONAL = "개인 일정",
}

export interface ScheduleEvent {
    id: string;
    userId: string;
    userName: string;
    title: string;
    type: ScheduleType;
    startDate: string;
    endDate: string;
    description: string;
    // Optional time for timeline visualization
    startTime?: string;
    endTime?: string;
}

export interface Folder {
    id: string;
    name: string;
    userId: string;
    createdAt: string;
    category?: "Personal" | "Team";
}

export interface Doc {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: string;
    updatedAt: string;
    emoji?: string;
    category: "Personal" | "Team";
    folderId?: string;
}

export interface User {
    id: string;
    name: string;
    role: "Admin" | "Member";
    password?: string;
}

export interface Task {
    id: string;
    userId: string;
    title: string;
    dueDate: string;
    completed: boolean;
    priority: "High" | "Medium" | "Low";
    hasLoggedCompletion?: boolean; // Track if completion has been logged to feed
}

export interface Notice {
    id: string;
    title: string;
    date: string;
    type: "Important" | "General";
}

export interface Activity {
    id: string;
    user: string;
    action: string;
    target: string;
    time: string;
}
