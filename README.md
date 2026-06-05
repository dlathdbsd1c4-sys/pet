# 반려동물 통합 케어 모바일 웹

모바일 브라우저에서 바로 접속해 반려동물의 건강, 산책, 식사, 추억을 관리하는 Next.js 기반 MVP입니다. PWA 설치, 오프라인 앱 모드, 서비스 워커, 홈 화면 설치 유도는 포함하지 않습니다.

## 주요 기능

- 오늘 케어 타임라인: 루틴, 완료 처리, 빠른 기록
- 건강수첩: 증상/접종/투약/병원 방문 기록 기반
- 식사: 급여 루틴, 급여량, 칼로리 참고 범위
- 산책: 수동 거리 기록, 위치 동의 시 GPS 지점 기록
- 추억: 사진 선택과 짧은 일지
- 추천: 케어 이력 태그 기반 전문가 추천 사유
- 알림: 앱 내 알림 센터, 이메일 알림 설정, `.ics` 다운로드와 Google Calendar 템플릿 링크

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 모바일 웹 화면을 확인할 수 있습니다.

## 환경 변수

`.env.example`을 `.env.local`로 복사하고 Supabase 값을 채웁니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_CALENDAR_CLIENT_ID=
```

현재 화면은 샘플 데이터로 동작하며, Supabase 연결 값이 있을 때 `src/lib/supabase-client.ts`를 통해 브라우저 클라이언트를 만들 수 있습니다.

## Supabase

`supabase/schema.sql`에는 Auth 사용자 기준의 개인 케어 공간, 향후 가족 공유를 위한 멤버십, 반려동물/루틴/로그/사진/전문가 추천 테이블과 RLS 정책이 포함되어 있습니다.

Supabase SQL editor에서 적용하기 전에 프로젝트의 Data API 노출 범위와 Storage 정책을 확인하세요. RLS는 `auth.uid()`와 `care_space_members`를 기준으로 하며, 사용자 수정 가능한 `user_metadata`를 권한 판단에 사용하지 않습니다.

## 검증

```bash
npm test
npm run typecheck
npm run build
```

현재 개발 환경에 `npm`이 없을 경우 Codex 번들 Node로 도메인 테스트만 실행할 수 있습니다.

```powershell
& 'C:\Users\lianf\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/*.test.ts
```

## 참고 공식 문서

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Auth Users](https://supabase.com/docs/guides/auth/users)
- [Google Calendar Events](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert)
