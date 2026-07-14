import { describe, expect, it } from 'vitest';

import { basePath } from './base-path';

describe('basePath', () => {
  it('matches the GitHub Pages project-page path', () => {
    expect(basePath).toBe('/res-gen-3');
  });
});
