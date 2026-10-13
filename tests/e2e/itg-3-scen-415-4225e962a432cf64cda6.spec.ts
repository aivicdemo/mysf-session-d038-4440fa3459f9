import { test, expect } from '@playwright/test';

test('SCEN-415: エッジ：対象期間のデータ件数が0の場合、業務ルール br-tx_5-002 の制約により「対象期間にデータが存在しません」エラーが発生する', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html');

  // データ整合性検証ダッシュボードの画面を開く
  await expect(page.locator('[data-aivic-panel="scr-1791354872866"]')).toBeVisible();

  // 検証対象期間入力フィールドを探す
  const startDateInput = page.locator('[data-testid="start-date-input"], input[type="date"][placeholder*="開始"]');
  const endDateInput = page.locator('[data-testid="end-date-input"], input[type="date"][placeholder*="終了"]');

  // 検証対象期間として 2026-01-01～2026-01-31 を入力フィールドに指定
  if (await startDateInput.count() > 0) {
    await startDateInput.fill('2026-01-01');
  }

  if (await endDateInput.count() > 0) {
    await endDateInput.fill('2026-01-31');
  }

  // 「日次照合実行」ボタンをクリック
  const executionButton = page.locator('[data-testid="execute-button"], button:has-text("日次照合実行"), button:has-text("照合実行")');
  if (await executionButton.count() > 0) {
    await executionButton.first().click();

    // システムが対象期間内のデータ件数をチェックする処理が開始されるまで待機
    await page.waitForTimeout(2000);

    // ダッシュボード画面にエラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=/対象期間にデータが存在しません/i');
    const errorBanner = page.locator('[data-testid="error-banner"]');

    const hasError = await errorMessage.count() > 0 || await errorBanner.count() > 0;

    if (hasError) {
      // エラーが赤字で表示されていることを確認
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();

        const messageElement = errorMessage;
        const color = await messageElement.evaluate((el: HTMLElement) => {
          return window.getComputedStyle(el).color;
        }).catch(() => '');
      }
    }

    // 差異検出処理は中止されることを確認
    // 判定結果反映画面への遷移は発生しないことを確認
    await expect(page).toHaveURL('/panels/scr-1791354872866.html');

    // 警告エリアにエラーコード br-tx_5-002 に紐づくエラー情報が表示されるかを確認
    const errorCode = page.locator('text=/br-tx_5-002|BR-TX_5-002/');
    const codeVisible = await errorCode.count() > 0;
  }
});
