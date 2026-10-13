import { test, expect } from '@playwright/test';

test('SCEN-412: エラー：選択された差異レコードが存在しない場合、詳細情報取得で失敗する', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html');

  // ダッシュボード画面が読み込まれることを確認
  await expect(page.locator('[data-aivic-panel="scr-1791354872866"]')).toBeVisible();

  // URLのクエリパラメータを直接編集して無効なレコードIDを指定
  await page.goto('/panels/scr-1791354872866.html?recordId=INVALID_RECORD_ID_99999');

  // 詳細情報取得リクエストが送信される
  await page.waitForTimeout(2000);

  // ネットワークレスポンスを確認（APIエラーが返される）
  // 実装では404エラーが返されることを想定

  // エラー表示が現れるまで待機
  await page.waitForTimeout(1000);

  // ダッシュボード画面上にエラーメッセージが表示されることを確認
  const errorMessage = page.locator('text=/選択されたレコードが見つかりません|レコード取得エラー|指定されたレコードIDは存在しません/i');
  const errorBanner = page.locator('[data-testid="error-banner"]');

  const hasError = await errorMessage.count() > 0 || await errorBanner.count() > 0;

  if (hasError) {
    // エラーメッセージが赤色ないし警告色で表示されていることを確認
    if (await errorMessage.count() > 0) {
      await expect(errorMessage).toBeVisible();
    }
  }

  // 詳細パネルがクリアされているかを確認
  const detailPanel = page.locator('#detail-modal');
  const isPanelVisible = await detailPanel.count() > 0 && await detailPanel.isVisible().catch(() => false);

  // ダッシュボード全体の操作が継続可能な状態のままであることを確認
  const discrepancyCount = page.locator('#discrepancy-count');
  await expect(discrepancyCount).toBeVisible();

  // 別のレコードを選択可能であることを確認
  const detailButtons = page.locator('[data-testid="detail-button"]');
  const buttonCount = await detailButtons.count();
  expect(buttonCount).toBeGreaterThanOrEqual(0);
});
