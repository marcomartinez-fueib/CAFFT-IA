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

/**
 * Google Gemini through the Generative Language API (paid tier: Google does
 * not use the data to train its models). Server-sent events, so the reply can
 * be passed on while it is written.
 */
export function geminiProvider(apiKey: string, model: string, fetchImpl: Fetch = fetch): AiProvider {
  return {
    async *stream({ system, messages }) {
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
      if (!res.ok || !res.body) throw new Error(`Gemini answered ${res.status}: ${(await res.text()).slice(0, 300)}`);

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
