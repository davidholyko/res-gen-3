import type { Page } from '@playwright/test';

import { clearResume, expect, test } from './fixtures';

// Visual regression suite (specs/visual-regression-testing.md): screenshot
// assertions over six seeded surfaces, so unintended pixel drift on the
// core UI fails CI with a diff attached.
//
// BASELINES ARE LINUX-CHROMIUM ONLY, GENERATED IN CI — never commit
// baselines rendered on macOS (fonts rasterize differently per-pixel).
// To update after an INTENTIONAL visual change, either:
//   1. Run the "Update visual baselines" workflow on your branch
//      (Actions tab, or `gh workflow run update-screenshots.yml
//      --ref <branch>`) — it reruns this spec with --update-snapshots
//      and pushes a baseline-refresh commit; or
//   2. Download the `test-results` artifact from the failing e2e run and
//      commit each `<name>-actual.png` as
//      `tests/visual.spec.ts-snapshots/<name>-chromium-linux.png`.
// (Option 1 needs the workflow file on the default branch; option 2 is
// the fallback and how the first baselines were bootstrapped.)

// Skip everywhere but Linux unless explicitly opted in (Playwright's
// Docker image is the local escape hatch): running on a Mac would fail
// against the Linux baselines every time, poisoning `pnpm test:e2e`.
test.skip(
  process.platform !== 'linux' && !process.env.RUN_VISUAL,
  'visual baselines are Linux-Chromium only (specs/visual-regression-testing.md)',
);

// The chrome that legitimately differs run-to-run or release-to-release,
// masked out of every shot: the version tag (changes each release), the
// page-count badge (appears after the ~1.75s render debounce), and the
// transient "Saved" indicator.
function chromeMasks(page: Page) {
  return [
    page.locator('header').getByText(/^v\d+\.\d+\.\d+$/),
    page.getByText(/^\d+ pages$/),
    page.getByText('Saved', { exact: true }),
  ];
}

// Screenshots only ever follow font load: a shot raced against a webfont
// swap diffs on text metrics, not real drift.
async function ready(page: Page) {
  await page.evaluate(() => document.fonts.ready);
}

// Seeds a specific resume and reloads so AppProvider re-reads it -- same
// pattern as makeResumeMultiPage.
async function seedResume(page: Page, data: unknown) {
  await page.evaluate(
    (raw) => window.localStorage.setItem('res-gen-data', raw),
    JSON.stringify(data),
  );
  await page.reload();
  await page.waitForSelector('#res-gen', { timeout: 15000 });
}

// A deterministic resume with a two-column layout. `fillRight: false`
// leaves the right half empty -- the blank-half geometry that mirrors
// the PDF (specs/continuous-page-canvas.md, Later change).
function twoColumnResume(fillRight: boolean) {
  const items = [
    {
      contentId: 'v-top',
      contentType: 'HEADER',
      content: { header: 'Top Section' },
      layoutId: 'VL1',
      layoutType: 'SINGLE',
    },
    {
      contentId: 'v-left-h',
      contentType: 'HEADER',
      content: { header: 'Left Column' },
      layoutId: 'VDL',
      layoutType: 'DOUBLE_LEFT',
      layoutParentId: 'VD1',
    },
    {
      contentId: 'v-left-p',
      contentType: 'PARAGRAPH',
      content: { paragraph: 'Left column body text for the visual suite.' },
      layoutId: 'VDL',
      layoutType: 'DOUBLE_LEFT',
      layoutParentId: 'VD1',
    },
  ];
  if (fillRight) {
    items.push({
      contentId: 'v-right-h',
      contentType: 'HEADER',
      content: { header: 'Right Column' },
      layoutId: 'VDR',
      layoutType: 'DOUBLE_RIGHT',
      layoutParentId: 'VD1',
    });
  }
  return {
    layouts: [
      { layoutId: 'VL1', layoutType: 'SINGLE' },
      {
        layoutId: 'VD1',
        layoutType: 'DOUBLE',
        layoutLeftId: 'VDL',
        layoutRightId: 'VDR',
      },
    ],
    items,
  };
}

test.describe('visual regression', () => {
  test('canvas: example resume', async ({ page }) => {
    await ready(page);
    await expect(page).toHaveScreenshot('canvas-example.png', {
      mask: chromeMasks(page),
    });
  });

  test('canvas: two-column layout, both halves filled', async ({ page }) => {
    await seedResume(page, twoColumnResume(true));
    await expect(page.getByText('Right Column')).toBeVisible();
    await ready(page);
    await expect(page).toHaveScreenshot('canvas-two-column.png', {
      mask: chromeMasks(page),
    });
  });

  test('canvas: two-column layout, right half empty', async ({ page }) => {
    await seedResume(page, twoColumnResume(false));
    await expect(page.getByText('Left Column')).toBeVisible();
    await ready(page);
    await expect(page).toHaveScreenshot('canvas-two-column-half.png', {
      mask: chromeMasks(page),
    });
  });

  test('empty-state CTA', async ({ page }) => {
    await clearResume(page);
    await expect(page.getByText('Your resume is empty.')).toBeVisible();
    await ready(page);
    await expect(page).toHaveScreenshot('empty-state.png', {
      mask: chromeMasks(page),
    });
  });

  test('restructure view', async ({ page }) => {
    await page.getByRole('button', { name: 'Restructure' }).click();
    await expect(page.getByLabel('Staging outline')).toBeVisible();
    await ready(page);
    await expect(page).toHaveScreenshot('restructure-view.png', {
      mask: chromeMasks(page),
    });
  });

  test('canvas edit panel docked beside the canvas', async ({ page }) => {
    await page.locator('.layout-single [role="group"]').first().click();
    await expect(page.locator('#canvas-edit-panel')).toBeVisible();
    await ready(page);
    await expect(page).toHaveScreenshot('canvas-edit-panel.png', {
      mask: chromeMasks(page),
    });
  });

  test('PDF view shell (preview frames masked)', async ({ page }) => {
    await page.getByRole('button', { name: 'PDF' }).click();
    await expect(page.getByTestId('pdf-view')).toBeVisible();
    // Wait for the real frame so the shot is past the "Generating…"
    // placeholder; the frames themselves are masked -- their pixels are
    // the browser plugin's, not ours -- so only the view's own chrome is
    // asserted (specs/visual-regression-testing.md, resolved question).
    await expect(
      page.locator('[data-testid="pdf-frame-visible"]'),
    ).toBeVisible({ timeout: 10000 });
    await ready(page);
    await expect(page).toHaveScreenshot('pdf-view-shell.png', {
      mask: [...chromeMasks(page), page.locator('iframe')],
    });
  });
});
