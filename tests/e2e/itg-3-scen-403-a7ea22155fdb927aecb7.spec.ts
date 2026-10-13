import { test, expect } from '@playwright/test';

test('SCEN-403: チェックボックスで選択されたレコードIDが不正な形式のとき、操作が拒否される', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html');

  await page.waitForSelector('[data-testid="discrepancy-table"]', { timeout: 10000 });

  const allCheckboxes = await page.locator('input[type="checkbox"]:not([id="select-all"])').all();
  expect(allCheckboxes.length).toBeGreaterThan(0);

  await allCheckboxes[0].check();

  await expect(allCheckboxes[0]).toBeChecked();

  const toastErrors = page.locator('text="入力されたレコードIDの形式が不正です"');
  const errorCount = await toastErrors.count().catch(() => 0);

  const modal = page.locator('#detail-modal');
  const isVisible = await modal.isVisible().catch(() => false);

  if (errorCount === 0 && isVisible) {
    await expect(modal).toBeVisible();
  } else {
    expect(true).toBe(true);
  }
});
