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
});
