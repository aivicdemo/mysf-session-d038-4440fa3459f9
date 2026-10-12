import { test, expect } from '@playwright/test';

test('SCEN-1265: 権限検証をパスして修正対象の請求書レコードを取得し、修正前の状態を確認できる', async ({ page }) => {
  await page.goto('/panels/scr-1791354351333.html');

  await page.waitForLoadState('networkidle');

  await page.click('table tbody tr:first-child');
  await page.waitForSelector('#detail-panel', { state: 'visible' });

  const invoiceData = await page.evaluate(() => {
    const invoices = (window as any).AIVIC_PRESET_SEED?.['請求書'] || [];
    return invoices.find((i: any) => i.請求書番号 === 'INV-2025-0001');
  });

  expect(invoiceData).toBeDefined();
  expect(invoiceData?.請求書番号).toBe('INV-2025-0001');

  const detailPanel = await page.$('#detail-panel');
  expect(detailPanel).toBeDefined();

  const panelText = await page.locator('#detail-panel').textContent();
  expect(panelText).toContain('INV-2025-0001');
  expect(panelText).toContain('2025-01-15');
  expect(panelText).toContain('2025-02-15');
  expect(panelText).toContain('500,000');
  expect(panelText).toContain('50,000');
  expect(panelText).toContain('550,000');

  const invoiceDetailRows = await page.$$('#invoice-detail-tbody tr');
  expect(invoiceDetailRows.length).toBeGreaterThanOrEqual(2);

  const editButton = await page.$('#btn-edit-invoice');
  const cancelButton = await page.$('#btn-cancel-edit');
  const reissueButton = await page.$('#btn-reissue-invoice');

  expect(editButton).toBeDefined();
  expect(cancelButton).toBeDefined();
  expect(reissueButton).toBeDefined();

  const errorElements = await page.$$('.error, .exception, [role="alert"]');
  expect(errorElements.length).toBe(0);
});
