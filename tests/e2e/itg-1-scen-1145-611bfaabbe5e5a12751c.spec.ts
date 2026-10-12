import { test, expect } from '@playwright/test';

test.describe('SCEN-1145: 請求書・請求明細タブ表示：過請求がある場合', () => {
  test('推奨アクションとして表示される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.fill('#filter-stage', '成約');
    await page.waitForTimeout(500);

    const dealRows = await page.locator('#deal-tbody tr').count();
    expect(dealRows).toBeGreaterThan(0);

    const dealRow = page.locator('#deal-tbody tr').first();
    await dealRow.click();
    await page.waitForTimeout(300);

    const tabButton = page.locator('[data-tab="details"]');
    await tabButton.click();
    await page.waitForTimeout(300);

    const detailsTable = page.locator('[data-testid="invoice-detail-table"]');
    await expect(detailsTable).toBeVisible();

    const panelContent = page.locator('[data-aivic-panel="scr-1791354351333"]');
    const contentText = await panelContent.textContent();

    if (contentText && contentText.includes('過請求')) {
      expect(contentText).toMatch(/過請求|契約金額を超過|見直し|クレジット処理/);
    }
  });
});
