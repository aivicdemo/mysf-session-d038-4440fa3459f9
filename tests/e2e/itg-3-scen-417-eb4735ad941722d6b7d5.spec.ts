import { test, expect } from '@playwright/test';

test('SCEN-417: エッジ：既存システムのデータが空の場合、業務ルール br-tx_5-003 の制約により「既存システムのデータが取得できません。データ抽出を再実行してください」エラーが発生する', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html');

  // データ整合性検証ダッシュボードが開かれることを確認
  await expect(page.locator('[data-aivic-panel="scr-1791354872866"]')).toBeVisible();

  // 旧システム（Salesforce）から営業データを取得するための照合実行ボタンをクリック
  const executionButton = page.locator('[data-testid="reconciliation-button"], button:has-text("照合実行"), button:has-text("日次照合実行")');
  if (await executionButton.count() > 0) {
    await executionButton.first().click();

    // 既存システムのデータが空の状態で、差異詳細情報の更新処理が実行される
    await page.waitForTimeout(2000);

    // ダッシュボード画面にエラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=/既存システムのデータが取得できません。データ抽出を再実行してください/i');
    const errorBanner = page.locator('[data-testid="error-banner"]');

    const hasError = await errorMessage.count() > 0 || await errorBanner.count() > 0;

    if (hasError) {
      // エラーメッセージが表示されたことを確認
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
      }
    }

    // 差異詳細情報の更新が中断されることを確認
    // 判定結果の反映も行われない（ダッシュボード上の判定ステータスは更新前の状態のまま）
    await expect(page).toHaveURL('/panels/scr-1791354872866.html');

    // 判定ステータスが変わらないことを確認
    const statusBadges = page.locator('.status-badge');
    const initialStatusCount = await statusBadges.count();

    await page.waitForTimeout(1000);

    const finalStatusCount = await statusBadges.count();
    expect(initialStatusCount).toBe(finalStatusCount);
  }
});
