import type { CareLog } from './care';

export type MonthCalendarDay = {
  id: string;
  dateKey: string | null;
  label: string;
};

export function groupLogsByLocalDate(logs: CareLog[]) {
  return logs.reduce<Record<string, CareLog[]>>((groups, log) => {
    const dateKey = log.occurredAt.slice(0, 10);
    groups[dateKey] = [...(groups[dateKey] ?? []), log];
    return groups;
  }, {});
}

export function createMonthCalendarDays(activeDate: string): MonthCalendarDay[] {
  const [year, month] = activeDate.split('-').map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return [];

  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: MonthCalendarDay[] = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    days.push({
      id: `blank-start-${index}`,
      dateKey: null,
      label: '',
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      id: `${year}-${pad(month)}-${pad(day)}`,
      dateKey: `${year}-${pad(month)}-${pad(day)}`,
      label: String(day),
    });
  }

  while (days.length % 7 !== 0) {
    days.push({
      id: `blank-end-${days.length}`,
      dateKey: null,
      label: '',
    });
  }

  return days;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}
