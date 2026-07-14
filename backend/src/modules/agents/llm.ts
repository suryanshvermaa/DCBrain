import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import config from '@/core/config';

export const llm = new ChatGoogleGenerativeAI({
  model: config.GEMINI_MODEL,
  apiKey: config.GEMINI_API_KEY,
  temperature: 0.2,
  maxOutputTokens: config.GEMINI_MAX_TOKENS,
});

export async function askGemini(prompt: string, jsonMode: boolean = false): Promise<string> {
  let finalPrompt = prompt;
  if (jsonMode) {
    finalPrompt += '\n\nCRITICAL: You MUST respond with a valid JSON object ONLY. Do NOT wrap your response in markdown code blocks like ```json ... ```. Just return raw JSON.';
  }

  const response = await llm.invoke([{ role: 'user', content: finalPrompt }]);
  const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

  if (jsonMode) {
    // Clean up any markdown json blocks if Gemini ignores instructions
    return content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
  }

  return content;
}
