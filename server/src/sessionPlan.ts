/**
 * The session plan: the days of the week and the hour of each session, in the
 * clinic's time zone. Pure functions, shared by the app (through
 * ../../sessionPlan.ts) and the API, so both agree on when a session is.
 */

export const CLINIC_TIME_ZONE = 'Europe/Madrid';

/** day: 0 = Sunday ... 6 = Saturday; time: 'HH:MM', local to the clinic. */
export interface PlanSlot {
  day: number;
  time: string;
}

/** The team recommends 2 or 3 sessions a week; up to 8 in all. */
export const RECOMMENDED_PER_WEEK = { min: 2, max: 3 } as const;
export const RECOMMENDED_TOTAL = 8;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** One slot per day at most, sorted from Monday, or null if invalid. */
export function normalizeSlots(slots: PlanSlot[]): PlanSlot[] | null {
  if (!Array.isArray(slots) || slots.length === 0 || slots.length > 7) return null;
  const days = new Set<number>();
  for (const s of slots) {
    if (!Number.isInteger(s?.day) || s.day < 0 || s.day > 6 || typeof s.time !== 'string' || !TIME.test(s.time)) return null;
    if (days.has(s.day)) return null;
    days.add(s.day);
  }
  const fromMonday = (d: number) => (d + 6) % 7;
  return [...slots].map(({ day, time }) => ({ day, time })).sort((a, b) => fromMonday(a.day) - fromMonday(b.day));
}

/** The local date ('2027-01-18'), weekday and minutes since midnight of an instant, in `timeZone`. */
export function zonedParts(at: number, timeZone = CLINIC_TIME_ZONE): { date: string; day: number; minutes: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(at))
      .map((p) => [p.type, p.value]),
  );
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return { date: `${parts.year}-${parts.month}-${parts.day}`, day, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

/** The instant of local `date` at `time` in `timeZone` (DST-aware). */
export function zonedTime(date: string, time: string, timeZone = CLINIC_TIME_ZONE): number {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const wanted = Date.UTC(y, m - 1, d, hh, mm);
  // Guess with the offset at that UTC instant, then correct once for a DST change in between.
  let at = wanted;
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(at, timeZone);
    const [py, pm, pd] = p.date.split('-').map(Number);
    const shownAsUtc = Date.UTC(py, pm - 1, pd, Math.floor(p.minutes / 60), p.minutes % 60);
    at += wanted - shownAsUtc;
  }
  return at;
}

/** The next `count` planned sessions from `from` on (sessions already under way count). */
export function upcomingSessions(slots: PlanSlot[], from: number, count: number, timeZone = CLINIC_TIME_ZONE): { date: string; time: string; at: number }[] {
  const out: { date: string; time: string; at: number }[] = [];
  if (slots.length === 0) return out;
  const start = zonedParts(from, timeZone);
  const [y, m, d] = start.date.split('-').map(Number);
  for (let i = 0; out.length < count && i < 7 * 60; i++) {
    const date = new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10);
    const day = (start.day + i) % 7;
    const slot = slots.find((s) => s.day === day);
    if (!slot) continue;
    const at = zonedTime(date, slot.time, timeZone);
    // Today's session stays in the list until an hour after it started.
    if (at + 60 * 60 * 1000 <= from) continue;
    out.push({ date, time: slot.time, at });
  }
  return out;
}

/**
 * When the reminder for a session goes out: two hours before, but not before
 * 8:00 (a session at 9:00 is announced at 8:00, one at 7:30 at 7:30).
 */
export function reminderTime(date: string, time: string, timeZone = CLINIC_TIME_ZONE): number {
  const session = zonedTime(date, time, timeZone);
  const eight = zonedTime(date, '08:00', timeZone);
  return Math.min(session, Math.max(session - 2 * 60 * 60 * 1000, eight));
}

/** The planned sessions whose day falls between `from` and `to` (both instants), oldest first. */
export function plannedSessionsBetween(slots: PlanSlot[], from: number, to: number, timeZone = CLINIC_TIME_ZONE): { date: string; time: string; at: number }[] {
  const out: { date: string; time: string; at: number }[] = [];
  const start = zonedParts(from, timeZone);
  const end = zonedParts(to, timeZone).date;
  const [y, m, d] = start.date.split('-').map(Number);
  for (let i = 0; i < 366; i++) {
    const date = new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10);
    if (date > end) break;
    const slot = slots.find((s) => s.day === (start.day + i) % 7);
    if (slot) out.push({ date, time: slot.time, at: zonedTime(date, slot.time, timeZone) });
  }
  return out;
}
