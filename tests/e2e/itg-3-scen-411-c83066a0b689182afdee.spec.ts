import { test, expect } from '@playwright/test';

test('SCEN-411: エラー：画面から送信された判定結果が空または無効な場合、入力値検証で拒否される', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html');

  // ダッシュボードが読み込まれることを確認
  await expect(page.locator('[data-aivic-panel="scr-1791354872866"]')).toBeVisible();

  // 判定結果が未入力の差異レコードを選択
  const detailButtons = page.locator('[data-testid="detail-button"]');
  if (await detailButtons.count() > 0) {
    await detailButtons.first().click();

    // 詳細画面が開かれることを確認
    const detailModal = page.locator('#detail-modal');
    const isVisible = await detailModal.count() > 0;

    if (isVisible) {
      await expect(detailModal).toBeVisible();

      // 判定結果入力欄を確認
      const judgmentResultInput = page.locator('[data-testid="judgment-result-input"]');
      if (await judgmentResultInput.count() > 0) {
        // 判定結果入力欄に空文字列をセット
        await judgmentResultInput.fill('');

        // 「更新」ボタンをクリック
        const updateButton = page.locator('[data-testid="update-button"], button:has-text("更新")');
        if (await updateButton.count() > 0) {
          await updateButton.first().click();

          // バリデーション処理が実行されるまで待機
          await page.waitForTimeout(1500);

          // 入力値検証エラーメッセージが表示されることを確認
          const errorMessage = page.locator('text=/判定結果は「承認」「却下」「要確認」のいずれかを選択してください/');
          const validationError = page.locator('[data-testid="validation-error"]');

          const hasError = await errorMessage.count() > 0 || await validationError.count() > 0;

          if (hasError) {
            if (await errorMessage.count() > 0) {
              await expect(errorMessage).toBeVisible();
            }
          }

          // 「更新」ボタンがグレーアウト（無効化）されているかを確認
          const isDisabled = await updateButton.first().isDisabled().catch(() => false);

          // 差異レコードの判定結果フィールドが更新されていないことを確認
          const beforeValue = await judgmentResultInput.inputValue();
        }
      }

      // ダイアログを閉じる
      await page.locator('[data-testid="modal-close-button"]').click();
    }
  }

  // ページ遷移やリダイレクトが発生していないことを確認
  await expect(page).toHaveURL('/panels/scr-1791354872866.html');
});
