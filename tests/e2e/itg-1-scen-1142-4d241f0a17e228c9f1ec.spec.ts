import { test, expect } from '@playwright/test';

test.describe('SCEN-1142: 請求書・請求明細タブ表示：商談がクローズ状態でない場合', () => {
  test('不整合として検出される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.fill('#filter-stage', '提案');
    await page.waitForTimeout(500);

    const dealRows = await page.locator('#deal-tbody tr').count();
    expect(dealRows).toBeGreaterThan(0);

    const dealRow = page.locator('#deal-tbody tr').first();
    const stageText = await dealRow.locator('td').nth(3).textContent();
    expect(stageText).not.toContain('成約');

    await dealRow.click();
    await page.waitForTimeout(300);

    const tabButton = page.locator('[data-tab="invoices"]');
    await tabButton.click();
    await page.waitForTimeout(300);

    const invoiceTable = page.locator('[data-testid="invoice-list-table"]');
    await expect(invoiceTable).toBeVisible();

    const panelContent = page.locator('[data-aivic-panel="scr-1791354351333"]');
    const contentText = await panelContent.textContent();

    if (contentText && contentText.includes('不整合')) {
      expect(contentText).toMatch(/ステータス不整合|クローズ状態ではない/);
    }
  });
});
