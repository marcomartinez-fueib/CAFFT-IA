import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;
let lastError: string | null = null;

/**
 * Same-origin endpoint that the server proxies to
 * generativelanguage.googleapis.com, injecting the real API key server-side.
 *
 * Two reasons this is a proxy rather than a direct call:
 *   1. The API key never reaches the browser, so it cannot be read out of the
 *      JS bundle or devtools.
 *   2. The deployment runs under `connect-src 'self'`, which forbids the
 *      browser from talking to Google directly.
 *
 * Resolves to `<origin>/cafft/genai` in production and `<origin>/cafft/genai`
 * in dev (handled by the Vite dev proxy). The SDK appends the API version and
 * path, e.g. `<base>/v1beta/models/<model>:streamGenerateContent`.
 */
const getProxyBaseUrl = (): string => {
  const base = import.meta.env.BASE_URL || '/';
  return `${window.location.origin}${base}genai`;
};

const initAI = () => {
  try {
    ai = new GoogleGenAI({
      // Placeholder only. The proxy overwrites the `x-goog-api-key` header with
      // the real key before forwarding, so this value is never sent upstream.
      // The SDK requires a non-empty key to pass its own auth validation.
      apiKey: 'proxied-server-side',
      httpOptions: {
        baseUrl: getProxyBaseUrl(),
      },
    });
    console.log("AI Assistant: Initialized successfully (server-side proxy)");
    return true;
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
