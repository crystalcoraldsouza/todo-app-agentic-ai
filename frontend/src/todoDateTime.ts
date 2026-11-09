export function formatDueDate(value: string): string {
  const date = new Date(value.trim());

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function getMinimumDueDateTime(): string {
  const nextMinute = new Date();
  nextMinute.setSeconds(0, 0);
  nextMinute.setMinutes(nextMinute.getMinutes() + 1);

  return new Date(nextMinute.getTime() - nextMinute.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function isPastDueDateTime(value: string): boolean {
  return new Date(value).getTime() < Date.now();
}

export function toLocalDateTimeInput(value: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value.trim());

  if (!Number.isFinite(date.getTime())) {
    return '';
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function toUtcDateTime(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}
