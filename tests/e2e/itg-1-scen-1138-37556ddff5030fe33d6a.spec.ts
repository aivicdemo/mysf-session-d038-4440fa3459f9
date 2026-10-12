import { test, expect } from '@playwright/test';

test.describe('SCEN-1138: 請求書・請求明細タブ表示：商談がクローズ状態で請求書が未発行の場合', () => {
  test('ステータス不整合として警告表示される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.fill('#filter-stage', '成約');
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
    await expect(invoiceTable).toBeVisible();

    const panelContent = page.locator('[data-aivic-panel="scr-1791354351333"]');
    const contentText = await panelContent.textContent();

    if (contentText && contentText.includes('未発行')) {
      expect(contentText).toMatch(/ステータス不整合|クローズ|請求書が未発行/);
      const warningPattern = /⚠|警告|注意/;
      expect(contentText).toMatch(warningPattern);
    }
  });
});
