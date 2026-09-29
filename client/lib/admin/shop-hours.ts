const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_INDEX = Object.fromEntries(DAY_LABELS.map((label, index) => [label.toLowerCase(), index]));

export type DayHours = { open: string; close: string } | null;

export function to24Hour(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3]?.toUpperCase();
  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  if (hour > 23) return null;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

export function to12Hour(value: string): string {
  const [hourPart, minute] = value.split(":");
  const hour = Number(hourPart);
  const period = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 || 12;
  return `${twelve}:${minute} ${period}`;
}

function blankWeek(open = "11:00", close = "23:00"): DayHours[] {
  return Array.from({ length: 7 }, () => ({ open, close }));
}

function rangeDays(start: number, end: number): number[] {
  const startAt = WEEK_ORDER.indexOf(start);
  const endAt = WEEK_ORDER.indexOf(end);
  if (startAt < 0 || endAt < startAt) return [start];
  return WEEK_ORDER.slice(startAt, endAt + 1);
}

export function parseWeekHours(hours: string): DayHours[] {
  const week = blankWeek();
  if (/coming soon/i.test(hours)) return Array.from({ length: 7 }, () => null);

  const chunks = [...hours.matchAll(/(?:Every day|(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:[–-](Mon|Tue|Wed|Thu|Fri|Sat|Sun))?)\s*·\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[–-]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi)];
  if (chunks.length === 0) {
    const times = [...hours.matchAll(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi)]
      .map((match) => to24Hour(match[1]))
      .filter((value): value is string => Boolean(value));
    if (times.length >= 2) return blankWeek(times[0], times[1]);
    return week;
  }

  const parsed = Array.from({ length: 7 }, () => null) as DayHours[];
  for (const chunk of chunks) {
    const open = to24Hour(chunk[3]);
    const close = to24Hour(chunk[4]);
    if (!open || !close) continue;
    const days = /^every day/i.test(chunk[0])
      ? [...WEEK_ORDER]
      : rangeDays(DAY_INDEX[chunk[1].toLowerCase()], chunk[2] ? DAY_INDEX[chunk[2].toLowerCase()] : DAY_INDEX[chunk[1].toLowerCase()]);
    for (const day of days) parsed[day] = { open, close };
  }
  return parsed;
}

function sameHours(left: DayHours, right: DayHours) {
  if (!left || !right) return left === right;
  return left.open === right.open && left.close === right.close;
}

export function formatWeekHours(week: DayHours[]): string {
  const groups: { start: number; end: number; hours: DayHours }[] = [];
  for (const day of WEEK_ORDER) {
    const hours = week[day];
    const last = groups.at(-1);
    const nextToLast = last ? WEEK_ORDER.indexOf(day) === WEEK_ORDER.indexOf(last.end) + 1 : false;
    if (last && nextToLast && sameHours(last.hours, hours)) last.end = day;
    else groups.push({ start: day, end: day, hours });
  }

  const openGroups = groups.filter((group) => group.hours);
  if (openGroups.length === 1 && openGroups[0].start === 1 && openGroups[0].end === 0) {
    const hours = openGroups[0].hours;
    return hours ? `Every day · ${to12Hour(hours.open)} – ${to12Hour(hours.close)}` : "Closed";
  }

  return openGroups.map((group) => {
    const hours = group.hours;
    if (!hours) return "";
    const label = group.start === group.end ? DAY_LABELS[group.start] : `${DAY_LABELS[group.start]}–${DAY_LABELS[group.end]}`;
    return `${label} · ${to12Hour(hours.open)} – ${to12Hour(hours.close)}`;
  }).join(" · ");
}

export const WEEKDAYS = [
  { day: 1, label: "Monday" },
  { day: 2, label: "Tuesday" },
  { day: 3, label: "Wednesday" },
  { day: 4, label: "Thursday" },
  { day: 5, label: "Friday" },
  { day: 6, label: "Saturday" },
  { day: 0, label: "Sunday" },
] as const;
