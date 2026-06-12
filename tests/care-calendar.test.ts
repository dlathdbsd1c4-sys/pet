import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createMonthCalendarDays, groupLogsByLocalDate } from '../src/lib/care-calendar.ts';
import type { CareLog } from '../src/lib/care.ts';

const logs: CareLog[] = [
  {
    id: 'memory-1',
    petId: 'pet-1',
    category: 'memory',
    title: 'Park photo',
    occurredAt: '2026-05-29T14:30:00+09:00',
  },
  {
    id: 'memory-2',
    petId: 'pet-1',
    category: 'memory',
    title: 'Snack diary',
    occurredAt: '2026-05-29T19:00:00+09:00',
  },
  {
    id: 'health-1',
    petId: 'pet-1',
    category: 'health',
    title: 'Skin note',
    occurredAt: '2026-05-28T11:00:00+09:00',
  },
];

describe('groupLogsByLocalDate', () => {
  it('groups logs by their local yyyy-mm-dd key while preserving order', () => {
    const grouped = groupLogsByLocalDate(logs);

    assert.deepEqual(
      grouped['2026-05-29'].map((log) => log.id),
      ['memory-1', 'memory-2'],
    );
    assert.deepEqual(
      grouped['2026-05-28'].map((log) => log.id),
      ['health-1'],
    );
  });
});

describe('createMonthCalendarDays', () => {
  it('creates a padded month grid with selectable date keys', () => {
    const days = createMonthCalendarDays('2026-05-29');
    const dateDays = days.filter((day) => day.dateKey);

    assert.equal(days[0].dateKey, null);
    assert.equal(dateDays[0].dateKey, '2026-05-01');
    assert.equal(dateDays.at(-1)?.dateKey, '2026-05-31');
    assert.equal(dateDays.length, 31);
    assert.equal(days.length % 7, 0);
  });
});
