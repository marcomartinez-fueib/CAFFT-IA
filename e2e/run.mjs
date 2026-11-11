// End-to-end check of the patient and therapist flows against the real stack:
// a production build served by `vite preview` (which proxies /cafft/api to the
// API, as nginx does) and the API on a throwaway SQLite database.
//
//   npm run test:e2e
//
// Needs ports 3000 and 3001 free, and a Chromium for Playwright: set
// CHROME_PATH, or install one once with `npx playwright-core install
// chromium-headless-shell`. The exposure videos are Git LFS files; without
// them the player fails and the run uses the test-account «Simular» button.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { openDb } from '../server/src/db.ts';
import { createUser } from '../server/src/users.ts';
import { hashPassword } from '../server/src/passwords.ts';
import { recordConsent } from '../server/src/consents.ts';
import { runFlow } from './flow.mjs';

const ROOT = join(import.meta.dirname, '..');
const BASE = 'http://localhost:3000/cafft/';
const work = mkdtempSync(join(tmpdir(), 'cafft-e2e-'));
const dbPath = join(work, 'cafft.db');
const children = [];

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  if (existsSync(chromium.executablePath())) return chromium.executablePath();
  const cache = join(homedir(), '.cache', 'ms-playwright');
  for (const dir of existsSync(cache) ? readdirSync(cache).sort().reverse() : []) {
    const shell = join(cache, dir, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
    if (dir.startsWith('chromium_headless_shell-') && existsSync(shell)) return shell;
  }
  throw new Error('No Chromium found: set CHROME_PATH or run `npx playwright-core install chromium-headless-shell`.');
}

function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: 'inherit', ...options });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`))));
  });
}

function start(cmd, args, env = {}, cwd = ROOT) {
  const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: 'ignore' });
  children.push(child);
  return child;
}

async function waitFor(url) {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`${url} did not come up`);
}

async function seed() {
  const db = openDb(dbPath);
  const passwordHash = await hashPassword('correct-horse');
  const therapist = createUser(db, { role: 'therapist', username: 'ter', email: 'ter@example.test', passwordHash });
  const patient = createUser(db, { role: 'patient', username: 'pac', email: 'pac@example.test', passwordHash });
  // A second patient, registered from the panel, who has not accepted the consent yet.
  const pending = createUser(db, { role: 'patient', username: 'nova', email: 'nova@example.test', passwordHash });
  if (!therapist.ok || !patient.ok || !pending.ok) throw new Error('seed failed');
  recordConsent(db, patient.user.id, 'treatment', 'ca');
  // The patient has answered the notification consent; neither sees the guided tour.
  const prefs = { enabled: false, reminders: false, newTasks: false, followUp: false, general: false, frequency: 'daily', startTime: '09:00', endTime: '21:00' };
  for (const p of [patient, pending]) {
    db.prepare('UPDATE users SET therapist_id = ?, notification_prefs = ? WHERE id = ?').run(therapist.user.id, JSON.stringify(prefs), p.user.id);
  }
  db.prepare('UPDATE users SET onboarding_enabled = 0').run();
  db.close();
}

let failed = true;
try {
  await seed();
  await run('npx', ['vite', 'build', '--outDir', join(work, 'dist'), '--emptyOutDir', '--logLevel', 'warn']);
  // No backups, no mail: everything stays in the throwaway directory.
  const apiEnv = { DB_PATH: dbPath, BACKUP_DIR: '', COOKIE_SECURE: 'false', FEEDBACK_TO: '', SMTP_HOST: '' };
  start('node', ['src/index.ts'], apiEnv, join(ROOT, 'server'));
  // Run vite's own script, not npx, so killing the child stops the server.
  start('node', ['node_modules/vite/bin/vite.js', 'preview', '--outDir', join(work, 'dist'), '--port', '3000', '--strictPort']);
  await waitFor('http://127.0.0.1:3001/health');
  await waitFor(BASE);

  const browser = await chromium.launch({ executablePath: findChrome() });
  try {
    const results = await runFlow({ browser, base: BASE, dbPath });
    console.log(results.join('\n'));
    failed = results.some((r) => r.startsWith('FAIL'));
  } finally {
    await browser.close();
  }
} catch (err) {
  console.error(err);
} finally {
  for (const child of children) child.kill();
  rmSync(work, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
