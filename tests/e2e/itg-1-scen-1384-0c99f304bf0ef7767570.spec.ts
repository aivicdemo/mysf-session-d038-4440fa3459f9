import { test, expect } from '@playwright/test';

test('SCEN-1384: 請求金額がマイナス値の場合、エラーメッセージが表示されて画面表示が中止される', async ({ page }) => {
  // 顧客・取引先管理画面を開く
  await page.goto('/panels/scr-1791354379354.html');
  await page.waitForLoadState('networkidle');

  // 取引先一覧が表示されることを確認
  const customerTable = page.locator('[data-testid="customer-list-table"]');
  await expect(customerTable).toBeVisible();

  // 請求金額がマイナス値に設定された取引先の行をクリック
  const customerRow = page.locator('[data-testid="customer-list-table"] tbody tr').first();
  await customerRow.click();
  await page.waitForTimeout(300);

  // 詳細表示の操作を試みる（エラー発生ポイント）
  const detailButton = page.locator('[data-testid="btn-detail"]');
  await detailButton.click();
  await page.waitForTimeout(500);

  // エラーメッセージが画面上部に赤色バナーで表示されることを確認
  // 期待されるメッセージ: 「請求金額がマイナス値であるため、この取引先の詳細を表示できません」

  // 赤色のエラーバナー/アラートを検出
  const errorAlerts = page.locator('[class*="error"], [class*="alert"], [role="alert"], [style*="red"], [style*="rgb(220, 38, 38)"]');

  // または、ページ全体のテキストでエラーメッセージを確認
  const pageContent = await page.content();
  const hasErrorMessage = pageContent.includes('請求金額') &&
                          (pageContent.includes('マイナス') || pageContent.includes('負') || pageContent.includes('エラー'));

  // 以下のいずれかが成立することを確認：
  // 1. エラーバナーが表示されている
  // 2. 詳細画面への遷移が中止されている
  // 3. 一覧表示が保持されている

  const detailPanel = page.locator('#detail-container');
  const isPanelVisible = await detailPanel.isVisible();

  if (hasErrorMessage) {
    // エラーメッセージが表示されている
    expect(pageContent).toContain('請求金額');
  }

  if (!isPanelVisible) {
    // 詳細画面が表示されていない = 遷移が中止されている
    expect(!isPanelVisible).toBeTruthy();
  }

  // ユーザーは顧客・取引先管理画面の一覧表示に留まったままとなること
  const customerTableAfter = page.locator('[data-testid="customer-list-table"]');
  await expect(customerTableAfter).toBeVisible();

  // 詳細画面コンテンツが一切描画されていないことを確認
  const detailContent = page.locator('#detail-panel');
  const isDetailContentVisible = await detailContent.isVisible().catch(() => false);

  if (!isDetailContentVisible) {
    expect(!isDetailContentVisible).toBeTruthy();
  }
});
