import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function askAI(prompt: string, context?: string) {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `You are a helpful mathematical assistant. 
            ${context ? `Current calculation context: ${context}` : ""}
            User question: ${prompt}`,
          },
        ],
      },
    ],
    config: {
      systemInstruction: "You are a world-class mathematician. Provide clear, concise explanations and solve complex problems step-by-step. Use LaTeX formatting for math expressions where appropriate.",
    },
  });

  const response = await model;
  return response.text;
}
