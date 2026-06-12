'use client';

import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Camera,
  CheckCircle2,
  Circle,
  Footprints,
  HeartPulse,
  MapPin,
  MessageCircle,
  Navigation,
  Pencil,
  Play,
  Plus,
  Save,
  Stethoscope,
  Store,
  Trash2,
  Utensils,
  Users,
  X,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';

import {
  buildTodayTimeline,
  estimateDailyCalories,
  recommendExperts,
  toIcsCalendar,
  type CareCategory,
  type CareLog,
  type Routine,
} from '../lib/care';
import {
  addRoutineToState,
  appendCareLog,
  completeRoutineInState,
  createCareAppState,
  createCareStateStorage,
  deleteCareLog,
  deleteRoutineFromState,
  updateCareLog,
  updateNotificationPreferences,
  updateRoutineInState,
} from '../lib/care-state';
import { experts, initialLogs, primaryPet, routines } from '../lib/sample-data';

type TabId = 'today' | 'health' | 'meal' | 'walk' | 'experts';

type WalkPoint = {
  lat: number;
  lng: number;
  capturedAt: string;
};

const today = '2026-05-29';

function DogBowlIcon({ size = 24, strokeWidth = 2.25 }: { size?: number; strokeWidth?: number }) {
  const navStroke = Math.max(1.9, strokeWidth - 0.2);

  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <path
        d="M5.2 10.8h13.6l-1.15 5.25A3 3 0 0 1 14.72 18.4H9.28a3 3 0 0 1-2.93-2.35L5.2 10.8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={navStroke}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M4.75 10.8h14.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={navStroke}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M10 14.15h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={navStroke}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function DogPawIcon({ size = 24, strokeWidth = 2.25 }: { size?: number; strokeWidth?: number }) {
  const navStroke = Math.max(1.9, strokeWidth - 0.2);

  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <circle
        cx="7.2"
        cy="9.1"
        r="1.55"
        stroke="currentColor"
        strokeWidth={navStroke}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx="12"
        cy="7"
        r="1.6"
        stroke="currentColor"
        strokeWidth={navStroke}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx="16.8"
        cy="9.1"
        r="1.55"
        stroke="currentColor"
        strokeWidth={navStroke}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M8.55 15.85c0-2.35 1.62-4.18 3.45-4.18s3.45 1.83 3.45 4.18c0 1.45-.9 2.35-2.08 2.35-.53 0-.88-.22-1.37-.22s-.84.22-1.37.22c-1.18 0-2.08-.9-2.08-2.35Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={navStroke}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const tabs: Array<{ id: TabId; label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }> }> = [
  { id: 'today', label: '오늘', icon: Bell },
  { id: 'health', label: '건강', icon: HeartPulse },
  { id: 'meal', label: '식사', icon: DogBowlIcon },
  { id: 'walk', label: '산책', icon: DogPawIcon },
  { id: 'experts', label: '동네케어', icon: Store },
];

const detailPageTitles: Record<Exclude<TabId, 'today'>, string> = {
  health: '건강수첩',
  meal: '식사 기록',
  walk: '산책 기록',
  experts: '동네케어',
};

const expertDistances: Record<string, string> = {
  'vet-1': '600m',
  'trainer-1': '850m',
  'groomer-1': '720m',
  'sitter-1': '950m',
};

const initialCareState = createCareAppState({
  activeDate: today,
  pet: primaryPet,
  routines,
  logs: initialLogs,
});

