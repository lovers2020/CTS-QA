import { GoogleGenAI } from "@google/genai";
import { ScheduleEvent } from "../types";

// Initialize AI client lazily or safely
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing. AI features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const assistWriting = async (text: string, command: 'summarize' | 'fix' | 'expand'): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "API 키가 설정되지 않았습니다.";

  try {
    let prompt = "";
    switch (command) {
      case 'summarize':
        prompt = "다음 내용을 3줄 요약해 주세요:\n\n";
        break;
      case 'fix':
        prompt = "다음 텍스트의 맞춤법을 교정하고, 문체를 더 자연스럽고 전문적으로 다듬어 주세요:\n\n";
        break;
      case 'expand':
        prompt = "다음 내용을 바탕으로 더 상세한 내용을 덧붙여서 글을 확장해 주세요:\n\n";
        break;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${prompt}${text}`,
      config: {
        systemInstruction: "You are a professional writing assistant. Respond only with the modified text, keeping a clean and professional tone.",
      }
    });
    return response.text || "AI 응답을 생성할 수 없습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 처리 중 오류가 발생했습니다.";
  }
};

export const generateTeamInsight = async (schedules: ScheduleEvent[]): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "API 키가 설정되지 않았습니다.";

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