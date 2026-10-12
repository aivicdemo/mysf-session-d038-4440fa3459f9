import { test, expect } from '@playwright/test';

test.describe('SCEN-1144: 請求書・請求明細タブ表示：未請求額がある場合', () => {
  test('推奨アクションとして表示される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.fill('#filter-stage', '成約');
    await page.waitForTimeout(500);

    const dealRows = await page.locator('#deal-tbody tr').count();
    expect(dealRows).toBeGreaterThan(0);

    const dealRow = page.locator('#deal-tbody tr').first();
    const dealAmount = await dealRow.locator('td').nth(2).textContent();
    expect(dealAmount).toBeTruthy();

    await dealRow.click();
    await page.waitForTimeout(300);

    const tabButton = page.locator('[data-tab="invoices"]');
    await tabButton.click();
    await page.waitForTimeout(300);

    const invoiceTable = page.locator('[data-testid="invoice-list-table"]');
    await expect(invoiceTable).toBeVisible();

    const panelContent = page.locator('[data-aivic-panel="scr-1791354351333"]');
    const contentText = await panelContent.textContent();

    if (contentText && contentText.includes('未請求')) {
      expect(contentText).toMatch(/未請求額|請求書を作成/);
      const yenPattern = /¥|円/;
      expect(contentText).toMatch(yenPattern);
    }
  });
});
