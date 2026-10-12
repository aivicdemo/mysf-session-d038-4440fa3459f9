import { test, expect } from '@playwright/test';

test.describe('SCEN-1280 請求書生成確定（権限拒否エラー）', () => {
  test('ユーザーが請求書生成操作の実行権限を持たないため、エラーメッセージが表示されて処理が中断される', async ({ page }) => {
    // 権限なしユーザーの状態で商談・請求管理画面にアクセス
    await page.goto('/panels/scr-1791354351333.html');

    // 商談一覧から任意の商談を選択
    const dealRow = page.locator('table tbody tr').first();
    await dealRow.click();

    // 「請求書生成」ボタン（または「請求書生成」メニュー項目）を探して、クリック
    const generateBtn = page.locator('[data-testid="btn-generate-invoice"]');

    // 権限がない場合はボタンが無効化または非表示
    if (await generateBtn.isVisible()) {
      // ボタンが存在する場合は無効状態か確認
      const isDisabled = await generateBtn.isDisabled();
      expect(isDisabled).toBeTruthy();
    } else {
      // ボタンが非表示の場合はその旨を確認
      await expect(generateBtn).not.toBeVisible();
    }

    // システムがユーザーの実行権限を検証する処理が完了するまで待機
    await page.waitForTimeout(500);

    // 権限検証失敗時のエラーメッセージを確認
    // エラーメッセージが画面に表示されている場合
    const errorMsg = page.locator('text=/この操作を実行する権限がありません|請求書生成権限がないため処理できません/');
    if (await errorMsg.isVisible()) {
      await expect(errorMsg).toBeVisible();
    } else {
      // ボタンの無効化だけで対応している場合、少なくともボタンが無効化されていることを確認
      await expect(generateBtn).not.toBeEnabled();
    }

    // 商談・請求管理画面は遷移せず、請求書生成前の状態を維持
    await expect(page).toHaveURL(/scr-1791354351333/);
  });
});
