import { GoogleGenAI } from "@google/genai";
import { ScheduleEvent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const summarizeFileContent = async (fileName: string, content: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `다음 파일의 내용을 요약해 주세요. 파일 이름: ${fileName}\n\n내용:\n${content.substring(0, 10000)}`,
      config: {
        systemInstruction: "You are a helpful assistant for a Korean company. Provide concise, professional summaries in Korean.",
      }
    });
    return response.text || "요약을 생성할 수 없습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 분석 중 오류가 발생했습니다.";
  }
};

export const generateTeamInsight = async (schedules: ScheduleEvent[]): Promise<string> => {
  try {
    const scheduleData = schedules.map(s => 
      `${s.userName}: [${s.type}] ${s.title} (${s.startDate} ~ ${s.endDate}) - ${s.description}`
    ).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `다음은 팀원들의 향후 일정입니다. 팀의 주요 일정 흐름과 업무 가용성, 그리고 공유가 필요한 특이사항에 대해 3줄 이내로 브리핑해 주세요:\n\n${scheduleData}`,
      config: {
        systemInstruction: "You are a smart team schedule manager. Analyze the calendar events and provide a professional daily briefing in Korean.",
      }
    });
    return response.text || "일정 인사이트를 생성할 수 없습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "데이터 분석 중 오류가 발생했습니다.";
  }
};