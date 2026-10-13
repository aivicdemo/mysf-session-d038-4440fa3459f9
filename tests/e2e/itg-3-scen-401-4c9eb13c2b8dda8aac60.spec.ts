import { test, expect } from '@playwright/test';

test('SCEN-401: 判定結果（許容範囲判定・判定日時・判定者）を含む詳細情報が画面に表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html');

  await page.waitForSelector('[data-testid="discrepancy-table"]', { timeout: 10000 });

  const detailButtons = await page.locator('[data-testid="detail-button"]').all();
  expect(detailButtons.length).toBeGreaterThan(0);

  await detailButtons[0].click();

  await page.waitForSelector('#detail-modal', { state: 'visible', timeout: 5000 });

  const modal = await page.locator('#detail-modal');
  await expect(modal).toBeVisible();

  const invoiceIdElement = page.locator('#modal-invoice-id');
  await expect(invoiceIdElement).toBeVisible();
  const invoiceId = await invoiceIdElement.textContent();
  expect(invoiceId).toBeTruthy();
  expect(invoiceId).not.toBe('-');

  const detectionDateElement = page.locator('#modal-detection-date');
  await expect(detectionDateElement).toBeVisible();
  const detectionDate = await detectionDateElement.textContent();
  expect(detectionDate).toMatch(/\d{4}-\d{2}-\d{2}/);

  const oldStatusElement = page.locator('#modal-old-status');
  await expect(oldStatusElement).toBeVisible();
  const oldStatus = await oldStatusElement.textContent();
  expect(oldStatus).toBeTruthy();

  const newStatusElement = page.locator('#modal-new-status');
  await expect(newStatusElement).toBeVisible();
  const newStatus = await newStatusElement.textContent();
  expect(newStatus).toBeTruthy();

  const userNameElement = page.locator('.user-name');
  await expect(userNameElement).toBeVisible();
});
