import type { CareLog, ExpertProfile, PetProfile, Routine } from './care';

export const primaryPet: PetProfile & {
  sex: string;
  weightKg: number;
  lifeStage: 'puppy' | 'kitten' | 'adult' | 'senior';
  activityLevel: 'low' | 'normal' | 'active';
} = {
  id: 'pet-1',
  name: '몽이',
  species: 'dog',
  breed: '포메라니안',
  birthDate: '2021-03-10',
  sex: '남아',
  weightKg: 8.4,
  lifeStage: 'adult',
  activityLevel: 'active',
};

export const routines: Routine[] = [
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
  {
    id: 'routine-meds',
    petId: 'pet-1',
    title: '심장사상충 약',
    category: 'health',
    time: '09:30',
    frequency: 'monthly',
    reminderMinutesBefore: 60,
  },
];

export const initialLogs: CareLog[] = [
  {
    id: 'log-1',
    petId: 'pet-1',
    category: 'meal',
    title: '아침 급여 완료',
    occurredAt: '2026-05-29T08:05:00+09:00',
    sourceRoutineId: 'routine-breakfast',
    tags: ['사료', '급여'],
  },
  {
    id: 'log-2',
    petId: 'pet-1',
    category: 'health',
    title: '피부 가려움 메모',
    occurredAt: '2026-05-29T12:20:00+09:00',
    tags: ['피부', '가려움'],
  },
  {
    id: 'log-3',
    petId: 'pet-1',
    category: 'memory',
    title: '새 장난감 사진',
    occurredAt: '2026-05-29T14:30:00+09:00',
    tags: ['추억'],
  },
];

export const experts: ExpertProfile[] = [
  {
    id: 'vet-1',
    name: '초록동물병원',
    kind: 'vet',
    specialties: ['피부', '예방접종', '투약'],
    area: '서울 마포',
    rating: 4.8,
  },
  {
    id: 'trainer-1',
    name: '바른산책 트레이닝',
    kind: 'trainer',
    specialties: ['산책', '사회화', '훈련'],
    area: '서울 마포',
    rating: 4.7,
  },
  {
    id: 'groomer-1',
    name: '몽실미용실',
    kind: 'groomer',
    specialties: ['미용', '피부'],
    area: '서울 서대문',
    rating: 4.9,
  },
  {
    id: 'sitter-1',
    name: '우리동네 펫시터',
    kind: 'sitter',
    specialties: ['노령견', '투약', '산책'],
    area: '서울 마포',
    rating: 4.6,
  },
];
