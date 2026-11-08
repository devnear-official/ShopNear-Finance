import { format, parseISO, isValid } from 'date-fns';

export function formatDate(date: string | Date | undefined | null, formatStr = 'dd MMM yyyy'): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, formatStr);
}

export function formatDateTime(date: string | Date | undefined | null): string {
  return formatDate(date, 'dd MMM yyyy, hh:mm a');
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
