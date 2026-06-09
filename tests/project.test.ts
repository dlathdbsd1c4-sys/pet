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

  it('keeps package dependencies free of PWA wrappers', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const dependencyNames = [
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
    ];

    assert.equal(dependencyNames.some((name) => name.includes('next-pwa')), false);
    assert.equal(dependencyNames.some((name) => name.includes('workbox')), false);
  });

  it('keeps the mobile commerce-inspired care shell in place', () => {
    const component = readFileSync('src/components/mobile-care-app.tsx', 'utf8');
    const css = readFileSync('src/app/globals.css', 'utf8');

    assert.match(component, /무엇을 기록할까요/);
    assert.match(component, /오늘 케어 미션/);
    assert.match(component, /추천 케어/);
    assert.match(css, /\.commerce-header/);
    assert.match(css, /\.care-hero/);
    assert.match(css, /\.bottom-tabbar/);
  });

  it('anchors the main screen around pet profile, care status, recent records, and family sharing', () => {
    const component = readFileSync('src/components/mobile-care-app.tsx', 'utf8');
    const css = readFileSync('src/app/globals.css', 'utf8');

    assert.match(component, /우리 아이 프로필/);
    assert.match(component, /오늘의 케어 현황/);
    assert.match(component, /최근 기록/);
    assert.match(component, /가족 공유 현황/);
    assert.match(component, /펫시터 연결/);
    assert.match(component, /동네 병원 정보/);
    assert.match(css, /\.pet-profile-card/);
    assert.match(css, /\.care-status-list/);
    assert.match(css, /\.recent-record-grid/);
    assert.match(css, /\.family-feed/);
  });

  it('uses a cohesive warm visual system and icon-backed action buttons', () => {
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
    assert.match(css, /--accent-coral/);
    assert.match(css, /\.action-button/);
    assert.match(css, /\.action-icon/);
    assert.match(css, /\.surface-action/);
  });
});
