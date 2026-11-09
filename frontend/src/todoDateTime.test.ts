import { describe, expect, it } from 'vitest';
import { formatDueDate, isPastDueDateTime, toLocalDateTimeInput, toUtcDateTime } from './todoDateTime.js';

describe('due date helpers', () => {
  it('converts between local input values and UTC timestamps', () => {
    const localDateTime = '2026-11-12T16:30';
    const utcDateTime = new Date(localDateTime).toISOString();

    expect(toUtcDateTime(localDateTime)).toBe(utcDateTime);
    expect(toLocalDateTimeInput(utcDateTime)).toBe(localDateTime);
  });

  it('formats valid timestamps in the local timezone and rejects past dates', () => {
    const dateTime = '2026-11-12T16:30:00.000Z';
    const expected = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateTime));

    expect(formatDueDate(dateTime)).toBe(expected);
    expect(isPastDueDateTime('2000-01-01T00:00')).toBe(true);
    expect(isPastDueDateTime('2099-01-01T00:00')).toBe(false);
  });
});
