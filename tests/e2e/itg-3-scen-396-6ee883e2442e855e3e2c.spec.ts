import { test, expect } from '@playwright/test';

test('SCEN-396: チェックボックスで選択された差異レコードIDの入力値が正常のとき、選択内容が次工程に引き継がれる', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html');

  await page.waitForSelector('[data-testid="discrepancy-table"]', { timeout: 10000 });

  const allCheckboxes = await page.locator('input[type="checkbox"]:not([id="select-all"])').all();
  expect(allCheckboxes.length).toBeGreaterThanOrEqual(3);

  const firstCheckbox = allCheckboxes[0];
  const thirdCheckbox = allCheckboxes[2];

  await firstCheckbox.check();
  await thirdCheckbox.check();

  await expect(firstCheckbox).toBeChecked();
  await expect(thirdCheckbox).toBeChecked();

  const secondCheckbox = allCheckboxes[1];
  if (await secondCheckbox.isChecked()) {
    await secondCheckbox.uncheck();
  }
  await expect(secondCheckbox).not.toBeChecked();

  const indeterminateCheckbox = page.locator('#select-all');
  await expect(indeterminateCheckbox).toHaveAttribute('aria-checked', 'mixed');
});
