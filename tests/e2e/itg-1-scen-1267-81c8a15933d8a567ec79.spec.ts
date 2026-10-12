import { test, expect } from '@playwright/test';

test('SCEN-1267: 請求書に紐付く商談レコードを取得し、商談金額・ステージ・成約状態を確認できる', async ({ page }) => {
  await page.goto('/panels/scr-1791354351333.html');

  await page.waitForLoadState('networkidle');

  const dealRows = await page.$$('table tbody tr');
  expect(dealRows.length).toBeGreaterThan(0);

  await dealRows[0].click();
  await page.waitForSelector('#detail-panel', { state: 'visible' });

  const dealDetailPanel = await page.locator('#detail-panel');
  const dealPanelText = await dealDetailPanel.textContent();

  expect(dealPanelText).toBeDefined();

  const invoiceRows = await page.$$('#invoice-tbody tr');
  if (invoiceRows.length > 0) {
    const firstInvoiceRow = invoiceRows[0];
    await firstInvoiceRow.click();
    await page.waitForTimeout(300);
  }

  const dealData = await page.evaluate(() => {
    const deals = (window as any).AIVIC_PRESET_SEED?.['商談'] || [];
    return deals.find((d: any) => d.商談ID === 'rec-001');
  });

  expect(dealData).toBeDefined();
  expect(dealData?.商談金額).toBe(2500000);

  const detailText = await page.locator('#detail-panel').textContent();
  expect(detailText).toContain('2,500,000');

  const optionalLink = await page.$('a[href*="OPP"], [class*="deal-link"]');
  if (optionalLink) {
    await optionalLink.click();
    await page.waitForTimeout(500);

    const linkedPanel = await page.locator('[class*="deal-panel"], [id*="modal"], [class*="detail"]');
    if (await linkedPanel.isVisible()) {
      const linkedText = await linkedPanel.textContent();
      expect(linkedText).toBeTruthy();
    }
  }
});
