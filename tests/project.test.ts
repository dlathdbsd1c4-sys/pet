import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('mobile browser delivery', () => {
  it('does not include PWA manifest or service worker artifacts', () => {
    const forbiddenFiles = [
      'public/manifest.json',
      'public/manifest.webmanifest',
      'public/sw.js',
      'src/app/manifest.ts',
      'src/app/manifest.tsx',
    ];

    assert.deepEqual(
      forbiddenFiles.filter((file) => existsSync(file)),
      [],
    );
  });

  it('keeps package dependencies free of PWA wrappers and alternate icon packs', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const dependencyNames = [
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
    ];

    assert.equal(dependencyNames.some((name) => name.includes('next-pwa')), false);
    assert.equal(dependencyNames.some((name) => name.includes('workbox')), false);
    assert.equal(dependencyNames.some((name) => name.includes('heroicons')), false);
    assert.equal(dependencyNames.some((name) => name.includes('phosphor')), false);
  });

  it('ships a dependency-free static preview for local browser review', () => {
    const previewHtml = readFileSync('preview.html', 'utf8');
    const previewServer = readFileSync('preview-server.mjs', 'utf8');

    assert.match(previewHtml, /반려동물 통합 케어/);
    assert.match(previewHtml, /data-tab="meal"/);
    assert.match(previewHtml, /data-tab="walk"/);
    assert.match(previewHtml, /stroke="currentColor"/);
    assert.match(previewHtml, /<div class="shortcut-grid">/);
    assert.match(previewHtml, /<div class="week-check-grid">/);
    assert.match(previewHtml, /<div class="walk-record-stack">/);
    assert.match(previewHtml, /class="hero-status-list"/);
    assert.match(previewHtml, /class="goal-achievement-card"/);
    assert.match(previewHtml, /D\+7<\/strong><span>최근 방문<\/span>/);
    assert.match(previewHtml, /4\.8 · 600m/);
    assert.match(previewHtml, /4\.7 · 850m/);
    assert.match(previewServer, /createServer/);
    assert.doesNotMatch(previewHtml, /class="progress-ring"/);
    assert.doesNotMatch(previewHtml, /manifest|serviceWorker|service worker/i);
  });

  it('puts main care content before utility controls', () => {
    const component = readFileSync('src/components/mobile-care-app.tsx', 'utf8');

    assert.match(component, /몽이와 오늘 케어/);
    assert.match(component, /우리 아이 프로필/);
    assert.match(component, /오늘의 케어 현황/);
    assert.match(component, /오늘 상태 좋음/);
    assert.match(component, /산책 1\.2km 완료/);
    assert.match(component, /식사 3회 완료/);
    assert.match(component, /건강 상태 양호/);
    assert.match(component, /className="pet-profile-card pet-hero-card"/);
    assert.match(component, /오늘 목표 달성/);
    assert.match(component, /\{completedCareCount\}\/\{todayGoalTotal\} 완료/);
    assert.match(component, /className="hero-status-list"/);
    assert.match(component, /className="goal-achievement-card"/);
    assert.doesNotMatch(component, /className="progress-ring"/);
    assert.doesNotMatch(component, /heroProgressStyle/);
    assert.doesNotMatch(component, /todayGoalProgress/);
    assert.match(component, /className="detail-header"/);
    assert.match(component, /className="back-button"/);
    assert.match(component, /뒤로가기/);
    assert.match(component, /label: '오늘'/);
    assert.match(component, /label: '동네케어'/);
    assert.match(component, /experts: '동네케어'/);
    assert.match(component, /icon: Bell/);
    assert.match(component, /icon: HeartPulse/);
    assert.match(component, /\{ id: 'meal', label: '식사', icon: DogBowlIcon \}/);
    assert.match(component, /\{ id: 'walk', label: '산책', icon: DogPawIcon \}/);
    assert.match(component, /function DogBowlIcon/);
    assert.match(component, /function DogPawIcon/);
    assert.match(component, /vectorEffect="non-scaling-stroke"/);
    assert.match(component, /icon: Store/);
    assert.match(component, /className="tab-symbol"/);
    assert.doesNotMatch(component, /\{ id: 'meal', label: '식사', icon: Utensils \}/);
    assert.doesNotMatch(component, /\{ id: 'walk', label: '산책', icon: Grip \}/);
    assert.doesNotMatch(component, /PawPrint/);
    assert.doesNotMatch(component, /mark: '⌂'|mark: '♡'|mark: '⋔'|mark: '⌁'|mark: '⌖'/);
    assert.doesNotMatch(component, /emoji: '🏠'|emoji: '🩺'|emoji: '🍽️'|emoji: '🐾'|emoji: '📍'/);
    assert.doesNotMatch(component, /🎉|🏠|🩺|🍽️|🐾|📍/);
    assert.doesNotMatch(component, /className="pet-select"/);
    assert.doesNotMatch(component, /className="care-room-chip"/);
    assert.doesNotMatch(component, /className="header-icon"/);
  });

  it('uses Lucide only, a single warm primary palette, large cards, and a real pet photo slot', () => {
    const component = readFileSync('src/components/mobile-care-app.tsx', 'utf8');
    const css = readFileSync('src/app/globals.css', 'utf8');

    assert.match(component, /from 'lucide-react'/);
    assert.doesNotMatch(component, /@heroicons|phosphor/);
    assert.match(component, /className="pet-photo hero-pet-photo"/);
    assert.match(component, /photo-1552053831-71594a27632d/);
    assert.match(css, /--bg-app: #f8f4ef/);
    assert.match(css, /--ink: #2d2a26/);
    assert.match(css, /--accent-primary: #e88a73/);
    assert.match(css, /--shadow-soft: 0 4px 12px rgba\(0, 0, 0, 0\.04\)/);
    assert.match(css, /--accent-blue: var\(--accent-primary\)/);
    assert.match(css, /--surface-blue: #fff7f2/);
    assert.doesNotMatch(css, /#d8296d|#0f7d5e|#1f7a5e|#345d8a|#244d7a/);
    assert.match(css, /--radius-card: 20px/);
    assert.match(css, /\.soft-metric/);
    assert.match(css, /\.pet-hero-card \.profile-stats strong \{[\s\S]*font-size: 26px/);
    assert.match(css, /\.hero-status-list \{[\s\S]*border-radius: var\(--radius-card\)/);
    assert.match(css, /\.goal-achievement-card \{[\s\S]*border-radius: var\(--radius-card\)/);
    assert.doesNotMatch(css, /\.progress-ring \{/);
    assert.match(css, /\.shortcut-grid/);
    assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    assert.match(css, /\.shortcut-grid button \{[\s\S]*height: 138px/);
    assert.match(css, /\.tab\.active \{[\s\S]*background: var\(--accent-primary-soft\)/);
    assert.match(css, /\.detail-stat-grid/);
    assert.match(css, /\.local-care-grid/);
    assert.match(css, /\.local-summary-grid/);
    assert.match(css, /\.compact-stat-panel \.detail-stat-grid article/);
    assert.match(css, /\.tab-symbol/);
    assert.match(css, /\.tab svg/);
    assert.match(css, /\.timeline-status/);
    assert.match(css, /grid-template-columns: 44px 24px 1fr auto auto/);
    assert.match(css, /border-radius: 28px 28px 0 0/);
    assert.match(css, /min-height: 72px/);
    assert.doesNotMatch(css, /\.tab-emoji/);
    assert.doesNotMatch(css, /\.tab-line-mark/);
  });

  it('keeps the mobile home breathable with expanded spacing', () => {
    const css = readFileSync('src/app/globals.css', 'utf8');

    assert.match(css, /\.mobile-shell \{[\s\S]*padding: 20px 16px 124px/);
    assert.match(css, /\.view-stack \{[\s\S]*gap: 30px/);
    assert.match(css, /\.section-block,[\s\S]*\.pet-profile-card \{[\s\S]*padding: 18px/);
    assert.match(css, /\.care-status-list,[\s\S]*\.family-feed \{[\s\S]*gap: 20px/);
    assert.match(css, /\.shortcut-grid \{[\s\S]*gap: 20px/);
    assert.match(css, /\.recent-record-grid,[\s\S]*\.quick-actions \{[\s\S]*gap: 14px/);
    assert.match(css, /\.walk-controls \{[\s\S]*margin: 14px 0 16px/);
    assert.match(css, /\.walk-controls \+ \.helper-text \{[\s\S]*margin: 0 0 18px/);
    assert.match(css, /\.walk-controls \+ \.map-panel \{[\s\S]*margin-top: 18px/);
    assert.match(css, /\.map-panel \{[\s\S]*border: 1px dashed rgba\(232, 138, 115, 0\.28\);[\s\S]*background: var\(--accent-primary-soft\);[\s\S]*color: var\(--accent-primary\);/);
    assert.match(css, /\.hero-status-list \{[\s\S]*padding: 16px/);
    assert.match(css, /\.goal-achievement-card \{[\s\S]*padding: 16px/);
    assert.match(css, /\.shortcut-grid button \{[\s\S]*padding: 20px/);
    assert.match(css, /\.shortcut-grid button em \{[\s\S]*line-height: 1\.5/);
    assert.match(componentFixture(), /이번 주 케어 현황/);
    assert.match(css, /\.weekly-care-grid/);
  });

  it('keeps icon-backed action buttons consistent', () => {
    const component = readFileSync('src/components/mobile-care-app.tsx', 'utf8');
    const css = readFileSync('src/app/globals.css', 'utf8');

    assert.match(component, /className="surface-action"/);
    assert.match(component, /className="primary-action action-button"/);
    assert.match(component, /className="secondary-action action-button"/);
    assert.match(component, /className="action-icon"/);
    assert.match(component, /빠른 기록/);
    assert.match(component, /기록 추가/);
    assert.match(component, /산책 시작/);
    assert.match(component, /급여 추가/);
    assert.match(css, /\.action-button/);
    assert.match(css, /\.action-icon/);
    assert.match(css, /\.surface-action/);
  });

  it('fills detail pages with service-like data sections', () => {
    const component = readFileSync('src/components/mobile-care-app.tsx', 'utf8');

    assert.match(component, /최근 건강 기록/);
    assert.match(component, /6\/8/);
    assert.match(component, /복약 완료율/);
    assert.match(component, /label: '최근 방문'/);
    assert.match(component, /최근 급여 기록/);
    assert.match(component, /주간 급여 현황/);
    assert.match(component, /최근 산책/);
    assert.match(component, /className="walk-record-stack"/);
    assert.match(component, /className="week-check-grid"/);
    assert.match(component, /이번 주 총 거리/);
    assert.match(component, /오늘 기분 좋아요/);
    assert.match(component, /timelineStatusCopy/);
    assert.match(component, /timelineTitleWithStatus/);
    assert.match(component, /className=\{`timeline-status \$\{item\.status\}`\}/);
    assert.match(component, /내 주변 현황/);
    assert.match(component, /반경 1km/);
    assert.match(component, /localCareStats/);
    assert.match(component, /className="local-summary-grid"/);
    assert.match(component, /동물병원/);
    assert.match(component, /산책 친구/);
    assert.match(component, /애견카페/);
    assert.match(component, /펫샵/);
    assert.match(component, /미용샵/);
    assert.match(component, /펫시터/);
    assert.match(component, /expertDistanceCopy/);
    assert.match(component, /평점 \{recommendation\.expert\.rating\} · \{expertDistanceCopy\(recommendation\.expert\.id\)\}/);
    assert.match(component, /className="local-care-grid"/);
  });
});

function componentFixture() {
  return readFileSync('src/components/mobile-care-app.tsx', 'utf8');
}
