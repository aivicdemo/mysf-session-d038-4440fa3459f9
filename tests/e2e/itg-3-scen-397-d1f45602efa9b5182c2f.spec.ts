import { test, expect } from '@playwright/test';

test('SCEN-397: 選択された差異レコードの詳細情報と旧新システム請求書データが画面に表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html');

  await page.waitForSelector('[data-testid="discrepancy-table"]', { timeout: 10000 });

  const detailButtons = await page.locator('[data-testid="detail-button"]').all();
  expect(detailButtons.length).toBeGreaterThan(0);

  await detailButtons[0].click();

  await page.waitForSelector('#detail-modal', { state: 'visible', timeout: 5000 });

  const invoiceIdElement = page.locator('#modal-invoice-id');
  await expect(invoiceIdElement).toBeVisible();
  const invoiceId = await invoiceIdElement.textContent();
  expect(invoiceId).toBeTruthy();
  expect(invoiceId).not.toBe('-');

  const detectionDateElement = page.locator('#modal-detection-date');
  await expect(detectionDateElement).toBeVisible();
  const detectionDate = await detectionDateElement.textContent();
  expect(detectionDate).toMatch(/\d{4}-\d{2}-\d{2}/);

  const oldAmountElement = page.locator('#modal-old-amount');
  await expect(oldAmountElement).toBeVisible();
  const oldAmount = await oldAmountElement.textContent();
  expect(oldAmount).toMatch(/¥\d+/);

  const newAmountElement = page.locator('#modal-new-amount');
  await expect(newAmountElement).toBeVisible();
  const newAmount = await newAmountElement.textContent();
  expect(newAmount).toMatch(/¥\d+/);

  const diffAmountElement = page.locator('#modal-diff-amount');
  await expect(diffAmountElement).toBeVisible();

  const diffRateElement = page.locator('#modal-diff-rate');
  await expect(diffRateElement).toBeVisible();
  const diffRate = await diffRateElement.textContent();
  expect(diffRate).toMatch(/[\d.]+%/);

  const oldStatusElement = page.locator('#modal-old-status');
  await expect(oldStatusElement).toBeVisible();

  const newStatusElement = page.locator('#modal-new-status');
  await expect(newStatusElement).toBeVisible();

  const modal = page.locator('#detail-modal');
  const boundingBox = await modal.boundingBox();
  expect(boundingBox?.width).toBeGreaterThan(500);
});
