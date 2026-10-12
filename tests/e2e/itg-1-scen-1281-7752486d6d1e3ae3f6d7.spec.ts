import { test, expect } from '@playwright/test';

test.describe('SCEN-1281 請求書生成確定（商談ID存在しないエラー）', () => {
  test('指定した商談IDがシステムに存在しないため、エラーメッセージが表示されて処理が中断される', async ({ page }) => {
    // 商談・請求管理画面にアクセス
    await page.goto('/panels/scr-1791354351333.html');

    // 請求書生成セクションで「新規請求書生成」ボタンをクリック
    await page.click('[data-testid="btn-generate-invoice"]');

    // 請求書生成ダイアログが表示される
    const modal = page.locator('#modal-generate');
    await expect(modal).toBeVisible();

    // ダイアログ内の「商談ID」入力フィールドに「DEAL-999999」を入力
    // （ダイアログ内に商談ID入力フィールドがある場合）
    const dealIdInput = modal.locator('input[placeholder*="商談"]');
    if (await dealIdInput.isVisible()) {
      await dealIdInput.fill('DEAL-999999');
    }

    // 「確定」ボタンをクリック
    await page.click('[data-testid="btn-confirm-generate"]');

    // システムがデータベースと照合を実行するまで5秒以上待つ
    await page.waitForTimeout(5000);

    // エラーメッセージが画面に赤枠で表示されることを確認
    const errorMsg = page.locator('text=/指定された商談ID.*は登録されていません|商談IDを確認してください/');
    await expect(errorMsg).toBeVisible();

    // ダイアログ内の入力値は保持されたまま残る
    if (await dealIdInput.isVisible()) {
      const inputValue = await dealIdInput.inputValue();
      expect(inputValue).toBe('DEAL-999999');
    }

    // 「確定」ボタンは押下不可状態（グレーアウト）に変わる
    const confirmBtn = page.locator('[data-testid="btn-confirm-generate"]');
    await expect(confirmBtn).toBeDisabled();

    // データベースへの請求書登録処理は実行されない
    // （ダイアログが開いたままで画面遷移していないことを確認）
    await expect(page).toHaveURL(/scr-1791354351333/);
  });
});
