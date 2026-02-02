import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// Initialize Gemini AI
// NOTE: We assume process.env.API_KEY is available.
const apiKey = process.env.API_KEY || ''; 
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeDeductibility = async (transaction: Transaction): Promise<string> => {
  if (!ai) {
    return "API Key not configured. Unable to analyze.";
  }

  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      You are a Greek tax expert for OE (General Partnership) companies.
      Analyze the following expense for tax deductibility in Greece.
      
      Description: ${transaction.description}
      Amount: ${transaction.amount} EUR
      Client/Vendor: ${transaction.clientName}
      
      Provide a concise advice (max 2 sentences) on whether this is likely 100% deductible, partially deductible, or not deductible, and why.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI service.";
  }
};