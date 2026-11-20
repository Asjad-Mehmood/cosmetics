/**
 * Estimated arrival window for a zone's "1-2" (working days) estimate.
 * Orders placed after 2 PM (Pakistan time) or on Sunday are packed the next
 * working day; Sundays are not delivery days.
 */
export function arrivalWindow(estimatedDays: string, now = new Date()): [Date, Date] | null {
  const m = /^(\d+)\s*(?:-\s*(\d+))?/.exec(estimatedDays.trim());
  if (!m) return null;
  const min = Number(m[1]);
  const max = Number(m[2] ?? m[1]);

  // Work in Pakistan time (UTC+5, no daylight saving).
  const pk = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const day = new Date(Date.UTC(pk.getUTCFullYear(), pk.getUTCMonth(), pk.getUTCDate()));
  const isSunday = (d: Date) => d.getUTCDay() === 0;
  const next = (d: Date) => new Date(d.getTime() + 24 * 60 * 60 * 1000);

  let ship = day;
  if (pk.getUTCHours() >= 14 || isSunday(ship)) ship = next(ship);
  while (isSunday(ship)) ship = next(ship);

  const addWorkingDays = (from: Date, n: number) => {
    let d = from;
    for (let i = 0; i < n;) {
      d = next(d);
      if (!isSunday(d)) i++;
    }
    return d;
  };
  return [addWorkingDays(ship, min), addWorkingDays(ship, max)];
}

const fmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** "Mon 24 Nov" or "Mon 24 – Tue 25 Nov". */
export function formatWindow([from, to]: [Date, Date]): string {
  if (from.getTime() === to.getTime()) return fmt.format(from);
  const a = fmt.formatToParts(from);
  const b = fmt.format(to);
  const sameMonth = from.getUTCMonth() === to.getUTCMonth();
  const part = (t: string) => a.find((p) => p.type === t)?.value;
  const start = sameMonth ? `${part("weekday")} ${part("day")}` : fmt.format(from);
  return `${start} – ${b}`;
}
