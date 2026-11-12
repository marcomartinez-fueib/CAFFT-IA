import { upcomingSessions, type PlanSlot } from '../sessionPlan.ts';

/**
 * The planned sessions as a calendar file (.ics), for «Afegir al calendari».
 * One event per session, the next `count` of them, in UTC so every calendar
 * places them right. Like the reminders, no clinical information.
 */
export function planToIcs(slots: PlanSlot[], opts: { title: string; description: string; url: string; count: number; now?: number }): string {
  const stamp = (at: number) => new Date(at).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const escape = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const now = opts.now ?? Date.now();
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UIB//CAFFT//CA', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const s of upcomingSessions(slots, now, opts.count)) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:cafft-${s.date}-${s.time.replace(':', '')}@uib.es`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(s.at)}`,
      `DTEND:${stamp(s.at + 45 * 60 * 1000)}`,
      `SUMMARY:${escape(opts.title)}`,
      `DESCRIPTION:${escape(`${opts.description}\n${opts.url}`)}`,
      `URL:${opts.url}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  // RFC 5545 wants CRLF line ends.
  return lines.join('\r\n') + '\r\n';
}

export function downloadIcs(ics: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 100);
}
