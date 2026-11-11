import { apiStream } from './api.ts';

export interface AssistantMessage {
  role: 'user' | 'model';
  text: string;
}

/**
 * Asks the assistant through the CAFFT API, which holds the provider's key
 * and stores the question for the therapist. Nothing here may identify the
 * user: the instructions and messages go to an external provider.
 * `onText` receives the reply so far, as it grows.
 */
export async function askAssistant(system: string, messages: AssistantMessage[], onText: (replySoFar: string) => void): Promise<string> {
  let reply = '';
  await apiStream('/ai/chat', { system, messages }, (chunk) => {
    reply += chunk;
    onText(reply);
  });
  return reply;
}
