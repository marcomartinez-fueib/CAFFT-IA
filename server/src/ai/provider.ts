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
  /**
   * Yields the reply as it is generated. Throws if the provider fails.
   * `onWaiting` is called whenever it waits for the model (busy or waking).
   */
  stream(request: { system: string; messages: ChatMessage[] }, hooks?: { onWaiting?: () => void }): AsyncIterable<string>;
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

  async function open(system: string, messages: ChatMessage[], onWaiting?: () => void): Promise<Response> {
    let lastError = new Error('no model configured');
    for (const model of candidates) {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) {
          onWaiting?.();
          await wait(attempt === 1 ? 1000 : 3000);
        }
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
    async *stream({ system, messages }, hooks) {
      const res = await open(system, messages, hooks?.onWaiting);

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

export interface LocalProviderOptions {
  fetchImpl?: Fetch;
  wait?: (ms: number) => Promise<void>;
  now?: () => number;
  /** How long to keep asking while the engine wakes or waits for the GPU. */
  maxWaitMs?: number;
  /** The engine's context is 32k tokens, shared by prompt, history and reply. */
  maxTokens?: number;
  temperature?: number;
}

/**
 * The UIB's own model: the gateway of the shared engine pausat-llm (vLLM
 * serving Qwen3.5 as `pausat-chat`, run for PAUSAT on the same server),
 * OpenAI-compatible, reached over the Docker network `ai-shared` with a `gate`
 * token. Nothing leaves the UIB; the gateway and vLLM log no request bodies.
 *
 * The engine sleeps when idle and shares the GPU with PAUSAT Studio. The
 * gateway holds a request up to a minute while it wakes, then answers 503
 * `llm_waking` with Retry-After. Waking takes up to ~2.5 min, and longer if a
 * video is rendering (it is never interrupted), so this keeps asking for up
 * to 10 minutes, as PAUSAT's own backend does.
 */
export function localProvider(baseUrl: string, token: string, model: string, options: LocalProviderOptions = {}): AiProvider {
  const {
    fetchImpl = fetch,
    wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
    now = Date.now,
    maxWaitMs = 600_000,
    maxTokens = 1000,
    temperature = 0.3,
  } = options;

  async function open(system: string, messages: ChatMessage[], onWaiting?: () => void): Promise<Response> {
    const started = now();
    for (;;) {
      const res = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          model,
          stream: true,
          max_tokens: maxTokens,
          temperature,
          messages: [
            { role: 'system', content: system },
            ...messages.map((m) => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text })),
          ],
        }),
        // The gateway may hold the request a minute before answering.
        signal: AbortSignal.timeout(180_000),
      });
      if (res.ok && res.body) return res;
      const detail = (await res.text()).slice(0, 300);
      const retryAfterMs = (Number(res.headers.get('retry-after')) || 5) * 1000;
      const waking = res.status === 503 || res.status === 429;
      if (!waking || now() - started + retryAfterMs > maxWaitMs) {
        throw new Error(`local model answered ${res.status}: ${detail}`);
      }
      onWaiting?.();
      await wait(retryAfterMs);
    }
  }

  return {
    async *stream({ system, messages }, hooks) {
      const res = await open(system, messages, hooks?.onWaiting);
      const decoder = new TextDecoder();
      let buffer = '';
      for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
        buffer += decoder.decode(chunk, { stream: true });
        let newline;
        while ((newline = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') return;
          const event = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
          const text = event.choices?.[0]?.delta?.content;
          if (text) yield text;
        }
      }
    },
  };
}
