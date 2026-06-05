import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildMemoryPhotoPath,
  toCareLogRows,
  toNotificationPreferenceRow,
  toPetRow,
  toRoutineRows,
} from '../src/lib/supabase-mappers.ts';
import type { CareLog, PetProfile, Routine } from '../src/lib/care.ts';

const spaceId = 'space-1';

describe('toPetRow', () => {
  it('maps a pet profile to the pets table shape used by the Supabase schema', () => {
    const pet: PetProfile & {
      sex: string;
      weightKg: number;
      lifeStage: 'adult';
      activityLevel: 'active';
    } = {
      id: 'pet-1',
      name: 'Mong',
      species: 'dog',
      breed: 'Pomeranian',
      birthDate: '2021-03-10',
      sex: 'male',
      weightKg: 8.4,
      lifeStage: 'adult',
      activityLevel: 'active',
    };

    assert.deepEqual(toPetRow(spaceId, pet), {
      id: 'pet-1',
      space_id: 'space-1',
      name: 'Mong',
      species: 'dog',
      breed: 'Pomeranian',
      birth_date: '2021-03-10',
      sex: 'male',
      weight_kg: 8.4,
      life_stage: 'adult',
      activity_level: 'active',
    });
  });
});

describe('toRoutineRows', () => {
  it('maps care routines to insertable Supabase rows', () => {
    const routines: Routine[] = [
      {
        id: 'routine-1',
        petId: 'pet-1',
        title: 'Morning meal',
        category: 'meal',
        time: '08:00',
        frequency: 'daily',
        reminderMinutesBefore: 10,
      },
    ];

    assert.deepEqual(toRoutineRows(spaceId, routines), [
      {
        id: 'routine-1',
        space_id: 'space-1',
        pet_id: 'pet-1',
        title: 'Morning meal',
        category: 'meal',
        scheduled_time: '08:00',
        frequency: 'daily',
        reminder_minutes_before: 10,
        active: true,
      },
    ]);
  });
});

describe('toCareLogRows', () => {
  it('maps timeline logs to care_logs rows with routine references and tags', () => {
    const logs: CareLog[] = [
      {
        id: 'log-1',
        petId: 'pet-1',
        category: 'meal',
        title: 'Morning meal completed',
        occurredAt: '2026-06-05T08:05:00+09:00',
        sourceRoutineId: 'routine-1',
        tags: ['meal'],
      },
    ];

    assert.deepEqual(toCareLogRows(spaceId, logs), [
      {
        id: 'log-1',
        space_id: 'space-1',
        pet_id: 'pet-1',
        routine_id: 'routine-1',
        category: 'meal',
        title: 'Morning meal completed',
        tags: ['meal'],
        occurred_at: '2026-06-05T08:05:00+09:00',
      },
    ]);
  });
});

describe('toNotificationPreferenceRow', () => {
  it('maps notification preferences to the user-scoped preference row', () => {
    assert.deepEqual(
      toNotificationPreferenceRow('space-1', 'user-1', {
        emailEnabled: false,
        calendarEnabled: true,
        browserPushEnabled: false,
      }),
      {
        space_id: 'space-1',
        user_id: 'user-1',
        email_enabled: false,
        calendar_enabled: true,
        browser_push_enabled: false,
      },
    );
  });
});

describe('buildMemoryPhotoPath', () => {
  it('keeps memory photos under the user-owned storage folder', () => {
    assert.equal(
      buildMemoryPhotoPath({
        userId: 'user-1',
        petId: 'pet-1',
        memoryId: 'memory-1',
        fileName: 'Cute Walk 01.JPG',
      }),
      'user-1/pets/pet-1/memories/memory-1/cute-walk-01.jpg',
    );
  });
});
