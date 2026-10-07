/**
 * Creates the first superadmin. The app ships no default accounts, so this is
 * how a fresh deployment gets its first login.
 *
 *   npm run create-admin -- --username admin --email admin@uib.es
 *   docker compose exec api node src/cli/create-admin.ts --username admin --email admin@uib.es
 *
 * The password is read from the terminal without echo, or from
 * CAFFT_ADMIN_PASSWORD when there is no terminal.
 */
import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline';
import { loadConfig } from '../config.ts';
import { openDb } from '../db.ts';
import { hashPassword, MIN_PASSWORD_LENGTH } from '../passwords.ts';
import { createUser } from '../users.ts';
import { audit } from '../audit.ts';

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Swallow the echo of every keystroke after the prompt itself.
    const write = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput;
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
      if (s.startsWith(question)) write.call(rl, s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function readPassword(): Promise<string> {
  if (process.env.CAFFT_ADMIN_PASSWORD) return process.env.CAFFT_ADMIN_PASSWORD;
  if (!process.stdin.isTTY) throw new Error('No terminal: set CAFFT_ADMIN_PASSWORD.');
  const first = await promptHidden('Password: ');
  const second = await promptHidden('Repeat password: ');
  if (first !== second) throw new Error('Passwords do not match.');
  return first;
}

const { values } = parseArgs({
  options: {
    username: { type: 'string' },
    email: { type: 'string' },
  },
});

if (!values.username || !values.email) {
  console.error('Usage: create-admin --username <name> --email <address>');
  process.exit(2);
}

try {
  const password = await readPassword();
  if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);

  const db = openDb(loadConfig().dbPath);
  const result = createUser(db, {
    role: 'superadmin',
    username: values.username,
    email: values.email,
    passwordHash: await hashPassword(password),
    consentGiven: true,
  });
  if (!result.ok) throw new Error(`A user with that ${result.conflict} already exists.`);

  audit(db, { actorId: null, action: 'superadmin.create.cli', targetId: result.user.id });
  db.close();
  console.log(`Created superadmin '${result.user.username}' (${result.user.id}).`);
} catch (err) {
  console.error((err as Error).message);
  process.exit(1);
}
