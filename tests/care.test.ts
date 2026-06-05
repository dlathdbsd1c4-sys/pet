import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildTodayTimeline,
  estimateDailyCalories,
  recommendExperts,
  toIcsCalendar,
} from '../src/lib/care.ts';

describe('buildTodayTimeline', () => {
  it('combines due routines and care logs in time order with completion status', () => {
    const timeline = buildTodayTimeline({
      date: '2026-05-29',
      routines: [
        {
          id: 'routine-breakfast',
          petId: 'pet-1',
          title: '아침 급여',
          category: 'meal',
          time: '08:00',
          frequency: 'daily',
          reminderMinutesBefore: 10,
        },
        {
          id: 'routine-walk',
          petId: 'pet-1',
          title: '저녁 산책',
          category: 'walk',
          time: '19:00',
          frequency: 'daily',
          reminderMinutesBefore: 30,
        },
      ],
      logs: [
        {
          id: 'log-1',
          petId: 'pet-1',
          category: 'meal',
          title: '아침 급여 완료',
          occurredAt: '2026-05-29T08:05:00+09:00',
          sourceRoutineId: 'routine-breakfast',
        },
        {
          id: 'log-2',
          petId: 'pet-1',
          category: 'memory',
          title: '새 장난감 사진',
          occurredAt: '2026-05-29T14:30:00+09:00',
          tags: ['추억'],
        },
      ],
    });

    assert.deepEqual(
      timeline.map((item) => `${item.kind}:${item.title}:${item.status}:${item.time}`),
      [
        'routine:아침 급여:completed:08:00',
        'log:아침 급여 완료:completed:08:05',
        'log:새 장난감 사진:completed:14:30',
        'routine:저녁 산책:due:19:00',
      ],
    );
  });
});

describe('estimateDailyCalories', () => {
  it('uses pet species, weight, age, and activity to return a rounded reference range', () => {
    const result = estimateDailyCalories({
      species: 'dog',
      weightKg: 8.4,
      lifeStage: 'adult',
      activityLevel: 'active',
    });

    assert.deepEqual(result, {
      minKcal: 503,
      maxKcal: 604,
      note: '활동량이 높은 성견 기준 참고 범위입니다. 질환, 중성화 여부, 사료 성분에 따라 달라질 수 있어요.',
    });
  });
});

describe('recommendExperts', () => {
  it('prioritizes experts whose specialty matches recent care signals and explains why', () => {
    const recommendations = recommendExperts({
      pet: {
        id: 'pet-1',
        name: '몽이',
        species: 'dog',
        breed: '포메라니안',
        birthDate: '2021-03-10',
      },
      logs: [
        {
          id: 'log-health',
          petId: 'pet-1',
          category: 'health',
          title: '피부 가려움 메모',
          occurredAt: '2026-05-27T12:00:00+09:00',
          tags: ['피부', '가려움'],
        },
        {
          id: 'log-walk',
          petId: 'pet-1',
          category: 'walk',
          title: '산책 중 당김 심함',
          occurredAt: '2026-05-28T19:00:00+09:00',
          tags: ['산책', '훈련'],
        },
      ],
      experts: [
        {
          id: 'vet-1',
          name: '초록동물병원',
          kind: 'vet',
          specialties: ['피부', '예방접종'],
          area: '서울 마포',
          rating: 4.8,
        },
        {
          id: 'trainer-1',
          name: '바른산책 트레이닝',
          kind: 'trainer',
          specialties: ['산책', '사회화'],
          area: '서울 마포',
          rating: 4.7,
        },
        {
          id: 'groomer-1',
          name: '몽실미용실',
          kind: 'groomer',
          specialties: ['미용'],
          area: '서울 서대문',
          rating: 4.9,
        },
      ],
    });

    assert.deepEqual(
      recommendations.map((item) => ({
        id: item.expert.id,
        score: item.score,
        reason: item.reason,
      })),
      [
        {
          id: 'vet-1',
          score: 7.8,
          reason: '최근 건강 기록의 피부, 가려움 신호와 초록동물병원의 피부 전문 분야가 맞아요.',
        },
        {
          id: 'trainer-1',
          score: 6.7,
          reason: '최근 산책 기록의 산책, 훈련 신호와 바른산책 트레이닝의 산책 전문 분야가 맞아요.',
        },
      ],
    );
  });
});

describe('toIcsCalendar', () => {
  it('exports recurring care routines as an ICS calendar without PWA assumptions', () => {
    const ics = toIcsCalendar({
      calendarName: '몽이 케어 루틴',
      timezone: 'Asia/Seoul',
      routines: [
        {
          id: 'routine-meds',
          petId: 'pet-1',
          title: '심장사상충 약',
          category: 'health',
          time: '09:30',
          frequency: 'monthly',
          reminderMinutesBefore: 60,
        },
      ],
      startDate: '2026-05-29',
    });

    assert.match(ics, /BEGIN:VCALENDAR/);
    assert.match(ics, /X-WR-CALNAME:몽이 케어 루틴/);
    assert.match(ics, /SUMMARY:심장사상충 약/);
    assert.match(ics, /RRULE:FREQ=MONTHLY/);
    assert.match(ics, /TRIGGER:-PT60M/);
    assert.doesNotMatch(ics, /manifest|service worker|standalone/i);
  });
});
