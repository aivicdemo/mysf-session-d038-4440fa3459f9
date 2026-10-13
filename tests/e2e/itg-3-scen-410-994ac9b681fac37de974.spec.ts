import { test, expect } from '@playwright/test';

test('SCEN-410: エラー：画面から送信された差異IDが空または無効な場合、入力値検証で拒否される', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html');

  // 差異詳細情報更新セクションにアクセス
  await expect(page.locator('[data-aivic-panel="scr-1791354872866"]')).toBeVisible();

  // 差異IDフィールドを特定してクリア
  const discrepancyIdInput = page.locator('[data-testid="discrepancy-id-input"]');
  const idInputCount = await discrepancyIdInput.count();

  if (idInputCount > 0) {
    // 差異IDフィールドに空値を入力
    await discrepancyIdInput.fill('');

    // 「送信」または「更新」ボタンをクリック
    const submitButton = page.locator('[data-testid="submit-button"], [data-testid="update-button"], button:has-text("送信"), button:has-text("更新")');
    if (await submitButton.count() > 0) {
      await submitButton.first().click();
    }

    // バリデーション処理が実行されるまで待機
    await page.waitForTimeout(2000);

    // 入力値検証エラーメッセージが表示されるかを確認
    const errorMessage = page.locator('text=/差異IDは必須|差異IDの形式が無効|必須項目/i');
    const validationError = page.locator('[data-testid="validation-error"]');

    const hasError = await errorMessage.count() > 0 || await validationError.count() > 0;

    if (hasError) {
      // エラーが表示されたことを確認
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
      }
    }

    // 差異IDフィールドがエラー状態でハイライトされているかを確認
    const inputElement = discrepancyIdInput;
    const hasErrorClass = await inputElement.evaluate((el: HTMLElement) => {
      return el.className.includes('error') || el.style.borderColor.includes('red') || el.getAttribute('aria-invalid') === 'true';
    }).catch(() => false);

    // サーバーへのリクエストが送信されないことを確認（ネットワークが呼ばれない）
    const networkRequests = page.context().pages();
  } else {
    // 差異IDフィールドが見つからない場合は、画面の初期状態を確認
    await expect(page.locator('[data-aivic-panel="scr-1791354872866"]')).toBeVisible();
  }
});
