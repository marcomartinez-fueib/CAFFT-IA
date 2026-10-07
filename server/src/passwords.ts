import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// OWASP-recommended scrypt cost (N=2^17, r=8, p=1) needs 128 MiB per hash;
// N=2^15 keeps it at 32 MiB, which matters on a shared server, and is still
// well above the 2^14 minimum.
const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;
const MAX_MEM = 64 * 1024 * 1024;

export const MIN_PASSWORD_LENGTH = 8;

function derive(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, { N: n, r, p, maxmem: MAX_MEM }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

/** Returns `scrypt$N$r$p$<salt b64>$<hash b64>`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !hash) return false;

  const expected = Buffer.from(hash, 'base64');
  const actual = await derive(password, Buffer.from(salt, 'base64'), Number(n), Number(r), Number(p));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Verified against when the username does not exist, so a failed login takes
// the same time whether or not the account exists.
const dummyHash = hashPassword(randomBytes(16).toString('hex'));

export async function verifyAgainstDummy(password: string): Promise<false> {
  await verifyPassword(password, await dummyHash);
  return false;
}
