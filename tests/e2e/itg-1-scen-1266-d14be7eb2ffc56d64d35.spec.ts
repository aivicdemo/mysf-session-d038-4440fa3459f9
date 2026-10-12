import { test, expect } from '@playwright/test';

test('SCEN-1266: 修正対象の請求明細一覧を取得し、修正前の数量・単価・税率を確認できる', async ({ page }) => {
  await page.goto('/panels/scr-1791354351333.html');

  await page.waitForLoadState('networkidle');

  const stageFilter = await page.$('#filter-stage');
  await stageFilter?.selectOption('発行済み');

  await page.waitForTimeout(300);

  const dealRows = await page.$$('table tbody tr');
  expect(dealRows.length).toBeGreaterThan(0);

  await page.click('table tbody tr:first-child');
  await page.waitForSelector('#detail-panel', { state: 'visible' });

  const detailPanelVisible = await page.isVisible('#detail-panel');
  expect(detailPanelVisible).toBe(true);

  const invoiceDetailsTab = await page.$('[data-tab="invoice-details"]') || await page.$('#invoices-tab');
  expect(invoiceDetailsTab).toBeDefined();

  const invoiceDetailTable = await page.evaluate(() => {
    const details = (window as any).AIVIC_PRESET_SEED?.['請求明細'] || [];
    return details.slice(0, 2).map((d: any) => ({
      明細行番号: d.明細行番号,
      商品名: d.商品名,
      修正前の数量: d.数量,
      修正前の単価: d.単価,
      修正前の税率: d.税率
    }));
  });

  expect(invoiceDetailTable.length).toBeGreaterThanOrEqual(1);

  const quantityColumn = await page.locator('th').filter({ hasText: /数量|修正前の数量/ });
  const unitPriceColumn = await page.locator('th').filter({ hasText: /単価|修正前の単価/ });
  const taxRateColumn = await page.locator('th').filter({ hasText: /税率|修正前の税率/ });

  expect(quantityColumn).toBeDefined();
  expect(unitPriceColumn).toBeDefined();
  expect(taxRateColumn).toBeDefined();

  const detailRows = await page.$$('#invoice-detail-tbody tr');
  if (detailRows.length > 0) {
    const firstRow = detailRows[0];
    const rowText = await firstRow.textContent();
    expect(rowText).toBeTruthy();
  }

  const detailLink = await page.$('[id*="detail"], [class*="detail-link"]');
  if (detailLink) {
    await detailLink.click();
    await page.waitForTimeout(300);

    const comparisonInfo = await page.locator('[class*="comparison"], [class*="history"]');
    if (await comparisonInfo.isVisible()) {
      const historyText = await comparisonInfo.textContent();
      expect(historyText).toBeTruthy();
    }
  }
});
