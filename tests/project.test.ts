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

  it('puts main care content before utility controls', () => {
    const component = readFileSync('src/components/mobile-care-app.tsx', 'utf8');

    assert.match(component, /몽이와 오늘 케어/);
    assert.match(component, /우리 아이 프로필/);
    assert.match(component, /오늘의 케어 현황/);
    assert.doesNotMatch(component, /className="pet-select"/);
    assert.doesNotMatch(component, /className="care-room-chip"/);
    assert.doesNotMatch(component, /className="header-icon"/);
  });

  it('uses Lucide only, a single warm primary palette, large cards, and a real pet photo slot', () => {
    const component = readFileSync('src/components/mobile-care-app.tsx', 'utf8');
    const css = readFileSync('src/app/globals.css', 'utf8');

    assert.match(component, /from 'lucide-react'/);
    assert.doesNotMatch(component, /@heroicons|phosphor/);
    assert.match(component, /className="pet-photo"/);
    assert.match(component, /photo-1552053831-71594a27632d/);
    assert.match(css, /--accent-primary/);
    assert.match(css, /--accent-blue: var\(--accent-primary\)/);
    assert.match(css, /--surface-blue: #fff7ef/);
    assert.doesNotMatch(css, /#d8296d|#0f7d5e|#1f7a5e|#345d8a|#244d7a/);
    assert.match(css, /--radius-card: 20px/);
    assert.match(css, /\.soft-metric/);
    assert.match(css, /\.soft-metric strong,[\s\S]*font-size: 16px/);
    assert.match(css, /\.shortcut-grid/);
    assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  });

  it('keeps the mobile home breathable with expanded spacing', () => {
    const css = readFileSync('src/app/globals.css', 'utf8');

    assert.match(css, /\.mobile-shell \{[\s\S]*padding: 18px 16px 120px/);
    assert.match(css, /\.view-stack \{[\s\S]*gap: 18px/);
    assert.match(css, /\.section-block,[\s\S]*\.pet-profile-card \{[\s\S]*padding: 18px/);
    assert.match(css, /\.profile-stats \{[\s\S]*gap: 12px/);
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
});
