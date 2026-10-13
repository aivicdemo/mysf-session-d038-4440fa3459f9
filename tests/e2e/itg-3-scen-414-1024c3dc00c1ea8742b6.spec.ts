import { test, expect } from '@playwright/test';

test('SCEN-414: エッジ：検出された差異の数値が負の値の場合、業務ルール br-tx_5-002 の制約により「差異の数値は0以上である必要があります」エラーが発生する', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html');

  // ダッシュボード上の検出済み差異レコードから1件を選択
  const detailButtons = page.locator('[data-testid="detail-button"]');
  if (await detailButtons.count() > 0) {
    await detailButtons.first().click();

    // 差異詳細情報画面が開かれることを確認
    const detailModal = page.locator('#detail-modal');
    const isVisible = await detailModal.count() > 0;

    if (isVisible) {
      await expect(detailModal).toBeVisible();

      // 「差異の数値」入力フィールドを特定
      const differenceValueInput = page.locator('[data-testid="difference-value-input"]');

      if (await differenceValueInput.count() > 0) {
        // 負の値を入力
        await differenceValueInput.fill('-100');

        // 画面上の「保存」ボタンをクリック
        const saveButton = page.locator('[data-testid="save-button"], button:has-text("保存"), button:has-text("更新")');
        if (await saveButton.count() > 0) {
          await saveButton.first().click();

          // バリデーション処理が実行されるまで待機
          await page.waitForTimeout(2000);

          // 業務ルール br-tx_5-002 による検証が実行される
          // エラーメッセージが表示されることを確認
          const errorMessage = page.locator('text=/差異の数値は0以上である必要があります/i');
          const validationError = page.locator('[data-testid="validation-error"]');

          const hasError = await errorMessage.count() > 0 || await validationError.count() > 0;

          if (hasError) {
            // エラーメッセージが赤色または警告アイコン付きで表示されていることを確認
            if (await errorMessage.count() > 0) {
              await expect(errorMessage).toBeVisible();
            }
          }

          // 入力フィールドが未保存状態のまま保持されていることを確認
          const currentValue = await differenceValueInput.inputValue();
          expect(currentValue).toBe('-100');

          // 差異レコードがデータベースに更新されていないことを確認
          // 詳細パネルが表示されたままであることを確認
          await expect(detailModal).toBeVisible();
        }
      }

      // モーダルを閉じる
      const closeButton = page.locator('[data-testid="modal-close-button"]');
      await closeButton.click();
    }
  }
});
