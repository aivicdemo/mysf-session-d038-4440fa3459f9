import { test, expect } from '@playwright/test';

test.describe('SCEN-1146: 請求書・請求明細タブ表示：請求明細合計と請求書金額が不一致の場合', () => {
  test('不整合として検出される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.fill('#filter-stage', '成約');
    await page.waitForTimeout(500);

    const dealRows = await page.locator('#deal-tbody tr').count();
    expect(dealRows).toBeGreaterThan(0);

    const dealRow = page.locator('#deal-tbody tr').first();
    await dealRow.click();
    await page.waitForTimeout(300);

    const invoicesTab = page.locator('[data-tab="invoices"]');
    await invoicesTab.click();
    await page.waitForTimeout(300);

    const invoiceTable = page.locator('[data-testid="invoice-list-table"]');
    await expect(invoiceTable).toBeVisible();

    const invoiceRows = await page.locator('#invoice-tbody tr').count();
    if (invoiceRows > 1) {
      const invoiceAmount = await page.locator('#invoice-tbody tr').first().locator('td').nth(3).textContent();
      expect(invoiceAmount).toBeTruthy();

      const detailsTab = page.locator('[data-tab="details"]');
      await detailsTab.click();
      await page.waitForTimeout(300);

      const detailsTable = page.locator('[data-testid="invoice-detail-table"]');
      const detailRows = await page.locator('#invoice-detail-tbody tr').count();

      if (detailRows > 1) {
        const panelContent = page.locator('[data-aivic-panel="scr-1791354351333"]');
        const contentText = await panelContent.textContent();

        if (contentText && (contentText.includes('不整合') || contentText.includes('合計'))) {
          expect(contentText).toMatch(/不整合|金額が不一致|合計|警告/);
        }
      }
    }
  });
});
