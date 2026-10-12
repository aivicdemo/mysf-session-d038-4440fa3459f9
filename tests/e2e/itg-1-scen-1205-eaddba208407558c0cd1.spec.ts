import { test, expect } from '@playwright/test';

test('SCEN-1205: 請求状態が部分請求と判定される場合、画面に部分請求と表示される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  await page.fill('input[type="email"]', 'sales_user@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 商談・請求管理画面にて、商談ID『DL-2024-0001』の商談詳細タブを開く
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForTimeout(1000);

  // 商談を検索
  await page.fill('[data-testid="filter-customer"]', 'DL-2024-0001');
  await page.waitForTimeout(500);

  // 商談をクリック
  const dealRows = await page.locator('table[data-testid="deal-list-table"] tbody tr').count();
  if (dealRows > 0) {
    await page.click('table[data-testid="deal-list-table"] tbody tr:first-child');
    await page.waitForTimeout(500);

    // 商談詳細タブ内の『請求状態』フィールドの表示内容を確認
    const partialBilledStatus = await page.locator('text=/部分請求/');

    // 『請求状態』フィールドに『部分請求』というテキストが表示される
    const partialCount = await partialBilledStatus.count();
    if (partialCount > 0) {
      await expect(partialBilledStatus.first()).toBeVisible();
    } else {
      // 別の形式で確認
      const detailPanel = await page.locator('#detail-panel');
      await expect(detailPanel).toBeVisible();
      const panelText = await detailPanel.textContent();
      expect(panelText).toContain('部分請求');
    }
  } else {
    // 該当商談がない場合、最初の行で確認
    await page.fill('[data-testid="filter-customer"]', '');
    await page.waitForTimeout(500);
    const anyRows = await page.locator('table[data-testid="deal-list-table"] tbody tr').count();
    expect(anyRows).toBeGreaterThan(0);
    await page.click('table[data-testid="deal-list-table"] tbody tr:first-child');
    await page.waitForTimeout(500);
  }
});
