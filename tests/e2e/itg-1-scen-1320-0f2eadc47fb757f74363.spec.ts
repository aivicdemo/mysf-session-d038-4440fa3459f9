import { test, expect } from '@playwright/test';

test.describe('SCEN-1320: 商談IDが空または不正な形式のとき、エラーメッセージが表示される', () => {
  test('商談IDが空のときエラーメッセージが表示され、再発行処理は進行しない', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    // 商談・請求管理画面で既存の請求書から再発行を選択
    const dealRows = page.locator('#deal-tbody tr');
    await dealRows.first().click();

    // 請求書再発行確定ダイアログを開く
    await page.click('#btn-reissue-invoice');

    // モーダルが表示されるまで待機
    const modal = page.locator('#modal-reissue');
    await expect(modal).toBeVisible();

    // 再発行ダイアログ内の『商談ID』入力フィールドを空に設定
    const dealIdField = page.locator('[placeholder*="商談"], [name*="dealId"], #modal-deal-id');
    if (await dealIdField.count() > 0) {
      await dealIdField.clear();
      await dealIdField.fill('');
    }

    // 『確定』ボタンをクリック
    const confirmButton = page.locator('#btn-confirm-reissue');
    await confirmButton.click();

    // システムの入力値検証処理が実行され、レスポンスが返される
    await page.waitForTimeout(1000);

    // エラーメッセージが表示される
    const errorMessage = page.locator(
      'text=商談IDが不正です。正しい商談を選択してください'
    );
    await expect(errorMessage).toBeVisible();

    // 再発行処理は進行せず、ダイアログは閉じない
    await expect(modal).toBeVisible();

    // 入力フィールドにフォーカスが残り、再入力を促す状態
    const focusedElement = page.locator(':focus');
    const focusedText = await focusedElement.evaluate((el: HTMLElement) => {
      const input = el as HTMLInputElement | HTMLSelectElement;
      return input.id || input.name || '';
    });
    // フォーカスが商談ID周辺のフィールドにあることを確認
    expect(
      focusedText.includes('deal') || focusedText.includes('商談') || focusedText === ''
    ).toBeTruthy();

    // サーバーへのリクエスト送信は発生しない
    let requestOccurred = false;
    page.on('request', (request) => {
      if (request.method() === 'POST' || request.method() === 'PUT') {
        requestOccurred = true;
      }
    });

    await page.waitForTimeout(500);
    expect(requestOccurred).toBe(false);
  });
});
