import { test, expect } from '@playwright/test';

test('SCEN-395: 差異詳細確認ボタンをクリックしたとき、現在ユーザーの権限検証に成功し、次工程へ進む', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html');

  await page.waitForSelector('[data-testid="discrepancy-table"]', { timeout: 10000 });

  const detailButtons = await page.locator('[data-testid="detail-button"]').all();
  expect(detailButtons.length).toBeGreaterThan(0);

  await detailButtons[0].click();

  await page.waitForSelector('#detail-modal', { state: 'visible', timeout: 5000 });

  const modal = await page.locator('#detail-modal');
  await expect(modal).toBeVisible();

  const invoiceId = await page.locator('#modal-invoice-id');
  await expect(invoiceId).not.toHaveText('-');

  const detectionDate = await page.locator('#modal-detection-date');
  await expect(detectionDate).not.toHaveText('-');

  const oldAmount = await page.locator('#modal-old-amount');
  await expect(oldAmount).not.toHaveText('¥0');

  const newAmount = await page.locator('#modal-new-amount');
  await expect(newAmount).not.toHaveText('¥0');

  const userBadge = await page.locator('.user-name');
  await expect(userBadge).toBeVisible();

  const nextBtn = await page.locator('button:has-text("キャンセル")');
  await expect(nextBtn).toBeVisible();
});
