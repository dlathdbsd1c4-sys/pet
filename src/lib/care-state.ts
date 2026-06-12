import type { CareCategory, CareLog, PetProfile, Routine } from './care';

export type NotificationPreferences = {
  emailEnabled: boolean;
  calendarEnabled: boolean;
  browserPushEnabled: boolean;
};

export type CareAppState = {
  activeDate: string;
  pet: PetProfile;
  routines: Routine[];
  logs: CareLog[];
  notificationPreferences: NotificationPreferences;
};

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function createCareAppState(input: {
  activeDate: string;
  pet: PetProfile;
  routines: Routine[];
  logs: CareLog[];
  notificationPreferences?: Partial<NotificationPreferences>;
}): CareAppState {
  return {
    activeDate: input.activeDate,
    pet: { ...input.pet },
    routines: input.routines.map((routine) => ({ ...routine })),
    logs: input.logs.map((log) => ({
      ...log,
      ...(log.tags ? { tags: [...log.tags] } : {}),
    })),
    notificationPreferences: {
      emailEnabled: true,
      calendarEnabled: true,
      browserPushEnabled: false,
      ...input.notificationPreferences,
    },
  };
}

export function appendCareLog(
  state: CareAppState,
  input: {
    id: string;
    now: string;
    category: CareCategory;
    title: string;
    tags?: string[];
    sourceRoutineId?: string;
    imageUrl?: string;
  },
): CareAppState {
  return {
    ...state,
    logs: [
      ...state.logs,
      {
        id: input.id,
        petId: state.pet.id,
        category: input.category,
        title: input.title,
        occurredAt: input.now,
        tags: input.tags ? [...input.tags] : undefined,
        sourceRoutineId: input.sourceRoutineId,
        imageUrl: input.imageUrl,
      },
    ],
  };
}

export function updateCareLog(
  state: CareAppState,
  input: {
    id: string;
    title: string;
    tags?: string[];
  },
): CareAppState {
  const title = input.title.trim();
  if (!title) return state;

  let didUpdate = false;
  const logs = state.logs.map((log) => {
    if (log.id !== input.id) return log;
    didUpdate = true;
    return {
      ...log,
      title,
      tags: input.tags ? normalizeTags(input.tags) : log.tags,
    };
  });

  return didUpdate ? { ...state, logs } : state;
}

export function deleteCareLog(state: CareAppState, id: string): CareAppState {
  const logs = state.logs.filter((log) => log.id !== id);
  return logs.length === state.logs.length ? state : { ...state, logs };
}

export function addRoutineToState(
  state: CareAppState,
  input: {
    id: string;
    title: string;
    category: CareCategory;
    time: string;
    frequency: Routine['frequency'];
    reminderMinutesBefore: number;
  },
): CareAppState {
  const title = input.title.trim();
  if (!title || !isValidRoutineTime(input.time)) return state;

  return {
    ...state,
    routines: [
      ...state.routines,
      {
        id: input.id,
        petId: state.pet.id,
        title,
        category: input.category,
        time: input.time,
        frequency: input.frequency,
        reminderMinutesBefore: input.reminderMinutesBefore,
      },
    ],
  };
}

export function updateRoutineInState(
  state: CareAppState,
  input: {
    id: string;
    title: string;
    category: CareCategory;
    time: string;
    reminderMinutesBefore: number;
  },
): CareAppState {
  const title = input.title.trim();
  if (!title || !isValidRoutineTime(input.time)) return state;

  let didUpdate = false;
  const routines = state.routines.map((routine) => {
    if (routine.id !== input.id) return routine;
    didUpdate = true;
    return {
      ...routine,
      title,
      category: input.category,
      time: input.time,
      reminderMinutesBefore: input.reminderMinutesBefore,
    };
  });

  return didUpdate ? { ...state, routines } : state;
}

export function deleteRoutineFromState(state: CareAppState, id: string): CareAppState {
  const routines = state.routines.filter((routine) => routine.id !== id);
  return routines.length === state.routines.length ? state : { ...state, routines };
}

export function completeRoutineInState(
  state: CareAppState,
  input: {
    routineId: string;
    id: string;
    now: string;
  },
): CareAppState {
  const routine = state.routines.find((item) => item.id === input.routineId);
  if (!routine) return state;

  const alreadyCompleted = state.logs.some(
    (log) =>
      log.sourceRoutineId === routine.id &&
      log.occurredAt.slice(0, 10) === state.activeDate,
  );

  if (alreadyCompleted) return state;

  return appendCareLog(state, {
    id: input.id,
    now: input.now,
    category: routine.category,
    title: `${routine.title} 완료`,
    tags: [routine.title],
    sourceRoutineId: routine.id,
  });
}

function isValidRoutineTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function normalizeTags(tags: string[]) {
  const normalized = tags.map((tag) => tag.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
}

export function updateNotificationPreferences(
  state: CareAppState,
  nextPreferences: Partial<NotificationPreferences>,
): CareAppState {
  return {
    ...state,
    notificationPreferences: {
      ...state.notificationPreferences,
      ...nextPreferences,
    },
  };
}

export function createCareStateStorage(input: { key: string; storage: StorageLike }) {
  return {
    load(fallback: CareAppState) {
      const raw = input.storage.getItem(input.key);
      if (!raw) return fallback;

      try {
        const parsed = JSON.parse(raw) as CareAppState;
        if (!isCareAppState(parsed)) return fallback;
        return parsed;
      } catch {
        return fallback;
      }
    },
    save(state: CareAppState) {
      input.storage.setItem(input.key, JSON.stringify(state));
    },
  };
}

function isCareAppState(value: unknown): value is CareAppState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CareAppState>;
  return (
    typeof candidate.activeDate === 'string' &&
    Boolean(candidate.pet) &&
    Array.isArray(candidate.routines) &&
    Array.isArray(candidate.logs) &&
    Boolean(candidate.notificationPreferences)
  );
}
