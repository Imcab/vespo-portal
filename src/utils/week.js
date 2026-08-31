function toDateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Monday-based week start, formatted as YYYY-MM-DD for storage/comparison.
export function getWeekStart(date = new Date()) {
  const d = toDateOnly(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDateOnly(d);
}

export function formatDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Given a Monday week-start string, returns the 7 dates Sun..Sat for that week
// (the excel-style schedule starts the week on Sunday even though weeks are Monday-anchored).
export function getWeekDays(weekStartStr) {
  const [y, m, d] = weekStartStr.split('-').map(Number);
  const monday = new Date(y, m - 1, d);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() - 1);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    return day;
  });
}

export function addWeeks(weekStartStr, count) {
  const [y, m, d] = weekStartStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + count * 7);
  return formatDateOnly(date);
}
