// Lightweight opening-hours helpers
// Supports shapes like:
//  A) { mon: { open: true, start: "09:00", end: "17:00" }, ... }
//  B) { monday: { closed: false, open: "09:00", close: "17:00" }, ... }
//  C) { mon: "09:00-17:00", tue: "Closed", ... }

type DayKey =
  | "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat"
  | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

const SHORT: readonly DayKey[] = ["sun","mon","tue","wed","thu","fri","sat"];
const LONG:  readonly DayKey[] = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function toDayKey(date: Date) {
  const i = date.getDay(); // 0=Sun..6=Sat
  return { short: SHORT[i], long: LONG[i] as Extract<DayKey, `${string}day`> };
}

function parseRange(s: string): { startMin: number; endMin: number } | null {
  const m = s.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [, h1, m1, h2, m2] = m;
  const startMin = parseInt(h1, 10) * 60 + parseInt(m1, 10);
  const endMin = parseInt(h2, 10) * 60 + parseInt(m2, 10);
  return { startMin, endMin };
}

function getTodayRaw(opening_hours: any, now = new Date()) {
  if (!opening_hours || typeof opening_hours !== "object") return null;
  const { short, long } = toDayKey(now);
  return opening_hours[short] ?? opening_hours[long] ?? null;
}

function getRangeFromDayObj(obj: any): { startMin: number; endMin: number } | null {
  if (!obj) return null;
  if (typeof obj === "string") {
    if (/closed/i.test(obj)) return null;
    return parseRange(obj.trim());
  }
  if (typeof obj === "object") {
    if (obj.closed === true || obj.open === false) return null;
    if (typeof obj.start === "string" && typeof obj.end === "string") {
      return parseRange(`${obj.start}-${obj.end}`);
    }
    if (typeof obj.open === "string" && typeof obj.close === "string") {
      return parseRange(`${obj.open}-${obj.close}`);
    }
  }
  return null;
}

function minutesNow(d = new Date()) {
  return d.getHours() * 60 + d.getMinutes();
}

function formatMinutes(min: number) {
  let h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return `${h}:${mm} ${ampm}`;
}

export function isOpenNow(opening_hours: any, now: Date = new Date()): { open: boolean } {
  const r = getRangeFromDayObj(getTodayRaw(opening_hours, now));
  if (!r) return { open: false };
  const cur = minutesNow(now);

  // overnight?
  if (r.endMin < r.startMin) {
    const open = cur >= r.startMin || cur < r.endMin;
    return { open };
  }
  return { open: cur >= r.startMin && cur < r.endMin };
}

export function nextOpenToday(opening_hours: any, now: Date = new Date()): string | null {
  const r = getRangeFromDayObj(getTodayRaw(opening_hours, now));
  if (!r) return null;
  const cur = minutesNow(now);

  // overnight -> if closed now, next open today is startMin if we haven't reached it yet
  if (r.endMin < r.startMin) {
    if (cur < r.startMin) return formatMinutes(r.startMin);
    // otherwise next open is technically tomorrow; we keep it simple and return null
    return null;
  }
  if (cur < r.startMin) return formatMinutes(r.startMin);
  return null;
}
