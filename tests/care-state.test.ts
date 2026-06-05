import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  appendCareLog,
  completeRoutineInState,
  createCareAppState,
  createCareStateStorage,
  updateNotificationPreferences,
} from '../src/lib/care-state.ts';
import type { CareLog, PetProfile, Routine } from '../src/lib/care.ts';

const pet: PetProfile = {
  id: 'pet-1',
  name: 'Mong',
  species: 'dog',
};

const routines: Routine[] = [
  {
    id: 'routine-breakfast',
    petId: 'pet-1',
    title: 'Morning meal',
    category: 'meal',
    time: '08:00',
    frequency: 'daily',
    reminderMinutesBefore: 10,
  },
];

const logs: CareLog[] = [
  {
    id: 'log-existing',
    petId: 'pet-1',
    category: 'memory',
    title: 'First diary',
    occurredAt: '2026-06-05T09:00:00+09:00',
  },
];

describe('createCareAppState', () => {
  it('builds the default personal care state with notification preferences', () => {
    const state = createCareAppState({
      activeDate: '2026-06-05',
      pet,
      routines,
      logs,
    });

    assert.equal(state.activeDate, '2026-06-05');
    assert.equal(state.pet.name, 'Mong');
    assert.deepEqual(state.notificationPreferences, {
      emailEnabled: true,
      calendarEnabled: true,
      browserPushEnabled: false,
    });
  });
});

describe('appendCareLog', () => {
  it('adds a deterministic care log without mutating the previous state', () => {
    const state = createCareAppState({
      activeDate: '2026-06-05',
      pet,
      routines,
      logs,
    });

    const next = appendCareLog(state, {
      id: 'log-new',
      now: '2026-06-05T10:30:00+09:00',
      category: 'meal',
      title: 'Snack',
      tags: ['snack'],
    });

    assert.equal(state.logs.length, 1);
    assert.equal(next.logs.length, 2);
    assert.deepEqual(next.logs[1], {
      id: 'log-new',
      petId: 'pet-1',
      category: 'meal',
      title: 'Snack',
      occurredAt: '2026-06-05T10:30:00+09:00',
      tags: ['snack'],
      sourceRoutineId: undefined,
    });
  });
});

describe('completeRoutineInState', () => {
  it('creates one completion log and avoids duplicate completion for the same routine/date', () => {
    const state = createCareAppState({
      activeDate: '2026-06-05',
      pet,
      routines,
      logs: [],
    });

    const first = completeRoutineInState(state, {
      routineId: 'routine-breakfast',
      id: 'log-complete-1',
      now: '2026-06-05T08:05:00+09:00',
    });
    const second = completeRoutineInState(first, {
      routineId: 'routine-breakfast',
      id: 'log-complete-2',
      now: '2026-06-05T08:06:00+09:00',
    });

    assert.equal(first.logs.length, 1);
    assert.equal(second.logs.length, 1);
    assert.equal(second.logs[0].title, 'Morning meal 완료');
    assert.equal(second.logs[0].sourceRoutineId, 'routine-breakfast');
  });
});

describe('updateNotificationPreferences', () => {
  it('updates one preference while keeping the remaining channels intact', () => {
    const state = createCareAppState({
      activeDate: '2026-06-05',
      pet,
      routines,
      logs,
    });

    const next = updateNotificationPreferences(state, { emailEnabled: false });

    assert.deepEqual(next.notificationPreferences, {
      emailEnabled: false,
      calendarEnabled: true,
      browserPushEnabled: false,
    });
  });
});

describe('createCareStateStorage', () => {
  it('loads fallback state when saved browser data is invalid', () => {
    const backingStore = new Map<string, string>([['care-state', '{broken']]);
    const storage = createCareStateStorage({
      key: 'care-state',
      storage: {
        getItem: (key) => backingStore.get(key) ?? null,
        setItem: (key, value) => backingStore.set(key, value),
      },
    });
    const fallback = createCareAppState({
      activeDate: '2026-06-05',
      pet,
      routines,
      logs,
    });

    assert.deepEqual(storage.load(fallback), fallback);
  });

  it('saves and restores the app state through a Storage-like adapter', () => {
    const backingStore = new Map<string, string>();
    const storage = createCareStateStorage({
      key: 'care-state',
      storage: {
        getItem: (key) => backingStore.get(key) ?? null,
        setItem: (key, value) => backingStore.set(key, value),
      },
    });
    const state = createCareAppState({
      activeDate: '2026-06-05',
      pet,
      routines,
      logs,
    });

    storage.save(state);

    assert.deepEqual(storage.load(state), state);
  });
});
