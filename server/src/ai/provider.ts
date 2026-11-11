/**
 * The language model behind the assistant. The API is the only one that talks
 * to it: the browser never sees the key and the provider never sees who the
 * user is. Changing provider (e.g. to a European region, if the data
 * protection officer asks for it) means writing another implementation.
 */
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AiProvider {
  /** Yields the reply as it is generated. Throws if the provider fails. */
  stream(request: { system: string; messages: ChatMessage[] }): AsyncIterable<string>;
}

type Fetch = typeof fetch;

/** Answers worth retrying: the model is busy, or Google failed. */
const TRANSIENT = new Set([429, 500, 503]);

/**
 * Google Gemini through the Generative Language API (paid tier: Google does
 * not use the data to train its models). Server-sent events, so the reply can
 * be passed on while it is written.
 *
 * `models` in order of preference: a busy model (503, 429) is retried twice,
 * a second and three seconds later, and then the next one is tried. Preview
 * models are often busy, so a stable one should come last.
 */
export function geminiProvider(
  apiKey: string,
  models: string | string[],
  fetchImpl: Fetch = fetch,
  wait: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): AiProvider {
  const candidates = (Array.isArray(models) ? models : models.split(',')).map((m) => m.trim()).filter(Boolean);

  async function open(system: string, messages: ChatMessage[]): Promise<Response> {
    let lastError = new Error('no model configured');
    for (const model of candidates) {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await wait(attempt === 1 ? 1000 : 3000);
        const res = await fetchImpl(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: system }] },
              contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
            }),
            signal: AbortSignal.timeout(120_000),
          },
        );
        if (res.ok && res.body) return res;
        lastError = new Error(`Gemini (${model}) answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
        if (!TRANSIENT.has(res.status)) throw lastError; // a wrong key or request: no point retrying
      }
    }
    throw lastError;
  }

  return {
    async *stream({ system, messages }) {
      const res = await open(system, messages);

      const decoder = new TextDecoder();
      let buffer = '';
      for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
        buffer += decoder.decode(chunk, { stream: true });
        let newline;
        while ((newline = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (!line.startsWith('data:')) continue;
          const event = JSON.parse(line.slice(5)) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
          const text = (event.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
          if (text) yield text;
        }
      }
    },
  };
}

/**
 * The key, from GEMINI_API_KEY or from a file. The file may be the nginx
 * include the deployment already had (`proxy_set_header X-Goog-Api-Key "…";`)
 * or just the key.
 */
export function readApiKey(fileContents: string): string {
  const quoted = /"([^"]+)"/.exec(fileContents);
  return (quoted ? quoted[1] : fileContents).trim();
}
