export type CareCategory = 'meal' | 'walk' | 'health' | 'memory';

export type Routine = {
  id: string;
  petId: string;
  title: string;
  category: CareCategory;
  time: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  reminderMinutesBefore: number;
};

export type CareLog = {
  id: string;
  petId: string;
  category: CareCategory;
  title: string;
  occurredAt: string;
  sourceRoutineId?: string;
  tags?: string[];
  imageUrl?: string;
};

export type PetProfile = {
  id: string;
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
};

export type ExpertProfile = {
  id: string;
  name: string;
  kind: 'vet' | 'groomer' | 'trainer' | 'sitter';
  specialties: string[];
  area: string;
  rating: number;
};

export type TimelineItem = {
  id: string;
  petId: string;
  kind: 'routine' | 'log';
  category: CareCategory;
  title: string;
  time: string;
  status: 'due' | 'completed';
  reminderMinutesBefore?: number;
  sourceRoutineId?: string;
  tags?: string[];
};

export type PetNutritionInput = {
  species: string;
  weightKg: number;
  lifeStage: 'puppy' | 'kitten' | 'adult' | 'senior';
  activityLevel: 'low' | 'normal' | 'active';
};

export type ExpertRecommendation = {
  expert: ExpertProfile;
  score: number;
  reason: string;
};

export function buildTodayTimeline(input: {
  date: string;
  routines: Routine[];
  logs: CareLog[];
}): TimelineItem[] {
  const completedRoutineIds = new Set(
    input.logs
      .filter((log) => isSameLocalDate(log.occurredAt, input.date) && log.sourceRoutineId)
      .map((log) => log.sourceRoutineId as string),
  );

  const routineItems = input.routines
    .filter((routine) => isRoutineDueOn(routine, input.date))
    .map<TimelineItem>((routine) => ({
      id: routine.id,
      petId: routine.petId,
      kind: 'routine',
      category: routine.category,
      title: routine.title,
      time: routine.time,
      status: completedRoutineIds.has(routine.id) ? 'completed' : 'due',
      reminderMinutesBefore: routine.reminderMinutesBefore,
    }));

  const logItems = input.logs
    .filter((log) => isSameLocalDate(log.occurredAt, input.date))
    .map<TimelineItem>((log) => ({
      id: log.id,
      petId: log.petId,
      kind: 'log',
      category: log.category,
      title: log.title,
      time: formatTime(log.occurredAt),
      status: 'completed',
      sourceRoutineId: log.sourceRoutineId,
      tags: log.tags,
    }));

  return [...routineItems, ...logItems].sort((left, right) => {
    const byTime = left.time.localeCompare(right.time);
    if (byTime !== 0) return byTime;
    return left.kind.localeCompare(right.kind);
  });
}

export function estimateDailyCalories(input: PetNutritionInput) {
  if (!Number.isFinite(input.weightKg) || input.weightKg <= 0) {
    return {
      minKcal: 0,
      maxKcal: 0,
      note: '체중을 입력하면 하루 권장 칼로리 참고 범위를 계산할 수 있어요.',
    };
  }

  const rer = 70 * input.weightKg ** 0.75;
  const [minFactor, maxFactor] = getCalorieFactor(input);

  return {
    minKcal: Math.round(rer * minFactor),
    maxKcal: Math.round(rer * maxFactor),
    note: getCalorieNote(input),
  };
}

export function recommendExperts(input: {
  pet: PetProfile;
  logs: CareLog[];
  experts: ExpertProfile[];
}): ExpertRecommendation[] {
  const recentSignals = input.logs
    .filter((log) => log.tags && log.tags.length > 0)
    .flatMap((log) =>
      (log.tags ?? []).map((tag) => ({
        tag,
        log,
      })),
    );

  return input.experts
    .map((expert) => {
      const matchingSignals = recentSignals.filter((signal) =>
        expert.specialties.some((specialty) => specialty === signal.tag),
      );

      if (matchingSignals.length === 0) return null;

      const primarySignal = matchingSignals[0];
      const sourceTags = primarySignal.log.tags ?? [primarySignal.tag];
      const categoryBoost =
        primarySignal.log.category === 'health' && expert.kind === 'vet' ? 1 : 0;
      const score = roundOne(expert.rating + matchingSignals.length * 2 + categoryBoost);

      return {
        expert,
        score,
        reason: `최근 ${categoryLabel(primarySignal.log.category)} 기록의 ${sourceTags.join(', ')} 신호와 ${expert.name}의 ${primarySignal.tag} 전문 분야가 맞아요.`,
      };
    })
    .filter((recommendation): recommendation is ExpertRecommendation => recommendation !== null)
    .sort((left, right) => right.score - left.score);
}

export function toIcsCalendar(input: {
  calendarName: string;
  timezone: string;
  routines: Routine[];
  startDate: string;
}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pet Care Mobile Web//Care Calendar//KO',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeIcs(input.calendarName)}`,
    `X-WR-TIMEZONE:${input.timezone}`,
  ];

  for (const routine of input.routines) {
    const dtStart = `${input.startDate.replaceAll('-', '')}T${routine.time.replace(':', '')}00`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${routine.id}@pet-care-mobile-web`,
      `DTSTAMP:${input.startDate.replaceAll('-', '')}T000000Z`,
      `DTSTART;TZID=${input.timezone}:${dtStart}`,
      `SUMMARY:${escapeIcs(routine.title)}`,
      `CATEGORIES:${routine.category.toUpperCase()}`,
      `RRULE:FREQ=${routine.frequency.toUpperCase()}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcs(routine.title)}`,
      `TRIGGER:-PT${routine.reminderMinutesBefore}M`,
      'END:VALARM',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

function isRoutineDueOn(routine: Routine, _date: string) {
  return routine.frequency === 'daily' || routine.frequency === 'weekly' || routine.frequency === 'monthly';
}

function isSameLocalDate(isoDateTime: string, date: string) {
  return isoDateTime.slice(0, 10) === date;
}

function formatTime(isoDateTime: string) {
  const match = isoDateTime.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : '00:00';
}

function getCalorieFactor(input: PetNutritionInput) {
  if (input.species === 'dog' && input.lifeStage === 'adult' && input.activityLevel === 'active') {
    return [1.455, 1.748] as const;
  }

  if (input.lifeStage === 'puppy' || input.lifeStage === 'kitten') return [2.0, 3.0] as const;
  if (input.lifeStage === 'senior') return [1.1, 1.35] as const;
  if (input.activityLevel === 'low') return [1.0, 1.2] as const;
  if (input.activityLevel === 'active') return [1.35, 1.6] as const;
  return [1.2, 1.4] as const;
}

function getCalorieNote(input: PetNutritionInput) {
  if (input.species === 'dog' && input.lifeStage === 'adult' && input.activityLevel === 'active') {
    return '활동량이 높은 성견 기준 참고 범위입니다. 질환, 중성화 여부, 사료 성분에 따라 달라질 수 있어요.';
  }

  return '반려동물의 나이, 활동량, 중성화 여부에 따른 참고 범위입니다. 정확한 급여량은 사료 라벨과 수의사 상담을 함께 확인하세요.';
}

function categoryLabel(category: CareCategory) {
  const labels: Record<CareCategory, string> = {
    meal: '식사',
    walk: '산책',
    health: '건강',
    memory: '추억',
  };
  return labels[category];
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function escapeIcs(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,');
}
