import type { CareLog, PetProfile, Routine } from './care';
import type { NotificationPreferences } from './care-state';

type PersistablePet = PetProfile & {
  sex?: string;
  weightKg?: number;
  lifeStage?: 'puppy' | 'kitten' | 'adult' | 'senior';
  activityLevel?: 'low' | 'normal' | 'active';
};

export function toPetRow(spaceId: string, pet: PersistablePet) {
  return {
    id: pet.id,
    space_id: spaceId,
    name: pet.name,
    species: pet.species,
    breed: pet.breed ?? null,
    birth_date: pet.birthDate ?? null,
    sex: pet.sex ?? null,
    weight_kg: pet.weightKg ?? null,
    life_stage: pet.lifeStage ?? 'adult',
    activity_level: pet.activityLevel ?? 'normal',
  };
}

export function toRoutineRows(spaceId: string, routines: Routine[]) {
  return routines.map((routine) => ({
    id: routine.id,
    space_id: spaceId,
    pet_id: routine.petId,
    title: routine.title,
    category: routine.category,
    scheduled_time: routine.time,
    frequency: routine.frequency,
    reminder_minutes_before: routine.reminderMinutesBefore,
    active: true,
  }));
}

export function toCareLogRows(spaceId: string, logs: CareLog[]) {
  return logs.map((log) => ({
    id: log.id,
    space_id: spaceId,
    pet_id: log.petId,
    routine_id: log.sourceRoutineId ?? null,
    category: log.category,
    title: log.title,
    tags: log.tags ?? [],
    occurred_at: log.occurredAt,
  }));
}

export function toNotificationPreferenceRow(
  spaceId: string,
  userId: string,
  preferences: NotificationPreferences,
) {
  return {
    space_id: spaceId,
    user_id: userId,
    email_enabled: preferences.emailEnabled,
    calendar_enabled: preferences.calendarEnabled,
    browser_push_enabled: preferences.browserPushEnabled,
  };
}

export function buildMemoryPhotoPath(input: {
  userId: string;
  petId: string;
  memoryId: string;
  fileName: string;
}) {
  return [
    sanitizePathSegment(input.userId),
    'pets',
    sanitizePathSegment(input.petId),
    'memories',
    sanitizePathSegment(input.memoryId),
    sanitizeFileName(input.fileName),
  ].join('/');
}

function sanitizePathSegment(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim().toLowerCase();
  const lastDot = trimmed.lastIndexOf('.');
  const base = lastDot >= 0 ? trimmed.slice(0, lastDot) : trimmed;
  const extension = lastDot >= 0 ? trimmed.slice(lastDot + 1) : 'jpg';
  return `${sanitizePathSegment(base)}.${sanitizePathSegment(extension) || 'jpg'}`;
}
