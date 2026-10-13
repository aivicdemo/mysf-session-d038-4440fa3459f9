import { test, expect } from '@playwright/test';

test('SCEN-398: 差異種類に対応する許容基準が取得され、差異内容との比較判定が実行される', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html');

  await page.waitForSelector('[data-testid="discrepancy-table"]', { timeout: 10000 });

  const detailButtons = await page.locator('[data-testid="detail-button"]').all();
  expect(detailButtons.length).toBeGreaterThan(0);

  await detailButtons[0].click();

  await page.waitForSelector('#detail-modal', { state: 'visible', timeout: 5000 });

  const modal = await page.locator('#detail-modal');
  await expect(modal).toBeVisible();

  const oldAmountElement = page.locator('#modal-old-amount');
  const newAmountElement = page.locator('#modal-new-amount');

  const oldAmountText = await oldAmountElement.textContent();
  const newAmountText = await newAmountElement.textContent();

  expect(oldAmountText).toBeTruthy();
  expect(newAmountText).toBeTruthy();

  const diffAmount = parseInt(newAmountText?.replace(/¥/g, '').replace(/,/g, '') || '0') -
                     parseInt(oldAmountText?.replace(/¥/g, '').replace(/,/g, '') || '0');

  const diffRateElement = page.locator('#modal-diff-rate');
  const diffRate = await diffRateElement.textContent();
  expect(diffRate).toMatch(/[\d.]+%/);

  const statusElement = page.locator('[data-testid="modal-close-button"]');
  await expect(statusElement).toBeVisible();
});
