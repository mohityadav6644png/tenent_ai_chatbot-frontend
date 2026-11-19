import { describe, expect, it } from 'vitest';
import { formatSchedule } from '../../src/shared/utils/formatSchedule.js';

describe('formatSchedule', () => {
  it('formats daily, weekly, and monthly schedules', () => {
    expect(formatSchedule({ frequency: 'monthly', day_of_month: 1, time: '09:00' }))
      .toBe('1st of every month, 9:00');
    expect(formatSchedule({ frequency: 'weekly', weekday: 1, time: '08:00' }))
      .toBe('Mondays, 8:00');
    expect(formatSchedule({ frequency: 'daily', time: '07:30' })).toBe('Daily, 7:30');
  });

  it.each([[2, '2nd'], [3, '3rd'], [11, '11th']])(
    'formats the ordinal suffix for day %i',
    (day, expected) => {
      expect(formatSchedule({ frequency: 'monthly', day_of_month: day, time: '09:00' }))
        .toBe(`${expected} of every month, 9:00`);
    },
  );
});
