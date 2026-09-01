const DAY_MS = 24 * 60 * 60 * 1000;

// Returns null | 'overdue' | 'soon' | 'upcoming' for a "due date" indicator.
// `done` suppresses the indicator once there's nothing left to chase.
export function deadlineStatus(dateStr, done = false) {
  if (!dateStr || done) return null;
  const due = new Date(`${dateStr}T23:59:59`);
  const diffDays = (due.getTime() - Date.now()) / DAY_MS;
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 2) return 'soon';
  if (diffDays <= 7) return 'upcoming';
  return null;
}

export const DEADLINE_LABEL = { overdue: 'Overdue', soon: 'Due soon', upcoming: 'Due this week' };
export const DEADLINE_COLOR = { overdue: '#ef4444', soon: '#f97316', upcoming: '#eab308' };
