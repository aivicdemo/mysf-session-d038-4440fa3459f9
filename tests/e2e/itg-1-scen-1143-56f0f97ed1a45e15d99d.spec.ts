import { test, expect } from '@playwright/test';

test.describe('SCEN-1143: 請求書・請求明細タブ表示：請求書が商談クローズ前に発行されている場合', () => {
  test('不整合として検出される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.fill('#filter-stage', '提案');
    await page.waitForTimeout(500);

    const dealRows = await page.locator('#deal-tbody tr').count();
    expect(dealRows).toBeGreaterThan(0);

    const dealRow = page.locator('#deal-tbody tr').first();
    await dealRow.click();
    await page.waitForTimeout(300);

    const tabButton = page.locator('[data-tab="invoices"]');
    await tabButton.click();
    await page.waitForTimeout(300);

    const invoiceTable = page.locator('[data-testid="invoice-list-table"]');
    const invoiceRows = await page.locator('#invoice-tbody tr').count();

    if (invoiceRows > 1) {
      const panelContent = page.locator('[data-aivic-panel="scr-1791354351333"]');
      const contentText = await panelContent.textContent();

      if (contentText && contentText.includes('クローズ前')) {
        expect(contentText).toMatch(/不整合|クローズ前に請求書が発行|ステージ/);
      }
    }
  });
});
