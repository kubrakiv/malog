// PURE JS — timezone-safe (no external libs)
// Usage:
//   buildPeriodFromOrderPoints(tasks, { inputTimesAreUtc: false, defaultTimeZone: 'Europe/Prague' })
//   // or provide a per-task resolver:
//   buildPeriodFromOrderPoints(tasks, { timeZoneResolver: (task, when) => task.tz || 'Europe/Prague' })

// ---------- helpers ----------
const normType = (t) => (t || "").trim().toUpperCase();
const hasStart = (t) => Boolean(t && t.start_date && t.start_time);
const hasEnd = (t) => Boolean(t && t.end_date && t.end_time);

// Ensure time has seconds; e.g., "10:20" -> "10:20:00"
const ensureSeconds = (hhmmss) => {
  if (!hhmmss) return hhmmss;
  const parts = hhmmss.split(":");
  if (parts.length === 2) return `${parts[0]}:${parts[1]}:00`;
  if (parts.length === 3) return hhmmss;
  // fallback: try to keep as-is
  return hhmmss;
};

// Build "YYYY-MM-DDTHH:mm:ssZ" if input is already UTC
const joinUtcIso = (dateStr, timeStr) =>
  `${dateStr}T${ensureSeconds(timeStr)}Z`;

// ---- Timezone conversion without libs (DST-safe) ----
// Convert a local date/time expressed in a specific IANA timezone into a UTC ISO string.
// Based on Intl.DateTimeFormat round-trip technique.
const zonedTimeToUtcIso = (dateStr, timeStr, timeZone) => {
  const [Y, M, D] = dateStr.split("-").map((x) => parseInt(x, 10));
  const [h, m, s] = ensureSeconds(timeStr)
    .split(":")
    .map((x) => parseInt(x, 10));

  // 1) Treat the local wall time as if it were UTC to get a rough epoch guess.
  const guessMs = Date.UTC(Y, M - 1, D, h, m, s);

  // Helper: compute tz offset (ms) at a given instant using formatToParts trick.
  const tzOffsetAt = (ms) => {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = dtf.formatToParts(new Date(ms));
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const y = parseInt(map.year, 10);
    const mo = parseInt(map.month, 10);
    const d = parseInt(map.day, 10);
    const hh = parseInt(map.hour, 10);
    const mi = parseInt(map.minute, 10);
    const ss = parseInt(map.second, 10);

    // This constructs an instant whose *UTC* components match the wall-time
    // shown by 'timeZone' at the original instant.
    const asUTCms = Date.UTC(y, mo - 1, d, hh, mi, ss);
    // Difference gives the timeZone offset at 'ms' (positive for tz east of UTC).
    return asUTCms - ms;
  };

  // 2) First-pass offset at the rough guess:
  const off1 = tzOffsetAt(guessMs);
  let utcMs = guessMs - off1;

  // 3) Second pass to handle DST edge cases (ambiguous/invalid times):
  const off2 = tzOffsetAt(utcMs);
  utcMs = guessMs - off2;

  return new Date(utcMs).toISOString();
};

// Sort by actual time, not string lexicographic
const ascDate = (a, b) => new Date(a).getTime() - new Date(b).getTime();

// Default resolver if none provided
const defaultTimeZoneResolver = (_task, _when, defaultTimeZone) =>
  defaultTimeZone || "Europe/Prague";

// Convert a task's (date, time) into UTC ISO depending on settings
const makeToUtcIso = ({
  inputTimesAreUtc,
  defaultTimeZone,
  timeZoneResolver,
}) => {
  return (task, dateField, timeField, when /* 'start' | 'end' */) => {
    const d = task[dateField];
    const t = task[timeField];
    if (!d || !t) return null;

    if (inputTimesAreUtc) {
      return joinUtcIso(d, t);
    }

    const tz =
      typeof timeZoneResolver === "function"
        ? timeZoneResolver(task, when) || defaultTimeZone || "Europe/Prague"
        : defaultTimeZoneResolver(task, when, defaultTimeZone);

    return zonedTimeToUtcIso(d, t, tz);
  };
};

// ---------- MAIN ----------
export const buildPeriodFromOrderPoints = (tasks = [], opts = {}) => {
  const {
    // If your order times are already stored as UTC, set this to true to just append 'Z'.
    inputTimesAreUtc = false,
    // If order times are local, set your common timezone, e.g., 'Europe/Prague' or 'Europe/Rome'
    defaultTimeZone = "Europe/Prague",
    // Optional per-task resolver: (task, when) => 'Europe/Rome' | 'Europe/Prague' | ...
    // You can choose TZ by task.country_code, task.city, or any metadata you have.
    timeZoneResolver,
  } = opts;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    console.warn("[Period] No tasks provided");
    return { fromIso: null, toIso: null };
  }

  const toUtcIso = makeToUtcIso({
    inputTimesAreUtc,
    defaultTimeZone,
    timeZoneResolver,
  });

  // FROM: earliest START/LOADING by start timestamp
  const preferredStarts = tasks
    .filter(
      (x) =>
        (normType(x.type) === "START" || normType(x.type) === "LOADING") &&
        hasStart(x)
    )
    .map((x) => toUtcIso(x, "start_date", "start_time", "start"))
    .filter(Boolean);

  const fallbackStarts = preferredStarts.length
    ? preferredStarts
    : tasks
        .filter(hasStart)
        .map((x) => toUtcIso(x, "start_date", "start_time", "start"))
        .filter(Boolean);

  const fromIso = fallbackStarts.length
    ? [...fallbackStarts].sort(ascDate)[0]
    : null;

  // TO: latest UNLOADING by end timestamp
  const preferredEnds = tasks
    .filter((x) => normType(x.type) === "UNLOADING" && hasEnd(x))
    .map((x) => toUtcIso(x, "end_date", "end_time", "end"))
    .filter(Boolean);

  const fallbackEnds = preferredEnds.length
    ? preferredEnds
    : tasks
        .filter(hasEnd)
        .map((x) => toUtcIso(x, "end_date", "end_time", "end"))
        .filter(Boolean);

  const toIso = fallbackEnds.length
    ? [...fallbackEnds].sort(ascDate).at(-1)
    : null;

  if (!fromIso) {
    console.warn(
      "[Period] Missing fromIso (need a START/LOADING with start_date+start_time)."
    );
  }
  if (!toIso) {
    console.warn(
      "[Period] Missing toIso (need an UNLOADING with end_date+end_time)."
    );
  }

  return { fromIso, toIso };
};
