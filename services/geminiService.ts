import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const explainTopic = async (topic: string, subject: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `
      You are an expert tutor. 
      Subject: ${subject}
      Topic: ${topic}
      
      Please provide a concise, easy-to-understand explanation of this topic. 
      If it is a programming concept, include a very short code snippet. 
      If it is a math concept, include a formula if applicable.
      Keep it under 150 words.
      Format using Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No explanation available.";
  } catch (error) {
    console.error("Error fetching explanation:", error);
    return "Sorry, I couldn't fetch an explanation at this time. Please check your API key.";
  }
};