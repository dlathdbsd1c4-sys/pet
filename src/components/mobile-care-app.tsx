'use client';

import {
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
  Play,
  Plus,
  Stethoscope,
  Store,
  Utensils,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';

import {
  buildTodayTimeline,
  estimateDailyCalories,
  recommendExperts,
  toIcsCalendar,
  type CareCategory,
} from '../lib/care';
import {
  addRoutineToState,
  appendCareLog,
  completeRoutineInState,
  createCareAppState,
  createCareStateStorage,
  updateNotificationPreferences,
} from '../lib/care-state';
import { experts, initialLogs, primaryPet, routines } from '../lib/sample-data';

type TabId = 'today' | 'health' | 'meal' | 'walk' | 'experts';

type WalkPoint = {
  lat: number;
  lng: number;
  capturedAt: string;
};

const today = '2026-05-29';

const tabs: Array<{ id: TabId; label: string; icon: ComponentType<{ size?: number }> }> = [
  { id: 'today', label: '오늘', icon: Bell },
  { id: 'health', label: '건강', icon: HeartPulse },
  { id: 'meal', label: '식사', icon: Utensils },
  { id: 'walk', label: '산책', icon: Footprints },
  { id: 'experts', label: '추천', icon: Stethoscope },
];

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
      detail: '간식 급여를 바로 남겨요',
      icon: Utensils,
      action: () => addLog('meal', '간식 급여', ['간식']),
    },
    {
      id: 'walk-record',
      label: '산책 기록',
      detail: '시간과 거리부터 저장',
      icon: Footprints,
      action: () => setActiveTab('walk'),
    },
    {
      id: 'health-book',
      label: '건강수첩',
      detail: '증상과 투약 기록',
      icon: HeartPulse,
      action: () => setActiveTab('health'),
    },
    {
      id: 'local-care',
      label: '동네 케어',
      detail: '병원과 펫시터 보기',
      icon: Stethoscope,
      action: () => setActiveTab('experts'),
    },
  ];

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
        <header className="calm-header">
          <p>오늘의 케어</p>
          <h1>몽이와 오늘 케어</h1>
          <span>가족이 함께 보는 산책, 식사, 건강 기록</span>
        </header>

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
                <Icon size={19} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {activeTab === 'today' && (
          <div className="view-stack">
            <section className="pet-profile-card" aria-label="우리 아이 프로필">
              <div className="profile-summary">
                <div className="profile-avatar">
                  <img
                    className="pet-photo"
                    src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=320&q=80"
                    alt={`${primaryPet.name} 사진`}
                  />
                </div>
                <div>
                  <p className="eyebrow">우리 아이 프로필</p>
                  <h2>{primaryPet.name}</h2>
                  <p className="profile-meta">
                    {primaryPet.breed} · {primaryPet.weightKg}kg · {primaryPet.sex}
                  </p>
                </div>
              </div>
              <div className="profile-stats" aria-label="프로필 요약">
                <span className="soft-metric">
                  <strong>{completedCareCount}</strong>
                  완료
                </span>
                <span className="soft-metric">
                  <strong>{careState.logs.length}</strong>
                  기록
                </span>
                <span className="soft-metric">
                  <strong>{calorieRange.minKcal}</strong>
                  kcal
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
                {timeline.map((item) => (
                  <article key={`${item.kind}-${item.id}`} className={`timeline-item ${item.status}`}>
                    <span className="time">{item.time}</span>
                    <span className="timeline-icon">{item.status === 'completed' ? <CheckCircle2 size={18} /> : <Circle size={18} />}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{categoryCopy(item.category)}</p>
                    </div>
                    {item.kind === 'routine' && item.status === 'due' && (
                      <button className="small-action action-button" onClick={() => completeRoutine(item.id)} type="button">
                        <span className="action-icon">
                          <CheckCircle2 size={14} />
                        </span>
                        완료
                      </button>
                    )}
                  </article>
                ))}
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
                {careState.routines.map((routine) => (
                  <div key={routine.id} className="notice-row">
                    <span>{routine.time}</span>
                    <strong>{routine.title}</strong>
                    <em>{routine.reminderMinutesBefore}분 전</em>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="view-stack">
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
                {careState.logs
                  .filter((log) => log.category === 'health')
                  .map((log) => (
                    <article key={log.id} className="record-row">
                      <strong>{log.title}</strong>
                      <span>{log.tags?.join(', ')}</span>
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
          </div>
        )}

        {activeTab === 'experts' && (
          <div className="view-stack">
            <section className="section-block">
              <div className="section-title">
                <h2>전문가 추천</h2>
                <Stethoscope size={18} />
              </div>
              <div className="expert-list">
                {expertRecommendations.map((recommendation) => (
                  <article key={recommendation.expert.id} className="expert-row">
                    <div>
                      <strong>{recommendation.expert.name}</strong>
                      <p>{recommendation.reason}</p>
                      <span>{recommendation.expert.area} · 평점 {recommendation.expert.rating}</span>
                    </div>
                    <b>{recommendation.score}</b>
                  </article>
                ))}
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

function categoryCopy(category: CareCategory) {
  const copy: Record<CareCategory, string> = {
    meal: '식사',
    walk: '산책',
    health: '건강',
    memory: '추억',
  };
  return copy[category];
}
