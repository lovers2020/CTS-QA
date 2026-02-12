import { ScheduleEvent, Activity, ScheduleType, Doc, Task } from '../types';

const STORAGE_KEYS = {
  SCHEDULES: 'teamsync_schedules',
  ACTIVITIES: 'teamsync_activities',
  DOCS: 'teamsync_docs',
  TASKS: 'teamsync_tasks'
};

// Seed Data (Initial data for the "Database")
const SEED_SCHEDULES: ScheduleEvent[] = [
  {
    id: 's1',
    userId: 'u1',
    userName: '김철수',
    title: 'Q4 마케팅 전략 회의',
    type: ScheduleType.MEETING,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:30',
    description: '회의실 A'
  },
  {
    id: 's2',
    userId: 'u2',
    userName: '이영희',
    title: '부산 클라이언트 미팅',
    type: ScheduleType.BUSINESS_TRIP,
    startDate: '2023-11-20',
    endDate: '2023-11-21',
    description: '현장 방문 및 계약 검토'
  },
  {
    id: 's3',
    userId: 'u3',
    userName: '박민수',
    title: '여름 휴가',
    type: ScheduleType.VACATION,
    startDate: '2023-11-27',
    endDate: '2023-11-30',
    description: '제주도 여행'
  }
];

const SEED_ACTIVITIES: Activity[] = [
    { id: 'a1', user: '이영희', action: '문서 생성', target: '2024 마케팅 플랜', time: '10분 전' },
    { id: 'a2', user: '박민수', action: '댓글 작성', target: 'Q4 성과 보고서', time: '1시간 전' },
    { id: 'a3', user: '김철수', action: '파일 업로드', target: '디자인_시안_v2.pdf', time: '3시간 전' },
];

const SEED_DOCS: Doc[] = [
  {
    id: 'd1',
    title: '2024년 사업 계획안',
    content: `# 2024년 사업 목표\n\n1. 매출 200% 성장\n2. 신규 인력 채용 (개발팀 5명)\n3. 글로벌 시장 진출\n\n세부 사항은 추후 논의 예정입니다.`,
    authorId: 'admin',
    authorName: '관리자',
    createdAt: '2023-10-01T10:00:00Z',
    updatedAt: new Date().toISOString(),
    emoji: '🚀',
    category: 'Team'
  },
  {
    id: 'd2',
    title: '개인 업무 메모',
    content: '- [ ] 주간 보고서 작성\n- [ ] 디자인 팀 미팅 준비\n- [ ] 법인카드 영수증 제출',
    authorId: 'u1',
    authorName: '김철수',
    createdAt: '2023-11-01T09:00:00Z',
    updatedAt: '2023-11-01T09:05:00Z',
    emoji: '📒',
    category: 'Personal'
  }
];

const SEED_TASKS: Task[] = [
    { id: 't1', title: '주간 업무 보고서 작성', dueDate: '오늘까지', completed: false, priority: 'High' },
    { id: 't2', title: '클라이언트 미팅 자료 준비', dueDate: '내일까지', completed: false, priority: 'Medium' },
    { id: 't3', title: '법인카드 영수증 제출', dueDate: '이번 주 금요일', completed: true, priority: 'Low' },
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to get data from storage or seed
const getStorageData = <T>(key: string, seed: T): T => {
    const stored = localStorage.getItem(key);
    if (!stored) {
        localStorage.setItem(key, JSON.stringify(seed));
        return seed;
    }
    return JSON.parse(stored);
};

const setStorageData = <T>(key: string, data: T) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// API Service
export const api = {
    // --- Schedules ---
    getSchedules: async (): Promise<ScheduleEvent[]> => {
        await delay(300); // Simulate network latency
        return getStorageData(STORAGE_KEYS.SCHEDULES, SEED_SCHEDULES);
    },

    addSchedule: async (schedule: ScheduleEvent): Promise<ScheduleEvent> => {
        await delay(300);
        const current = getStorageData(STORAGE_KEYS.SCHEDULES, SEED_SCHEDULES);
        const updated = [schedule, ...current];
        setStorageData(STORAGE_KEYS.SCHEDULES, updated);
        return schedule;
    },

    // --- Activities (Feed) ---
    getActivities: async (): Promise<Activity[]> => {
        await delay(200);
        return getStorageData(STORAGE_KEYS.ACTIVITIES, SEED_ACTIVITIES);
    },

    logActivity: async (activity: Omit<Activity, 'id' | 'time'>): Promise<Activity> => {
        // Automatically create a new activity log
        const newActivity: Activity = {
            id: Math.random().toString(36).substr(2, 9),
            ...activity,
            time: '방금 전'
        };
        
        // Background update without blocking too much
        const current = getStorageData(STORAGE_KEYS.ACTIVITIES, SEED_ACTIVITIES);
        const updated = [newActivity, ...current].slice(0, 50); // Keep last 50 activities
        setStorageData(STORAGE_KEYS.ACTIVITIES, updated);
        return newActivity;
    },

    // --- Docs ---
    getDocs: async (): Promise<Doc[]> => {
        await delay(200);
        return getStorageData(STORAGE_KEYS.DOCS, SEED_DOCS);
    },

    saveDoc: async (doc: Doc, isNew: boolean): Promise<Doc> => {
        await delay(300);
        const current = getStorageData(STORAGE_KEYS.DOCS, SEED_DOCS);
        let updated;
        if (isNew) {
            updated = [...current, doc];
        } else {
            updated = current.map(d => d.id === doc.id ? doc : d);
        }
        setStorageData(STORAGE_KEYS.DOCS, updated);
        return doc;
    },

    deleteDoc: async (id: string): Promise<void> => {
        await delay(200);
        const current = getStorageData(STORAGE_KEYS.DOCS, SEED_DOCS);
        const updated = current.filter(d => d.id !== id);
        setStorageData(STORAGE_KEYS.DOCS, updated);
    },

    // --- Tasks ---
    getTasks: async (): Promise<Task[]> => {
        await delay(200);
        return getStorageData(STORAGE_KEYS.TASKS, SEED_TASKS);
    },

    updateTask: async (task: Task): Promise<Task> => {
        const current = getStorageData(STORAGE_KEYS.TASKS, SEED_TASKS);
        const updated = current.map(t => t.id === task.id ? task : t);
        setStorageData(STORAGE_KEYS.TASKS, updated);
        return task;
    },

    addTask: async (task: Task): Promise<Task> => {
        const current = getStorageData(STORAGE_KEYS.TASKS, SEED_TASKS);
        const updated = [...current, task];
        setStorageData(STORAGE_KEYS.TASKS, updated);
        return task;
    },

    deleteTask: async (id: string): Promise<void> => {
        const current = getStorageData(STORAGE_KEYS.TASKS, SEED_TASKS);
        const updated = current.filter(t => t.id !== id);
        setStorageData(STORAGE_KEYS.TASKS, updated);
    }
};