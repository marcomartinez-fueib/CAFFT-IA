import { ApiError, apiStream } from './api.ts';

export interface AssistantMessage {
  role: 'user' | 'model';
  text: string;
}

/**
 * Asks the assistant through the CAFFT API, which talks to the model and
 * stores the question for the therapist. Nothing here may identify the user.
 *
 * The API answers one JSON event per line: `waiting` while the model wakes
 * (it can take minutes when the UIB's engine is asleep or the GPU is busy),
 * `text` with each piece of the reply, `error` if the model failed.
 */
export async function askAssistant(
  system: string,
  messages: AssistantMessage[],
  handlers: { onText: (replySoFar: string) => void; onWaiting?: () => void },
): Promise<string> {
  let reply = '';
  let buffer = '';
  await apiStream('/ai/chat', { system, messages }, (chunk) => {
    buffer += chunk;
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line) continue;
      const event = JSON.parse(line) as { type: 'waiting' | 'text' | 'error'; text?: string; code?: string };
      if (event.type === 'waiting') handlers.onWaiting?.();
      else if (event.type === 'text' && event.text) {
        reply += event.text;
        handlers.onText(reply);
      } else if (event.type === 'error') {
        throw new ApiError(502, event.code ?? 'ai.unavailable');
      }
    }
  });
  return reply;
}
