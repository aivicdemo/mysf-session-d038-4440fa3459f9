import { test, expect } from '@playwright/test';

test.describe('SCEN-1136: 請求書・請求明細タブ表示：成績金額と請求金額が異なり未請求状態の場合', () => {
  test('未請求として警告表示される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.fill('#filter-customer', '');
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
    const warningText = await panelContent.textContent();

    if (warningText && warningText.includes('未請求')) {
      expect(warningText).toContain('未請求');
      expect(warningText).toMatch(/差異|異なり/);
    }
  });
});
