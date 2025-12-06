import { GoogleGenAI, Type } from "@google/genai";
import { Expense, PrayerDay, AIInsightData } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateInsights = async (
  expenses: Expense[],
  prayers: PrayerDay[]
): Promise<AIInsightData> => {
  try {
    // Filter for last 30 days to keep prompt size manageable
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentExpenses = expenses.filter(e => new Date(e.date) >= thirtyDaysAgo);
    const recentPrayers = prayers.filter(p => new Date(p.date) >= thirtyDaysAgo);

    const prompt = `
      Analyze the following user data for the last 30 days and provide personalized insights.
      
      Expenses Summary (JSON):
      ${JSON.stringify(recentExpenses.map(e => ({ amount: e.amount, cat: e.category, date: e.date })))}
      
      Prayer History Summary (JSON - completed prayers per day):
      ${JSON.stringify(recentPrayers)}

      Provide:
      1. 3 concise bullet points of financial advice based on spending habits.
      2. 3 concise bullet points of spiritual encouragement based on prayer consistency.
      3. A 1-sentence overall summary of their balance.
    `;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            financialAdvice: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            spiritualEncouragement: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIInsightData;

  } catch (error) {
    console.error("Error generating insights:", error);
    return {
      financialAdvice: ["Unable to generate advice at this time."],
      spiritualEncouragement: ["Keep striving for your best."],
      summary: "Data analysis unavailable."
    };
  }
};