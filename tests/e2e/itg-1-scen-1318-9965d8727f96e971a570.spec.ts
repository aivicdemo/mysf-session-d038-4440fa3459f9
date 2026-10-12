import { test, expect } from '@playwright/test';

test.describe('SCEN-1318: 修正前後の値が同じとき、警告メッセージが表示される', () => {
  test('修正前後の値が同じとき、警告メッセージが表示され、修正・再発行ボタンは無効化される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    // 商談・請求管理画面で「再発行待機中」の請求書レコードをクリック
    const dealRows = page.locator('#deal-tbody tr');
    await dealRows.first().click();

    // 「修正・再発行」ボタンをクリックして請求書修正モーダルを開く
    await page.click('#btn-reissue-invoice');

    // モーダルが表示されるまで待機
    const modal = page.locator('#modal-reissue');
    await expect(modal).toBeVisible();

    // 修正モーダル内の「請求金額」フィールドに現在値と同じ値を入力
    const amountField = page.locator('#modal-invoice-date, [placeholder*="金額"]');
    // 既存値を取得
    const currentValue = await amountField.inputValue();
    // 同じ値を入力
    await amountField.clear();
    await amountField.fill(currentValue || '150000');

    // その他の修正不要な項目は変更せず、そのまま保持
    // （他のフィールドは操作しない）

    // モーダル下部の「修正内容確認」ボタンをクリック
    const confirmButton = page.locator('#btn-confirm-reissue');
    await confirmButton.click();

    // 修正内容の検証処理が実行されるまで待機
    await page.waitForTimeout(1000);

    // 警告メッセージが表示される
    const warningMessage = page.locator(
      'text=修正前後の値が同じです。修正内容を確認してください, ' +
      '[role="alert"], ' +
      '.warning-message, ' +
      '.alert'
    );
    await expect(warningMessage).toBeVisible();

    // アラート表示が確認される
    const alertBox = page.locator('[role="alert"], .alert, .warning');
    await expect(alertBox).toContainText('修正前後の値が同じ');

    // 修正・再発行ボタンは無効化（グレーアウト）
    const reissueButton = page.locator('#btn-confirm-reissue');
    const isDisabled = await reissueButton.evaluate((el: HTMLButtonElement) => el.disabled);
    expect(isDisabled).toBe(true);

    // ボタンがグレーアウト状態であることを確認
    const opacity = await reissueButton.evaluate((el: HTMLElement) => {
      const style = window.getComputedStyle(el);
      return style.opacity;
    });
    expect(parseFloat(opacity)).toBeLessThan(1);

    // モーダルは閉じずに表示されたまま留まる
    await expect(modal).toBeVisible();

    // キャンセルボタンで終了する選択肢がある
    const cancelButton = page.locator('#btn-cancel-reissue');
    await expect(cancelButton).toBeVisible();
  });
});
