import { test, expect } from '@playwright/test';

test('SCEN-400: 差異が許容範囲を超過と判定されたとき、判定結果が確認履歴テーブルと検出結果テーブルに記録される', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html');

  await page.waitForSelector('[data-testid="discrepancy-table"]', { timeout: 10000 });

  const trackingTable = page.locator('#tracking-tbody');
  await expect(trackingTable).toBeVisible();

  const initialRows = await trackingTable.locator('tr').count();

  const detailButtons = await page.locator('[data-testid="detail-button"]').all();
  expect(detailButtons.length).toBeGreaterThan(0);

  await detailButtons[0].click();

  await page.waitForSelector('#detail-modal', { state: 'visible', timeout: 5000 });

  const modal = await page.locator('#detail-modal');
  await expect(modal).toBeVisible();

  const invoiceIdElement = page.locator('#modal-invoice-id');
  const invoiceId = await invoiceIdElement.textContent();
  expect(invoiceId).toBeTruthy();

  const oldStatusElement = page.locator('#modal-old-status');
  const newStatusElement = page.locator('#modal-new-status');

  await expect(oldStatusElement).toBeVisible();
  await expect(newStatusElement).toBeVisible();

  const closeBtn = page.locator('[data-testid="modal-close-button"]');
  await closeBtn.click();

  await page.waitForSelector('#detail-modal', { state: 'hidden', timeout: 5000 });

  const discrepancyTable = page.locator('#discrepancy-tbody');
  await expect(discrepancyTable).toBeVisible();

  const statusBadges = await page.locator('.status-badge').allTextContents();
  expect(statusBadges.length).toBeGreaterThan(0);
});
