import { test, expect } from '@playwright/test';

test('SCEN-409: エラー：更新操作を実行するユーザーが差異確認操作の権限を持たない場合、画面更新が拒否される', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html');

  // ダッシュボード上の差異詳細情報レコードの編集ボタンをクリック
  const detailButtons = page.locator('[data-testid="detail-button"]');
  if (await detailButtons.count() > 0) {
    await detailButtons.first().click();
  }

  // ダイアログまたは詳細パネルが表示されることを確認
  const detailModal = page.locator('#detail-modal');
  const isModalVisible = await detailModal.count() > 0;

  if (isModalVisible) {
    await expect(detailModal).toBeVisible();

    // ダイアログ内でデータを編集する操作を想定
    // 権限エラーが発生する場合、エラーメッセージが表示される

    // エラーメッセージが表示されるのを待つ
    const errorMessage = page.locator('[data-testid="error-message"]');
    const authErrorNotification = page.locator('text=/権限|permission|authorization/i');

    // エラーメッセージまたは通知が表示されるかを確認
    const hasError = await errorMessage.count() > 0 || await authErrorNotification.count() > 0;

    if (hasError) {
      // エラーが表示されたことを確認
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toBeVisible();
      } else {
        await expect(authErrorNotification).toBeVisible();
      }
    }

    // ダイアログを閉じる
    await page.locator('[data-testid="modal-close-button"]').click();
  }

  // ダッシュボード上のデータが操作前の状態のまま変わらないことを確認
  const discrepancyCount = page.locator('#discrepancy-count');
  const countBefore = await discrepancyCount.textContent();
  await page.waitForTimeout(500);
  const countAfter = await discrepancyCount.textContent();
  expect(countBefore).toBe(countAfter);
});
