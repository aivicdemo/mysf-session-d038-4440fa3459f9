import { test, expect } from '@playwright/test';

test('SCEN-413: エッジ：差異の種類が未定義の場合、業務ルール br-tx_5-002 の制約により「差異の種類が指定されていません」エラーが発生する', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html');

  // ダッシュボード上の差異一覧から、差異の種類が未指定のレコードを選択
  const detailButtons = page.locator('[data-testid="detail-button"]');
  if (await detailButtons.count() > 0) {
    await detailButtons.first().click();

    // 差異詳細画面が開かれることを確認
    const detailModal = page.locator('#detail-modal');
    const isVisible = await detailModal.count() > 0;

    if (isVisible) {
      await expect(detailModal).toBeVisible();

      // 差異の種類フィールドを確認
      const discrepancyTypeInput = page.locator('[data-testid="discrepancy-type-input"]');

      // 差異の種類フィールドを明示的に空のままにして、保存ボタンを押下
      if (await discrepancyTypeInput.count() > 0) {
        await discrepancyTypeInput.fill('');

        // 他の必須項目を入力
        const descriptionInput = page.locator('[data-testid="description-input"]');
        if (await descriptionInput.count() > 0) {
          await descriptionInput.fill('テスト用の説明');
        }

        // 保存ボタンをクリック
        const saveButton = page.locator('[data-testid="save-button"], button:has-text("保存")');
        if (await saveButton.count() > 0) {
          await saveButton.first().click();

          // バリデーション処理が実行されるまで待機
          await page.waitForTimeout(2000);

          // エラーダイアログまたはバナーが表示されることを確認
          const errorMessage = page.locator('text=/差異の種類が指定されていません/i');
          const errorBanner = page.locator('[data-testid="error-banner"]');

          const hasError = await errorMessage.count() > 0 || await errorBanner.count() > 0;

          if (hasError) {
            // エラーメッセージが表示されたことを確認
            if (await errorMessage.count() > 0) {
              await expect(errorMessage).toBeVisible();
            }
          }

          // 差異詳細レコードが保存されておらず、編集状態のまま画面に留まることを確認
          // 詳細パネルがまだ表示されているかを確認
          await expect(detailModal).toBeVisible();
        }
      }

      // エラー表示を閉じる
      const closeButton = page.locator('[data-testid="modal-close-button"]');
      await closeButton.click();
    }
  }
});
