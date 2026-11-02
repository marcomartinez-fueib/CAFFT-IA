import type { User } from '../types.ts';

/**
 * Testing controls (random QPV-II answers, simulated video viewing) are for
 * the team only: staff mark a patient account as a test account from the
 * clinical panel. Local development builds show them too.
 */
export function showsTestControls(user: User | null | undefined): boolean {
  return import.meta.env.DEV || user?.isTestAccount === true;
}
