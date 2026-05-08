import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;
let lastError: string | null = null;

const initAI = () => {
  try {
    const key = process.env.GEMINI_API_KEY;

    if (key && key.length > 0) {
      ai = new GoogleGenAI({ apiKey: key });
      console.log("AI Assistant: Initialized successfully");
      return true;
    } else {
      lastError = "GEMINI_API_KEY not found in environment";
      console.warn("AI Assistant: " + lastError);
    }
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    console.error("AI Assistant: Initialization failed", error);
  }
  return false;
};

// Initial attempt
initAI();

/**
 * The initialized GoogleGenAI instance.
 */
export { ai };

/**
 * Gets the last initialization error.
 */
export const getAiLastError = () => lastError;

/**
 * Creates a new chat session with the Gemini model.
 * @param systemInstruction The system instruction string in the user's current language.
 * @returns A Chat instance or null if the AI client failed to initialize.
 */
export const createChatSession = (systemInstruction: string) => {
    if (!ai && !initAI()) {
        return null;
    }

    try {
        if (!ai) return null;

        // Use gemini-3-flash-preview as recommended in the skill for text tasks
        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: systemInstruction,
            },
        });
        
        return chat;
    } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.error("AI Assistant: Error in createChatSession", error);
        return null;
    }
};
