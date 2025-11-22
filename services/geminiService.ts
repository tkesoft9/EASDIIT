import { GoogleGenAI, Type } from "@google/genai";
import { AttendanceSummary, ChartDataPoint } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseStudentListWithGemini = async (rawText: string, batchId: string): Promise<any[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract a list of students from the following text (which might be from a CSV or pasted Excel content). Return a JSON array where each object has 'name' (string) and 'email' (string, optional). Clean up any extra whitespace.
      
      Text to process:
      ${rawText.substring(0, 15000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              email: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const parsed = JSON.parse(text);
    // Add IDs and Batch IDs
    return parsed.map((p: any) => ({
      id: crypto.randomUUID(),
      name: p.name,
      email: p.email,
      batchId: batchId,
      photoUrl: ''
    }));

  } catch (error) {
    console.error("Gemini parsing failed:", error);
    throw new Error("Failed to parse student list using AI.");
  }
};

export const generateAttendanceInsights = async (
  batchName: string,
  summary: { totalClasses: number; attendanceRate: number },
  recentTrend: ChartDataPoint[],
  atRiskStudents: { name: string; rate: number; absentCount: number }[]
): Promise<string> => {
  try {
    const prompt = `
      Act as an academic advisor. Analyze the attendance data for class "${batchName}".
      
      Overview:
      - Overall Attendance Rate: ${summary.attendanceRate.toFixed(1)}%
      - Total Classes Conducted: ${summary.totalClasses}

      Recent Trend (Last 7 sessions):
      ${JSON.stringify(recentTrend)}

      Students with Low Attendance (At Risk):
      ${atRiskStudents.length > 0 
        ? JSON.stringify(atRiskStudents.map(s => `${s.name}: ${s.rate.toFixed(1)}% (${s.absentCount} absences)`)) 
        : "None. All students have good attendance."}

      Provide a concise summary (max 3-4 sentences). 
      1. Comment on the overall class trend (improving/declining).
      2. Specifically mention the students at risk and suggest a brief action (e.g., "Schedule meeting with...").
      3. Keep the tone professional and actionable.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "No insights available.";
  } catch (error) {
    console.error("Gemini insights failed:", error);
    return "Could not generate AI insights at this time.";
  }
};