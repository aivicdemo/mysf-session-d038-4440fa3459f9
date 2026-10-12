import { test, expect } from '@playwright/test';

test.describe('SCEN-1321: 単価・数量・割引率・税率のいずれかが負の値のときエラーメッセージが表示される', () => {
  test('負の値が入力されたとき、エラーメッセージが表示され再発行確定ボタンは無効化される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    // 商談・請求管理画面で再発行対象の請求書を選択し、詳細画面を開く
    const dealRows = page.locator('#deal-tbody tr');
    await dealRows.first().click();

    // 「請求書再発行」ボタンをクリックして再発行編集モードに遷移
    await page.click('#btn-reissue-invoice');

    // 再発行モーダルが表示されるまで待機
    const modal = page.locator('#modal-reissue');
    await expect(modal).toBeVisible();

    // 請求明細の編集行を開き、指定されたフィールド（単価・数量・割引率・税率）に負の値を入力
    const unitPriceField = page.locator('#edit-unit-price, [placeholder*="単価"]');
    if (await unitPriceField.count() > 0) {
      await unitPriceField.clear();
      await unitPriceField.fill('-1000');

      // 当該フィールドからフォーカスを外す
      await page.keyboard.press('Tab');

      // バリデーション結果を確認するため待機
      await page.waitForTimeout(500);
    }

    // エラーメッセージが表示される
    const errorMessage = page.locator(
      'text=単価・数量・割引率・税率は負の値を指定できません'
    );
    await expect(errorMessage).toBeVisible();

    // エラーメッセージが赤色で表示される
    const errorElement = page.locator('[role="alert"], .error-message');
    if (await errorElement.count() > 0) {
      const color = await errorElement.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).color;
      });
      expect(color).toMatch(/red|rgb\(255.*0.*0/i);
    }

    // 「請求書再発行確定」ボタンは無効化（グレーアウト）
    const confirmButton = page.locator('#btn-confirm-reissue');
    const isDisabled = await confirmButton.evaluate((el: HTMLButtonElement) => el.disabled);
    expect(isDisabled).toBe(true);

    // ボタンがグレーアウト状態であることを確認
    const opacity = await confirmButton.evaluate((el: HTMLElement) => {
      const style = window.getComputedStyle(el);
      return style.opacity;
    });
    expect(parseFloat(opacity)).toBeLessThan(1);

    // ユーザーは負の値を含んだ状態では請求書を再発行確定できない
    // ボタンがクリック不可であることを確認
    await expect(confirmButton).toBeDisabled();
  });

  test('数量フィールドに負の値を入力した場合', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    const dealRows = page.locator('#deal-tbody tr');
    await dealRows.first().click();

    await page.click('#btn-reissue-invoice');

    const modal = page.locator('#modal-reissue');
    await expect(modal).toBeVisible();

    const quantityField = page.locator('#edit-quantity, [placeholder*="数量"]');
    if (await quantityField.count() > 0) {
      await quantityField.clear();
      await quantityField.fill('-5');

      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
    }

    const errorMessage = page.locator(
      'text=単価・数量・割引率・税率は負の値を指定できません'
    );
    await expect(errorMessage).toBeVisible();

    const confirmButton = page.locator('#btn-confirm-reissue');
    const isDisabled = await confirmButton.evaluate((el: HTMLButtonElement) => el.disabled);
    expect(isDisabled).toBe(true);
  });

  test('税率フィールドに負の値を入力した場合', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    const dealRows = page.locator('#deal-tbody tr');
    await dealRows.first().click();

    await page.click('#btn-reissue-invoice');

    const modal = page.locator('#modal-reissue');
    await expect(modal).toBeVisible();

    const taxRateField = page.locator('#edit-tax-rate, [placeholder*="税率"]');
    if (await taxRateField.count() > 0) {
      await taxRateField.clear();
      await taxRateField.fill('-10');

      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
    }

    const errorMessage = page.locator(
      'text=単価・数量・割引率・税率は負の値を指定できません'
    );
    await expect(errorMessage).toBeVisible();

    const confirmButton = page.locator('#btn-confirm-reissue');
    const isDisabled = await confirmButton.evaluate((el: HTMLButtonElement) => el.disabled);
    expect(isDisabled).toBe(true);
  });
});
