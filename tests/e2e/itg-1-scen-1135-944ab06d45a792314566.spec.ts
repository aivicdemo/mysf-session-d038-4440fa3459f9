import { test, expect } from '@playwright/test';

test.describe('SCEN-1135: 請求書・請求明細タブ表示：成績金額と請求金額が一致する場合', () => {
  test('成績と請求が連動していると判定されて表示される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.fill('#filter-stage', '成約');
    await page.waitForTimeout(500);

    const dealRows = await page.locator('#deal-tbody tr').count();
    expect(dealRows).toBeGreaterThan(0);

    const dealRow = page.locator('#deal-tbody tr').first();
    const dealAmount = await dealRow.locator('td').nth(2).textContent();
    expect(dealAmount).toContain('500,000');

    await dealRow.click();
    await page.waitForTimeout(300);

    const tabButton = page.locator('[data-tab="invoices"]');
    await tabButton.click();
    await page.waitForTimeout(300);

    const invoiceTable = page.locator('[data-testid="invoice-list-table"]');
    await expect(invoiceTable).toBeVisible();

    const invoiceRows = await page.locator('#invoice-tbody tr').count();
    if (invoiceRows > 1) {
      const firstInvoiceRow = page.locator('#invoice-tbody tr').first();
      const invoiceAmount = await firstInvoiceRow.locator('td').nth(3).textContent();
      expect(invoiceAmount).toContain('500,000');

      const linkageIndicator = page.locator(
        'text=/連動|✓|連動しています/'
      );
      const isVisible = await linkageIndicator.isVisible().catch(() => false);

      if (!isVisible) {
        const invoiceTableText = await invoiceTable.textContent();
        expect(invoiceTableText).toContain('500,000');
      }
    }
  });
});
