/** Delivers one message. Throws on failure; the outbox decides about retries. */
export interface MailTransport {
  send(message: { to: string; subject: string; body: string }): Promise<void>;
}

/**
 * Development and tests: writes the message to the log instead of sending it,
 * and keeps it in `sent` so tests can read links out of it.
 */
export class LogTransport implements MailTransport {
  readonly sent: { to: string; subject: string; body: string }[] = [];
  private readonly log: (msg: string) => void;

  constructor(log: (msg: string) => void = console.log) {
    this.log = log;
  }

  async send(message: { to: string; subject: string; body: string }): Promise<void> {
    this.sent.push(message);
    this.log(`[mail] to=${message.to} subject=${JSON.stringify(message.subject)}\n${message.body}`);
  }
}

export interface GraphConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  /** Mailbox the mail is sent as, e.g. no-reply@fueib.org. */
  sender: string;
}

/**
 * Microsoft Graph sendMail with app-only (client credentials) auth. Needs an
 * Entra ID app registration with the Mail.Send *application* permission,
 * admin-consented, and ideally scoped to the sender mailbox only — see
 * docs/deploy/DEPLOYMENT.md. Unlike SMTP AUTH, this does not depend on Basic
 * authentication, which Exchange Online is retiring.
 */
export class GraphTransport implements MailTransport {
  private token: { value: string; expiresAt: number } | null = null;
  // No TypeScript parameter properties: Node's type stripping cannot run them.
  private readonly config: GraphConfig;
  private readonly fetchImpl: typeof fetch;

  constructor(config: GraphConfig, fetchImpl: typeof fetch = fetch) {
    this.config = config;
    this.fetchImpl = fetchImpl;
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) return this.token.value;

    const res = await this.fetchImpl(`https://login.microsoftonline.com/${encodeURIComponent(this.config.tenantId)}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'https://graph.microsoft.com/.default',
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
    if (!res.ok || !data.access_token) {
      throw new Error(`Graph token request failed (${res.status}): ${data.error_description ?? 'no detail'}`);
    }
    this.token = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
    return this.token.value;
  }

  async send(message: { to: string; subject: string; body: string }): Promise<void> {
    const res = await this.fetchImpl(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(this.config.sender)}/sendMail`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await this.accessToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          subject: message.subject,
          body: { contentType: 'Text', content: message.body },
          toRecipients: [{ emailAddress: { address: message.to } }],
        },
        // A no-reply mailbox has no use for copies of everything it sends.
        saveToSentItems: false,
      }),
    });
    if (res.status !== 202) {
      // A revoked or rotated secret shows up as 401: drop the cached token.
      if (res.status === 401) this.token = null;
      const detail = await res.text().catch(() => '');
      throw new Error(`Graph sendMail failed (${res.status}): ${detail.slice(0, 500)}`);
    }
  }
}
