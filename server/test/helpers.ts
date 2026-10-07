import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { buildApp } from '../src/app.ts';
import { loadConfig } from '../src/config.ts';
import { openDb, type Db } from '../src/db.ts';
import { hashPassword } from '../src/passwords.ts';
import { createUser, type Role, type UserRow } from '../src/users.ts';

export const ORIGIN = 'http://localhost:3000';

export async function makeApp(): Promise<{ app: FastifyInstance; db: Db }> {
  const db = openDb(':memory:');
  const app = await buildApp(loadConfig({ dbPath: ':memory:', publicOrigin: ORIGIN, logger: false }), db);
  return { app, db };
}

export async function seedUser(db: Db, role: Role, username: string, password = 'correct-horse'): Promise<UserRow> {
  const result = createUser(db, { role, username, email: `${username}@example.test`, passwordHash: await hashPassword(password) });
  if (!result.ok) throw new Error(`seed conflict: ${result.conflict}`);
  return result.user;
}

/** The `name=value` pair from a response's Set-Cookie, ready for a Cookie header. */
export function sessionCookie(res: LightMyRequestResponse): string {
  const cookie = res.cookies.find((c) => c.name === 'cafft_session');
  if (!cookie) throw new Error('no session cookie set');
  return `${cookie.name}=${cookie.value}`;
}

export async function login(app: FastifyInstance, username: string, password = 'correct-horse'): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    headers: { origin: ORIGIN },
    payload: { username, password },
  });
  if (res.statusCode !== 200) throw new Error(`login failed: ${res.statusCode} ${res.body}`);
  return sessionCookie(res);
}