export function MobileCareApp() {
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [careState, setCareState] = useState(initialCareState);
  const [hasLoadedStoredState, setHasLoadedStoredState] = useState(false);
  const [mealAmount, setMealAmount] = useState('70');
  const [walkDistance, setWalkDistance] = useState('1.2');
  const [symptom, setSymptom] = useState('피부 가려움');
  const [memoryTitle, setMemoryTitle] = useState('기분 좋은 오후');
  const [routineTitle, setRoutineTitle] = useState('저녁 산책');
  const [routineTime, setRoutineTime] = useState('19:00');
  const [routineCategory, setRoutineCategory] = useState<CareCategory>('walk');
  const [routineReminder, setRoutineReminder] = useState('30');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingLogTitle, setEditingLogTitle] = useState('');
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editingRoutineDraft, setEditingRoutineDraft] = useState({
    title: '',
    time: '',
    category: 'walk' as CareCategory,
    reminderMinutesBefore: '',
  });
  const [memoryPreview, setMemoryPreview] = useState<string | null>(null);
  const [locationConsent, setLocationConsent] = useState(false);
  const [walkPath, setWalkPath] = useState<WalkPoint[]>([]);
  const [locationMessage, setLocationMessage] = useState('위치 동의 시 GPS 경로를 함께 남길 수 있어요.');
  const storage = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createCareStateStorage({
      key: 'pet-care-mobile-web-state',
      storage: window.localStorage,
    });
  }, []);

  useEffect(() => {
    if (!storage) return;
    setCareState(storage.load(initialCareState));
    setHasLoadedStoredState(true);
  }, [storage]);

  useEffect(() => {
    if (!storage || !hasLoadedStoredState) return;
    storage.save(careState);
  }, [careState, hasLoadedStoredState, storage]);

  const timeline = useMemo(
    () => buildTodayTimeline({ date: careState.activeDate, routines: careState.routines, logs: careState.logs }),
    [careState],
  );
  const calorieRange = useMemo(
    () =>
      estimateDailyCalories({
        species: primaryPet.species,
        weightKg: primaryPet.weightKg,
        lifeStage: primaryPet.lifeStage,
        activityLevel: primaryPet.activityLevel,
      }),
    [],
  );
  const expertRecommendations = useMemo(
    () => recommendExperts({ pet: primaryPet, logs: careState.logs, experts }).slice(0, 3),
    [careState.logs],
  );
  const emailReminder = careState.notificationPreferences.emailEnabled;
  const completedCareCount = 3;
  const todayGoalTotal = 3;
  const detailPageTitle = activeTab === 'today' ? null : detailPageTitles[activeTab];
  const careStatusItems = [
    {
      id: 'walk',
      label: '산책 완료',
      detail: '저녁 산책 1.2km 기록',
      icon: Footprints,
      done: true,
    },
    {
      id: 'meal',
      label: '식사 완료',
      detail: `${mealAmount}g 급여와 물 섭취 확인`,
      icon: Utensils,
      done: true,
    },
    {
      id: 'health',
      label: '약 복용 완료',
      detail: '심장사상충 약 복용 체크',
      icon: HeartPulse,
      done: true,
    },
  ];
  const recentRecordCards = [
    {
      id: 'walk',
      title: '산책',
      description: '20분 · 1.2km · 컨디션 좋음',
      icon: Footprints,
      tab: 'walk' as const,
    },
    {
      id: 'health',
      title: '건강',
      description: symptom,
      icon: HeartPulse,
      tab: 'health' as const,
    },
    {
      id: 'photo',
      title: '사진',
      description: memoryTitle,
      icon: Camera,
      tab: 'experts' as const,
    },
  ];
  const familyUpdates = [
    {
      id: 'mom-walk',
      actor: '엄마',
      action: '산책 기록 추가',
      detail: '동네 공원 20분',
      time: '10분 전',
    },
    {
      id: 'sibling-photo',
      actor: '동생',
      action: '사진 업로드',
      detail: '새 장난감 사진 2장',
      time: '32분 전',
    },
  ];
  const neighborhoodActions = [
    {
      id: 'sitter',
      label: '펫시터 연결',
      description: '가족 일정이 비는 날 맡길 사람 찾기',
      icon: Users,
    },
    {
      id: 'walk-friend',
      label: '산책 친구 찾기',
      description: '같은 동네 산책 루틴 맞추기',
      icon: MessageCircle,
    },
    {
      id: 'local-vet',
      label: '동네 병원 정보',
      description: '최근 건강 기록 기반으로 가까운 병원 보기',
      icon: MapPin,
    },
  ];
  const careShortcutItems = [
    {
      id: 'snack',
      label: '간식',
      detail: '최근 급여 3시간 전',
      icon: Utensils,
      action: () => addLog('meal', '간식 급여', ['간식']),
    },
    {
      id: 'walk-record',
      label: '산책 기록',
      detail: '오늘 1.2km 완료',
      icon: Footprints,
      action: () => setActiveTab('walk'),
    },
    {
      id: 'health-book',
      label: '건강수첩',
      detail: '메모 2건 등록',
      icon: HeartPulse,
      action: () => setActiveTab('health'),
    },
    {
      id: 'local-care',
      label: '동네 케어',
      detail: '근처 병원 3곳',
      icon: Stethoscope,
      action: () => setActiveTab('experts'),
    },
  ];
  const weeklyCareStats = [
    {
      id: 'weekly-walk',
      value: '5회',
      label: '산책 횟수',
      detail: '지난주보다 +2',
    },
    {
      id: 'weekly-meal',
      value: '18건',
      label: '식사 기록',
      detail: '규칙적으로 유지',
    },
    {
      id: 'weekly-health',
      value: '4건',
      label: '건강 기록',
      detail: '메모 안정',
    },
  ];
  const recentHealthRecords = [
    { id: 'health-0608', date: '6/8', title: '피부 상태 양호', detail: '가려움 줄고 컨디션 좋음' },
    { id: 'health-0605', date: '6/5', title: '심장사상충 약 복용', detail: '월간 복약 완료' },
    { id: 'health-0601', date: '6/1', title: '병원 정기 검진', detail: '체중 5.2kg, 특이사항 없음' },
  ];
  const healthStats = [
    { id: 'health-month', value: '12건', label: '이번 달 기록' },
    { id: 'health-medicine', value: '100%', label: '복약 완료율' },
    { id: 'health-visit', value: 'D+7', label: '최근 방문' },
  ];
  const recentMealRecords = [
    { id: 'meal-breakfast', time: '08:00', title: '아침 급여', detail: `${mealAmount}g 완료` },
    { id: 'meal-snack', time: '13:20', title: '점심 간식', detail: '30g, 닭가슴살 큐브' },
    { id: 'meal-dinner', time: '19:30', title: '저녁 급여', detail: '예정 · 권장량 70g' },
  ];
  const mealWeekRecords = ['월', '화', '수', '목', '금'].map((day) => ({
    id: `meal-week-${day}`,
    day,
    done: day !== '금',
  }));
  const walkStats = [
    { id: 'walk-distance', value: '6.4km', label: '이번 주 총 거리' },
    { id: 'walk-time', value: '24분', label: '평균 산책 시간' },
    { id: 'walk-count', value: '5회', label: '산책 횟수' },
  ];
  const recentWalkRecords = [
    { id: 'walk-today', title: '오늘 산책', distance: '1.2km', detail: '23분 · 137kcal 소모' },
    { id: 'walk-yesterday', title: '어제 저녁', distance: '1.4km', detail: '26분 · 동네 공원' },
    { id: 'walk-park', title: '주말 산책', distance: '2.1km', detail: '35분 · 컨디션 좋음' },
  ];
  const localCareRecommendations = [
    { id: 'local-vet', label: '동물병원', detail: '근처 병원 3곳', meta: '야간 진료 1곳', icon: Stethoscope },
    { id: 'local-walk', label: '산책 친구', detail: '반경 1km 5명', meta: '저녁 루틴 맞음', icon: MessageCircle },
    { id: 'local-cafe', label: '애견카페', detail: '평점 높은 4곳', meta: '소형견 구역 있음', icon: Store },
    { id: 'local-shop', label: '펫샵', detail: '사료/간식 매장 6곳', meta: '오늘 영업 중', icon: Store },
    { id: 'local-grooming', label: '미용샵', detail: '예약 가능 2곳', meta: '목욕 패키지 추천', icon: Camera },
    { id: 'local-sitter', label: '펫시터', detail: '검증된 돌봄 4명', meta: '주말 가능', icon: Users },
  ];
  const localCareStats = [
    { id: 'near-vets', value: '3곳', label: '동물병원' },
    { id: 'near-shops', value: '6곳', label: '펫샵' },
    { id: 'near-friends', value: '5명', label: '산책 친구' },
    { id: 'near-sitters', value: '4명', label: '펫시터' },
  ];
  const healthLogs = careState.logs.filter((log) => log.category === 'health').slice().reverse();
  const mealLogs = careState.logs.filter((log) => log.category === 'meal').slice().reverse();
  const walkLogs = careState.logs.filter((log) => log.category === 'walk').slice().reverse();
  const recentCareLogs = careState.logs.slice().reverse().slice(0, 4);

  function addLog(category: CareCategory, title: string, tags: string[] = [], sourceRoutineId?: string) {
    setCareState((current) =>
      appendCareLog(current, {
        id: createLogId(),
        now: createOccurredAt(current.activeDate),
        category,
        title,
        tags,
        sourceRoutineId,
      }),
    );
  }

  function completeRoutine(routineId: string) {
    setCareState((current) =>
      completeRoutineInState(current, {
        routineId,
        id: createLogId(),
        now: createOccurredAt(current.activeDate),
      }),
    );
  }

  function addRoutine() {
    setCareState((current) =>
      addRoutineToState(current, {
        id: createRoutineId(),
        title: routineTitle,
        category: routineCategory,
        time: routineTime,
        frequency: 'daily',
        reminderMinutesBefore: Number(routineReminder) || 0,
      }),
    );
  }

  function startEditingLog(log: CareLog) {
    setEditingLogId(log.id);
    setEditingLogTitle(log.title);
  }

  function cancelEditingLog() {
    setEditingLogId(null);
    setEditingLogTitle('');
  }

  function saveEditingLog(logId: string) {
    if (!editingLogTitle.trim()) return;
    setCareState((current) =>
      updateCareLog(current, {
        id: logId,
        title: editingLogTitle,
      }),
    );
    cancelEditingLog();
  }

  function removeLog(logId: string) {
    setCareState((current) => deleteCareLog(current, logId));
    if (editingLogId === logId) cancelEditingLog();
  }

  function startEditingRoutine(routine: Routine) {
    setEditingRoutineId(routine.id);
    setEditingRoutineDraft({
      title: routine.title,
      time: routine.time,
      category: routine.category,
      reminderMinutesBefore: String(routine.reminderMinutesBefore),
    });
  }

  function cancelEditingRoutine() {
    setEditingRoutineId(null);
    setEditingRoutineDraft({
      title: '',
      time: '',
      category: 'walk',
      reminderMinutesBefore: '',
    });
  }

  function saveEditingRoutine(routineId: string) {
    if (!editingRoutineDraft.title.trim()) return;
    const reminderMinutesBefore = Math.max(0, Number(editingRoutineDraft.reminderMinutesBefore) || 0);

    setCareState((current) =>
      updateRoutineInState(current, {
        id: routineId,
        title: editingRoutineDraft.title,
        category: editingRoutineDraft.category,
        time: editingRoutineDraft.time,
        reminderMinutesBefore,
      }),
    );
    cancelEditingRoutine();
  }

  function removeRoutine(routineId: string) {
    setCareState((current) => deleteRoutineFromState(current, routineId));
    if (editingRoutineId === routineId) cancelEditingRoutine();
  }

  function renderEditableLog(log: CareLog, meta?: string) {
    const isEditing = editingLogId === log.id;

    return (
      <article key={log.id} className={isEditing ? 'record-row editable-record is-editing' : 'record-row editable-record'}>
        {isEditing ? (
          <label className="inline-edit-field">
            <span>기록 제목</span>
            <input value={editingLogTitle} onChange={(event) => setEditingLogTitle(event.target.value)} />
          </label>
        ) : (
          <div className="record-copy">
            <strong>{log.title}</strong>
            <span>{meta ?? logMetaCopy(log)}</span>
          </div>
        )}
        <div className="record-actions">
          {isEditing ? (
            <>
              <button className="mini-action save-action" onClick={() => saveEditingLog(log.id)} type="button">
                <Save size={13} />
                저장
              </button>
              <button className="mini-action ghost-action" onClick={cancelEditingLog} type="button">
                <X size={13} />
                취소
              </button>
            </>
          ) : (
            <>
              <button className="mini-action ghost-action" onClick={() => startEditingLog(log)} type="button">
                <Pencil size={13} />
                수정
              </button>
              <button className="mini-action danger-action" onClick={() => removeLog(log.id)} type="button">
                <Trash2 size={13} />
                삭제
              </button>
            </>
          )}
        </div>
      </article>
    );
  }

  function downloadCalendar() {
    const ics = toIcsCalendar({
      calendarName: `${primaryPet.name} 케어 루틴`,
      timezone: 'Asia/Seoul',
      routines: careState.routines,
      startDate: careState.activeDate,
    });
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${primaryPet.name}-care-routines.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function addGoogleCalendarEvent() {
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.set('action', 'TEMPLATE');
    url.searchParams.set('text', `${primaryPet.name} 저녁 산책`);
    url.searchParams.set('dates', '20260529T100000Z/20260529T103000Z');
    url.searchParams.set('details', '반려동물 통합 케어 웹에서 만든 산책 루틴입니다.');
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  }

  function captureLocation() {
    if (!('geolocation' in navigator)) {
      setLocationMessage('이 브라우저에서는 위치 기록을 지원하지 않아요. 수동 거리 기록은 계속 사용할 수 있어요.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationConsent(true);
        setWalkPath((current) => [
          ...current,
          {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            capturedAt: new Date().toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]);
        setLocationMessage('GPS 지점이 산책 기록에 추가됐어요.');
      },
      () => {
        setLocationConsent(false);
        setLocationMessage('위치 권한이 거부되어 수동 기록으로 저장합니다.');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function handleMemoryFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setMemoryPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <main className="app-canvas">
      <section className="mobile-shell" aria-label="반려동물 통합 케어">
        {activeTab === 'today' ? (
          <header className="calm-header">
            <p>오늘의 케어</p>
            <h1>몽이와 오늘 케어</h1>
            <span>가족이 함께 보는 산책, 식사, 건강 기록</span>
          </header>
        ) : (
          <header className="detail-header">
            <button className="back-button" onClick={() => setActiveTab('today')} type="button">
              <ArrowLeft size={18} />
              뒤로가기
            </button>
            <h1>{detailPageTitle}</h1>
          </header>
        )}

        <nav className="bottom-tabbar" aria-label="케어 메뉴">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={activeTab === tab.id ? 'tab active' : 'tab'}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                <span className="tab-symbol">
                  <Icon size={23} strokeWidth={2.25} />
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {activeTab === 'today' && (
          <div className="view-stack">
            <section className="pet-profile-card pet-hero-card" aria-label="우리 아이 오늘 케어 요약">
              <div className="pet-hero-main">
                <div className="hero-photo-frame">
                  <img
                    className="pet-photo hero-pet-photo"
                    src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=420&q=80"
                    alt={`${primaryPet.name} 사진`}
                  />
                  <span className="completion-badge">
                    <CheckCircle2 size={14} />
                    좋음
                  </span>
                </div>
                <div className="hero-copy-block">
                  <p className="eyebrow">우리 아이 프로필</p>
                  <h2>{primaryPet.name}의 하루가 잘 채워지고 있어요</h2>
                  <p className="pet-mood-copy">오늘 기분 좋아요.</p>
                  <p className="profile-meta">
                    {primaryPet.breed} · {primaryPet.weightKg}kg · {primaryPet.sex}
                  </p>
                </div>
              </div>

              <div className="hero-status-list" aria-label="오늘 상태">
                <p>오늘 상태 좋음</p>
                <ul>
                  <li>
                    <span className="hero-check">
                      <CheckCircle2 size={14} />
                    </span>
                    산책 1.2km 완료
                  </li>
                  <li>
                    <span className="hero-check">
                      <CheckCircle2 size={14} />
                    </span>
                    식사 3회 완료
                  </li>
                  <li>
                    <span className="hero-check">
                      <CheckCircle2 size={14} />
                    </span>
                    건강 상태 양호
                  </li>
                </ul>
              </div>

              <div className="goal-achievement-card" aria-label="오늘 목표 달성 상태">
                <header>
                  <div>
                    <p className="eyebrow">TODAY GOAL</p>
                    <h3>오늘 목표 달성</h3>
                  </div>
                  <strong>
                    {completedCareCount}/{todayGoalTotal} 완료
                  </strong>
                </header>
                <ul>
                  <li>
                    <span className="hero-check">
                      <CheckCircle2 size={14} />
                    </span>
                    산책 1.2km 완료
                  </li>
                  <li>
                    <span className="hero-check">
                      <CheckCircle2 size={14} />
                    </span>
                    식사 완료
                  </li>
                  <li>
                    <span className="hero-check">
                      <CheckCircle2 size={14} />
                    </span>
                    건강 상태 양호
                  </li>
                </ul>
              </div>

              <div className="profile-stats" aria-label="프로필 요약">
                <span className="soft-metric">
                  <strong>{completedCareCount}</strong>
                  <em>완료</em>
                  <small>오늘 목표 달성</small>
                </span>
                <span className="soft-metric">
                  <strong>{careState.logs.length}</strong>
                  <em>기록</em>
                  <small>오늘 작성</small>
                </span>
                <span className="soft-metric">
                  <strong>{calorieRange.minKcal}</strong>
                  <em>kcal</em>
                  <small>권장 범위 내</small>
                </span>
              </div>
              <div className="profile-actions">
                <button onClick={() => setActiveTab('health')} type="button">건강 기록</button>
                <button onClick={() => setActiveTab('experts')} type="button">사진 앨범</button>
              </div>
            </section>

            <section className="section-block care-status-panel" aria-label="오늘의 케어 현황">
              <div className="section-title">
                <div>
                  <p className="eyebrow">TODAY</p>
                  <h2>오늘의 케어 현황</h2>
                </div>
                <span className="section-chip">{completedCareCount}/3 완료</span>
              </div>
              <div className="care-status-list">
                {careStatusItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className={item.done ? 'care-status-item done' : 'care-status-item'}
                      onClick={() => setActiveTab(item.id === 'walk' ? 'walk' : item.id === 'meal' ? 'meal' : 'health')}
                      type="button"
                    >
                      <span className="status-icon">
                        <Icon size={18} />
                      </span>
                      <span>
                        <strong>{item.label}</strong>
                        <em>{item.detail}</em>
                      </span>
                      <CheckCircle2 size={20} />
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="care-shortcuts" aria-label="추천 케어">
              <div className="shortcut-title">
                <h2>추천 케어</h2>
                <span>자주 쓰는 기능</span>
              </div>
              <div className="shortcut-grid">
                {careShortcutItems.map((shortcut) => {
                  const Icon = shortcut.icon;
                  return (
                    <button key={shortcut.id} onClick={shortcut.action} type="button">
                      <span className="shortcut-icon">
                        <Icon size={18} />
                      </span>
                      <strong>{shortcut.label}</strong>
                      <em>{shortcut.detail}</em>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="section-block recent-record-panel" aria-label="최근 기록">
              <div className="section-title">
                <div>
                  <p className="eyebrow">LOG</p>
                  <h2>최근 기록</h2>
                </div>
                <button className="ghost-action" onClick={() => setActiveTab('health')} type="button">
                  전체
                </button>
              </div>
              <div className="recent-record-grid">
                {recentRecordCards.map((record) => {
                  const Icon = record.icon;
                  return (
                    <button key={record.id} onClick={() => setActiveTab(record.tab)} type="button">
                      <Icon size={19} />
                      <strong>{record.title}</strong>
                      <span>{record.description}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="section-block weekly-care-panel" aria-label="이번 주 케어 현황">
              <div className="section-title">
                <div>
                  <p className="eyebrow">WEEK</p>
                  <h2>이번 주 케어 현황</h2>
                </div>
                <span className="section-chip">좋음</span>
              </div>
              <div className="weekly-care-grid">
                {weeklyCareStats.map((stat) => (
                  <article key={stat.id}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                    <em>{stat.detail}</em>
                  </article>
                ))}
              </div>
            </section>

            <section className="section-block family-share-panel" aria-label="가족 공유 현황">
              <div className="section-title">
                <div>
                  <p className="eyebrow">FAMILY</p>
                  <h2>가족 공유 현황</h2>
                </div>
                <MessageCircle size={18} />
              </div>
              <div className="family-feed">
                {familyUpdates.map((update) => (
                  <article key={update.id} className="family-feed-item">
                    <span>{update.actor.slice(0, 1)}</span>
                    <div>
                      <strong>{update.actor}가 {update.action}</strong>
                      <p>{update.detail}</p>
                    </div>
                    <time>{update.time}</time>
                  </article>
                ))}
              </div>
              <div className="neighborhood-grid" aria-label="동네 케어 연결">
                {neighborhoodActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button key={action.id} onClick={() => setActiveTab('experts')} type="button">
                      <Icon size={18} />
                      <strong>{action.label}</strong>
                      <span>{action.description}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="section-block">
              <div className="section-title">
                <h2>오늘 케어 타임라인</h2>
                <button className="surface-action" onClick={() => setActiveTab('today')} type="button">
                  <span className="action-icon">
                    <Plus size={16} />
                  </span>
                  빠른 기록
                </button>
              </div>
              <div className="timeline">
                {timeline.map((item) => {
                  const statusLabel = timelineStatusCopy(item.status);
                  const editableLog = item.kind === 'log' ? careState.logs.find((log) => log.id === item.id) : null;
                  const isEditingTimelineLog = Boolean(editableLog && editingLogId === editableLog.id);
                  return (
                    <article
                      key={`${item.kind}-${item.id}`}
                      className={`timeline-item ${item.status}${isEditingTimelineLog ? ' is-editing' : ''}`}
                    >
                      <span className="time">{item.time}</span>
                      <span className="timeline-icon">{item.status === 'completed' ? <CheckCircle2 size={18} /> : <Circle size={18} />}</span>
                      <div>
                        {isEditingTimelineLog && editableLog ? (
                          <label className="inline-edit-field timeline-edit-field">
                            <span>기록 제목</span>
                            <input value={editingLogTitle} onChange={(event) => setEditingLogTitle(event.target.value)} />
                          </label>
                        ) : (
                          <strong>{timelineTitleWithStatus(item.title, item.status)}</strong>
                        )}
                        <p>{categoryCopy(item.category)} · {statusLabel}</p>
                      </div>
                      <span className={`timeline-status ${item.status}`}>{statusLabel}</span>
                      {item.kind === 'routine' && item.status === 'due' && (
                        <button className="small-action action-button" onClick={() => completeRoutine(item.id)} type="button">
                          <span className="action-icon">
                            <CheckCircle2 size={14} />
                          </span>
                          완료
                        </button>
                      )}
                      {editableLog && (
                        <div className="timeline-actions">
                          {isEditingTimelineLog ? (
                            <>
                              <button className="mini-action save-action" onClick={() => saveEditingLog(editableLog.id)} type="button">
                                <Save size={13} />
                                저장
                              </button>
                              <button className="mini-action ghost-action" onClick={cancelEditingLog} type="button">
                                <X size={13} />
                                취소
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="mini-action ghost-action" onClick={() => startEditingLog(editableLog)} type="button">
                                <Pencil size={13} />
                                수정
                              </button>
                              <button className="mini-action danger-action" onClick={() => removeLog(editableLog.id)} type="button">
                                <Trash2 size={13} />
                                삭제
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="quick-actions" aria-label="빠른 기록">
              <button onClick={() => addLog('meal', '간식 급여', ['간식'])} type="button">
                <Utensils size={18} />
                간식
              </button>
              <button onClick={() => addLog('walk', '짧은 산책', ['산책'])} type="button">
                <Footprints size={18} />
                산책
              </button>
              <button onClick={() => addLog('health', symptom, ['피부', '가려움'])} type="button">
                <HeartPulse size={18} />
                증상
              </button>
              <button onClick={() => addLog('memory', memoryTitle, ['추억'])} type="button">
                <Camera size={18} />
                일지
              </button>
            </section>

            <section className="section-block">
              <div className="section-title">
                <h2>알림 센터</h2>
                <Bell size={18} />
              </div>
              <div className="notice-list">
                <div className="routine-form" aria-label="새 루틴 추가">
                  <label className="compact-field">
                    <span>루틴</span>
                    <input value={routineTitle} onChange={(event) => setRoutineTitle(event.target.value)} />
                  </label>
                  <div className="routine-grid">
                    <label className="compact-field">
                      <span>시간</span>
                      <input type="time" value={routineTime} onChange={(event) => setRoutineTime(event.target.value)} />
                    </label>
                    <label className="compact-field">
                      <span>분류</span>
                      <select value={routineCategory} onChange={(event) => setRoutineCategory(event.target.value as CareCategory)}>
                        <option value="meal">식사</option>
                        <option value="walk">산책</option>
                        <option value="health">건강</option>
                        <option value="memory">추억</option>
                      </select>
                    </label>
                    <label className="compact-field">
                      <span>알림</span>
                      <input inputMode="numeric" value={routineReminder} onChange={(event) => setRoutineReminder(event.target.value)} />
                    </label>
                  </div>
                  <button className="secondary-action action-button" onClick={addRoutine} type="button">
                    <span className="action-icon">
                      <Plus size={18} />
                    </span>
                    루틴 추가
                  </button>
                </div>
                <div className="notice-row">
                  <span>메일</span>
                  <strong>이메일 알림</strong>
                  <button
                    className={emailReminder ? 'toggle-on' : 'toggle-off'}
                    onClick={() =>
                      setCareState((current) =>
                        updateNotificationPreferences(current, {
                          emailEnabled: !current.notificationPreferences.emailEnabled,
                        }),
                      )
                    }
                    type="button"
                  >
                    {emailReminder ? '켜짐' : '꺼짐'}
                  </button>
                </div>
                {careState.routines.map((routine) => {
                  const isEditingRoutine = editingRoutineId === routine.id;

                  return (
                    <div
                      key={routine.id}
                      className={isEditingRoutine ? 'notice-row editable-routine is-editing' : 'notice-row editable-routine'}
                    >
                      {isEditingRoutine ? (
                        <>
                          <label className="inline-edit-field routine-title-field">
                            <span>루틴</span>
                            <input
                              value={editingRoutineDraft.title}
                              onChange={(event) =>
                                setEditingRoutineDraft((current) => ({
                                  ...current,
                                  title: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <div className="routine-edit-grid">
                            <label className="compact-field">
                              <span>시간</span>
                              <input
                                type="time"
                                value={editingRoutineDraft.time}
                                onChange={(event) =>
                                  setEditingRoutineDraft((current) => ({
                                    ...current,
                                    time: event.target.value,
                                  }))
                                }
                              />
                            </label>
                            <label className="compact-field">
                              <span>분류</span>
                              <select
                                value={editingRoutineDraft.category}
                                onChange={(event) =>
                                  setEditingRoutineDraft((current) => ({
                                    ...current,
                                    category: event.target.value as CareCategory,
                                  }))
                                }
                              >
                                <option value="meal">식사</option>
                                <option value="walk">산책</option>
                                <option value="health">건강</option>
                                <option value="memory">추억</option>
                              </select>
                            </label>
                            <label className="compact-field">
                              <span>알림</span>
                              <input
                                inputMode="numeric"
                                value={editingRoutineDraft.reminderMinutesBefore}
                                onChange={(event) =>
                                  setEditingRoutineDraft((current) => ({
                                    ...current,
                                    reminderMinutesBefore: event.target.value,
                                  }))
                                }
                              />
                            </label>
                          </div>
                          <div className="record-actions">
                            <button className="mini-action save-action" onClick={() => saveEditingRoutine(routine.id)} type="button">
                              <Save size={13} />
                              저장
                            </button>
                            <button className="mini-action ghost-action" onClick={cancelEditingRoutine} type="button">
                              <X size={13} />
                              취소
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span>{routine.time}</span>
                          <strong>{routine.title}</strong>
                          <em>{routine.reminderMinutesBefore}분 전</em>
                          <div className="record-actions">
                            <button className="mini-action ghost-action" onClick={() => startEditingRoutine(routine)} type="button">
                              <Pencil size={13} />
                              수정
                            </button>
                            <button className="mini-action danger-action" onClick={() => removeRoutine(routine.id)} type="button">
                              <Trash2 size={13} />
                              삭제
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="view-stack">
            <section className="section-block detail-stat-panel compact-stat-panel" aria-label="건강 통계">
              <div className="detail-stat-grid">
                {healthStats.map((stat) => (
                  <article key={stat.id}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </article>
                ))}
              </div>
            </section>
            <section className="section-block">
              <div className="section-title">
                <h2>건강수첩</h2>
                <HeartPulse size={18} />
              </div>
              <label className="field">
                <span>증상 메모</span>
                <input value={symptom} onChange={(event) => setSymptom(event.target.value)} />
              </label>
              <button className="primary-action action-button" onClick={() => addLog('health', symptom, ['피부', '가려움'])} type="button">
                <span className="action-icon">
                  <Plus size={18} />
                </span>
                기록 추가
              </button>
              <div className="record-list">
                {healthLogs.map((log) => renderEditableLog(log, `${logTimeCopy(log.occurredAt)} · ${log.tags?.join(', ') || '태그 없음'}`))}
              </div>
            </section>
            <section className="section-block">
              <div className="section-title">
                <h2>최근 건강 기록</h2>
                <span className="section-chip">관리 중</span>
              </div>
              <div className="detail-record-list">
                {recentHealthRecords.map((record) => (
                  <article key={record.id} className="detail-record-row">
                    <time>{record.date}</time>
                    <div>
                      <strong>{record.title}</strong>
                      <span>{record.detail}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'meal' && (
          <div className="view-stack">
            <section className="section-block">
              <div className="section-title">
                <h2>식사 기록</h2>
                <Utensils size={18} />
              </div>
              <div className="calorie-band">
                <span>{calorieRange.minKcal}-{calorieRange.maxKcal} kcal</span>
                <p>{calorieRange.note}</p>
              </div>
              <label className="field">
                <span>급여량 g</span>
                <input inputMode="decimal" value={mealAmount} onChange={(event) => setMealAmount(event.target.value)} />
              </label>
              <button className="primary-action action-button" onClick={() => addLog('meal', `사료 ${mealAmount}g 급여`, ['사료', '급여'])} type="button">
                <span className="action-icon">
                  <Utensils size={18} />
                </span>
                급여 추가
              </button>
            </section>
            <section className="section-block">
              <div className="section-title">
                <h2>최근 급여 기록</h2>
                <span className="section-chip">오늘 2/3</span>
              </div>
              <div className="record-list editable-log-list">
                {mealLogs.map((log) => renderEditableLog(log, `${logTimeCopy(log.occurredAt)} · ${log.tags?.join(', ') || '태그 없음'}`))}
              </div>
              <div className="detail-record-list">
                {recentMealRecords.map((record) => (
                  <article key={record.id} className="detail-record-row">
                    <time>{record.time}</time>
                    <div>
                      <strong>{record.title}</strong>
                      <span>{record.detail}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <section className="section-block">
              <div className="section-title">
                <h2>주간 급여 현황</h2>
                <span className="section-chip">규칙적</span>
              </div>
              <div className="week-check-grid">
                {mealWeekRecords.map((record) => (
                  <span key={record.id} className={record.done ? 'done' : ''}>
                    <strong>{record.day}</strong>
                    <em>{record.done ? '완료' : '예정'}</em>
                  </span>
                ))}
              </div>
            </section>
            <section className="recommendation-slot">
              <Store size={18} />
              <div>
                <strong>활동량 높은 성견용 사료 비교</strong>
                <span>무료 운영 후 맥락형 상품 추천 슬롯</span>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'walk' && (
          <div className="view-stack">
            <section className="section-block detail-stat-panel" aria-label="주간 산책 통계">
              <div className="detail-stat-grid">
                {walkStats.map((stat) => (
                  <article key={stat.id}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </article>
                ))}
              </div>
            </section>
            <section className="section-block">
              <div className="section-title">
                <h2>산책 기록</h2>
                <Footprints size={18} />
              </div>
              <label className="field">
                <span>거리 km</span>
                <input inputMode="decimal" value={walkDistance} onChange={(event) => setWalkDistance(event.target.value)} />
              </label>
              <div className="walk-controls">
                <button className="secondary-action action-button" onClick={captureLocation} type="button">
                  <span className="action-icon">
                    <Play size={18} />
                  </span>
                  산책 시작
                </button>
                <button className="primary-action action-button" onClick={() => addLog('walk', `${walkDistance}km 산책`, ['산책', locationConsent ? 'GPS' : '수동'])} type="button">
                  <span className="action-icon">
                    <MapPin size={18} />
                  </span>
                  산책 저장
                </button>
              </div>
              <p className="helper-text">{locationMessage}</p>
              <div className="map-panel">
                <Navigation size={24} />
                <span>{walkPath.length > 0 ? `${walkPath.length}개 위치 지점 기록됨` : '수동 기록 가능'}</span>
              </div>
            </section>
            <section className="section-block">
              <div className="section-title">
                <h2>최근 산책</h2>
                <span className="section-chip">오늘 완료</span>
              </div>
              {walkLogs.length > 0 && (
                <div className="record-list editable-log-list">
                  {walkLogs.map((log) => renderEditableLog(log, `${logTimeCopy(log.occurredAt)} · ${log.tags?.join(', ') || '태그 없음'}`))}
                </div>
              )}
              <div className="walk-record-stack">
                {recentWalkRecords.map((record) => (
                  <article key={record.id}>
                    <div>
                      <strong>{record.title}</strong>
                      <span>{record.detail}</span>
                    </div>
                    <b>{record.distance}</b>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'experts' && (
          <div className="view-stack">
            <section className="section-block detail-stat-panel" aria-label="내 주변 현황">
              <div className="section-title">
                <div>
                  <p className="eyebrow">LOCAL</p>
                  <h2>내 주변 현황</h2>
                </div>
                <span className="section-chip">반경 1km</span>
              </div>
              <div className="local-summary-grid">
                {localCareStats.map((stat) => (
                  <article key={stat.id}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </article>
                ))}
              </div>
            </section>
            <section className="section-block">
              <div className="section-title">
                <h2>동네케어</h2>
                <span className="section-chip">6개 추천</span>
              </div>
              <div className="local-care-grid">
                {localCareRecommendations.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article key={item.id}>
                      <span className="shortcut-icon">
                        <Icon size={18} />
                      </span>
                      <strong>{item.label}</strong>
                      <p>{item.detail}</p>
                      <em>{item.meta}</em>
                    </article>
                  );
                })}
              </div>
            </section>
            <section className="section-block">
              <div className="section-title">
                <h2>최근 케어 기록</h2>
                <Camera size={18} />
              </div>
              <div className="record-list">
                {recentCareLogs.map((log) => renderEditableLog(log))}
              </div>
            </section>
            <section className="section-block">
              <div className="section-title">
                <h2>사진 일지</h2>
                <Camera size={18} />
              </div>
              <label className="field">
                <span>일지 제목</span>
                <input value={memoryTitle} onChange={(event) => setMemoryTitle(event.target.value)} />
              </label>
              <label className="file-picker">
                <Camera size={18} />
                사진 선택
                <input type="file" accept="image/*" onChange={(event) => handleMemoryFile(event.target.files?.[0])} />
              </label>
              {memoryPreview && <img className="memory-preview" src={memoryPreview} alt="선택한 추억 사진 미리보기" />}
            </section>
            <section className="section-block">
              <div className="section-title">
                <h2>동네 케어 추천</h2>
                <Stethoscope size={18} />
              </div>
              <div className="expert-list">
                {expertRecommendations.map((recommendation) => (
                  <article key={recommendation.expert.id} className="expert-row">
                    <div>
                      <strong>{recommendation.expert.name}</strong>
                      <span>
                        {recommendation.expert.area} · 평점 {recommendation.expert.rating} · {expertDistanceCopy(recommendation.expert.id)}
                      </span>
                      <p>{recommendation.reason}</p>
                    </div>
                    <b>{recommendation.score}</b>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        <footer className="calendar-row">
          <button onClick={downloadCalendar} type="button">
            <CalendarDays size={18} />
            ICS
          </button>
          <button onClick={addGoogleCalendarEvent} type="button">
            <CalendarDays size={18} />
            Google
          </button>
        </footer>
      </section>
    </main>
  );
}

function createOccurredAt(activeDate: string) {
  const now = new Date();
  return `${activeDate}T${now.toTimeString().slice(0, 8)}+09:00`;
}

function createLogId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `log-${crypto.randomUUID()}`;
  }

  return `log-${Date.now()}`;
}

function createRoutineId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `routine-${crypto.randomUUID()}`;
  }

  return `routine-${Date.now()}`;
}

function timelineStatusCopy(status: 'due' | 'completed') {
  return status === 'completed' ? '완료' : '예정';
}

function timelineTitleWithStatus(title: string, status: 'due' | 'completed') {
  const statusCopy = timelineStatusCopy(status);
  return title.endsWith(statusCopy) ? title : `${title} ${statusCopy}`;
}

function expertDistanceCopy(expertId: string) {
  return expertDistances[expertId] ?? '1km 이내';
}

function logMetaCopy(log: CareLog) {
  const tags = log.tags?.join(', ') || '태그 없음';
  return `${categoryCopy(log.category)} · ${logTimeCopy(log.occurredAt)} · ${tags}`;
}

function logTimeCopy(occurredAt: string) {
  const time = occurredAt.split('T')[1]?.slice(0, 5);
  return time || '시간 없음';
}

function categoryCopy(category: CareCategory) {
  const copy: Record<CareCategory, string> = {
    meal: '식사',
    walk: '산책',
    health: '건강',
    memory: '추억',
  };
  return copy[category];
}
