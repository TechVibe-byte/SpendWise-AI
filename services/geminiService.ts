
import { GoogleGenAI, Type } from "@google/genai";
import { Expense, SpendingInsight, Category } from "../types";

export const getApiKey = (): string | null => {
  return localStorage.getItem('gemini_api_key');
};

export const getFinancialInsights = async (expenses: Expense[]): Promise<SpendingInsight | null> => {
  if (expenses.length === 0) return null;

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  const expenseData = expenses.map(e => ({
    amount: e.amount,
    category: e.category,
    description: e.description,
    date: e.date
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze these expenses and provide financial insights in JSON format: ${JSON.stringify(expenseData)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A brief summary of spending patterns." },
            suggestions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Actionable suggestions for better budgeting."
            },
            savingTips: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Specific tips on how to save money based on the data."
            },
          },
          required: ["summary", "suggestions", "savingTips"]
        },
      },
    });

    if (!response.text) return null;
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const suggestCategory = async (description: string, availableCategories: string[]): Promise<Category> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    // Fail silently/gracefully for auto-complete features
    return availableCategories.includes('Other') ? 'Other' : availableCategories[0];
  }

  const ai = new GoogleGenAI({ apiKey });
  const categoryList = availableCategories.join(", ");
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Categorize the following purchase description into exactly one of these categories: ${categoryList}. Description: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: availableCategories }
          },
          required: ["category"]
        }
      }
    });
    const result = JSON.parse(response.text);
    return result.category as Category;
  } catch (error) {
    return availableCategories.includes('Other') ? 'Other' : availableCategories[0];
  }
};
