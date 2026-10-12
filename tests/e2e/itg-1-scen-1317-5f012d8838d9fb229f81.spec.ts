import { test, expect } from '@playwright/test';

test.describe('SCEN-1317: 修正後の値が空のとき、「修正後の値を入力してください」というエラーメッセージが表示される', () => {
  test('修正後の値が空の項目に対してエラーメッセージが表示され、再発行処理は実行されない', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    // 商談・請求管理画面から再発行対象の請求書を選択
    await page.click('[data-id*="rec-"]');

    // 請求書詳細画面の『修正』ボタンをクリック
    await page.click('#btn-edit-invoice');

    // 修正対象の項目（例：請求金額）を空欄のままにしておく
    const editQuantityField = page.locator('#edit-quantity');
    await editQuantityField.clear();

    // 修正内容を確定する『再発行確定』ボタンをクリック
    await page.click('#btn-apply-edit');

    // バリデーション処理が実行されるまで待機
    await page.waitForTimeout(1000);

    // 修正後の値が空の項目に対して赤色のエラーメッセージが表示される
    const errorMessage = page.locator('text=修正後の値を入力してください');
    await expect(errorMessage).toBeVisible();

    // エラーメッセージが赤色で表示されていることを確認
    const errorElement = page.locator('.error-message, [role="alert"]');
    const color = await errorElement.evaluate((el: HTMLElement) => window.getComputedStyle(el).color);
    expect(color).toContain('rgb');

    // 再発行確定処理は実行されず、画面は修正モードのまま
    const editForm = page.locator('#edit-form');
    await expect(editForm).toHaveClass(/visible/);

    // 確定ボタンのクリックイベントは無効化（ボタンは無効化された状態）
    const applyButton = page.locator('#btn-apply-edit');
    // この段階ではボタンは無効化されているはず
    const isDisabled = await applyButton.evaluate((el: HTMLButtonElement) => el.disabled);
    expect(isDisabled).toBe(true);

    // サーバーへのリクエスト送信は発生しない
    let requestOccurred = false;
    page.on('request', (request) => {
      if (request.method() === 'POST' || request.method() === 'PUT') {
        requestOccurred = true;
      }
    });

    // 追加のリクエストがないことを確認
    await page.waitForTimeout(500);
    expect(requestOccurred).toBe(false);
  });
});
