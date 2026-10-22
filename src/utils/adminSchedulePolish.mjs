export function filterAndSortSchedules(schedules, query, order = "upcoming") {
  const key = String(query || "").trim().toLocaleLowerCase("zh-TW");
  const filtered = schedules.filter((schedule) => {
    const songNames = (schedule.songs || []).map((song) => song.title).join(" ");
    return [schedule.date, schedule.title, schedule.serviceType, schedule.note, songNames]
      .some((part) => String(part ?? "").toLocaleLowerCase("zh-TW").includes(key));
  });
  return filtered.sort((a, b) => order === "latest"
    ? b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
    : a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}
export function dateInTaiwan(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}
export function nextSundayDate(from) {
  const [year, month, day] = from.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const offset = (7 - weekday) % 7;
  const target = new Date(Date.UTC(year, month - 1, day + offset));
  return target.toISOString().slice(0, 10);
}
