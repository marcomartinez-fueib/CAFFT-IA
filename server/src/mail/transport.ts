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

export interface SmtpConfig {
  host: string;
  port: number;
  /** Refuse to send unless the server upgrades to TLS with STARTTLS. */
  requireTls: boolean;
  /** `Name <address>`; the name is what the inbox shows as the sender. */
  from: string;
}

/** What this module uses from nodemailer, so it can be tested without a server. */
export type CreateTransport = (options: {
  host: string;
  port: number;
  secure: boolean;
  requireTLS: boolean;
  connectionTimeout: number;
  greetingTimeout: number;
  socketTimeout: number;
  pool: boolean;
  maxConnections: number;
}) => { sendMail(mail: Record<string, unknown>): Promise<unknown> };

/**
 * SMTP through the UIB relay, configured as B4B and PAUSAT do from the same
 * server: smtp.uib.es, port 25, no username or password (the relay accepts by
 * source IP), and STARTTLS required.
 *
 * Short timeouts (10 s to connect and greet, 20 s for the rest): a relay on
 * the university's own network that takes longer will not answer, and the
 * outbox retries later anyway. nodemailer's defaults wait two minutes to
 * connect, which in B4B showed up as users staring at a button.
 *
 * One pooled connection: mail goes out one message at a time from the outbox,
 * and reusing the connection avoids a TCP and TLS handshake per message.
 */
export class SmtpTransport implements MailTransport {
  private readonly from: string;
  private readonly smtp: ReturnType<CreateTransport>;

  // No TypeScript parameter properties: Node's type stripping cannot run them.
  constructor(config: SmtpConfig, create: CreateTransport) {
    this.from = config.from;
    this.smtp = create({
      host: config.host,
      port: config.port,
      // Not "unencrypted": on port 25 the session starts in clear and
      // requireTLS forces the STARTTLS upgrade before anything is sent.
      secure: false,
      requireTLS: config.requireTls,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      pool: true,
      maxConnections: 1,
    });
  }

  async send(message: { to: string; subject: string; body: string }): Promise<void> {
    await this.smtp.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.body,
      // RFC 3834: written by a machine. Stops auto-responders on the other
      // side from replying to us.
      headers: { 'Auto-Submitted': 'auto-generated' },
    });
  }
}
