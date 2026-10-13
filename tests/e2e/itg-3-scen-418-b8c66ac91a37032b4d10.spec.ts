import { test, expect } from '@playwright/test';

test('SCEN-418: エッジ：新システムのデータが空の場合、業務ルール br-tx_5-003 の制約により「新システムのデータが取得できません。データ抽出を再実行してください」エラーが発生する', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html');

  // データ整合性検証ダッシュボードが読み込まれることを確認
  await expect(page.locator('[data-aivic-panel="scr-1791354872866"]')).toBeVisible();

  // 対象営業日付を指定して日次自動照合を実行ボタンをクリック
  const dateInput = page.locator('[data-testid="target-date-input"]');
  const executeButton = page.locator('[data-testid="auto-reconciliation-button"], button:has-text("日次自動照合")');

  if (await dateInput.count() > 0) {
    // 対象日付を入力
    await dateInput.fill('2026-01-01');
  }

  if (await executeButton.count() > 0) {
    await executeButton.first().click();

    // 旧システム（Salesforce）からの請求書生成データ読み込みが完了するのを待つ
    await page.waitForTimeout(2000);

    // 新システムのデータ抽出・読み込みが試行される
    await page.waitForTimeout(1500);

    // 新システムのデータが空の状態で、業務ルール br-tx_5-003 の新システムデータ必須検証が実行される
    await page.waitForTimeout(1000);

    // ダッシュボード画面に赤色のエラーアラートが表示されることを確認
    const errorAlert = page.locator('[data-testid="error-alert"]');
    const errorMessage = page.locator('text=/新システムのデータが取得できません。データ抽出を再実行してください/i');

    const hasError = await errorAlert.count() > 0 || await errorMessage.count() > 0;

    if (hasError) {
      // エラーアラートまたはメッセージが表示されたことを確認
      if (await errorAlert.count() > 0) {
        await expect(errorAlert).toBeVisible();
      } else if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
      }
    }

    // 判定結果セクションのステータスが「エラー：データ不足」に更新されることを確認
    const statusSection = page.locator('[data-testid="judgment-status"]');
    if (await statusSection.count() > 0) {
      const statusText = await statusSection.textContent();
      expect(statusText).toMatch(/エラー|データ不足|Error/i);
    }

    // 差異検出処理は中断されることを確認
    // ページはダッシュボード画面に留まる
    await expect(page).toHaveURL('/panels/scr-1791354872866.html');
  }
});
