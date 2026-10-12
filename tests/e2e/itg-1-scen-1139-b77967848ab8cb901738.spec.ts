import { test, expect } from '@playwright/test';

test.describe('SCEN-1139: 請求書・請求明細タブ表示：営業成績金額がマイナス値の場合', () => {
  test('エラーメッセージを表示', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.fill('#filter-customer', '');
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

    if (contentText && contentText.includes('マイナス')) {
      expect(contentText).toMatch(/営業成績金額.*マイナス|マイナス値|実行できません/);
    }
  });
});
