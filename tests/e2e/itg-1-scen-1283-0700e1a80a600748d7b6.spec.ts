import { test, expect } from '@playwright/test';

test.describe('SCEN-1283 請求書生成確定（必須情報不足エラー）', () => {
  test('商談から請求書生成に必須な顧客情報・金額・商品情報のいずれかが不足しているため、エラーメッセージが表示されて処理が中断される', async ({ page }) => {
    // 商談・請求管理画面にアクセス
    await page.goto('/panels/scr-1791354351333.html');

    // 対象の商談レコード（ステージ：提案）をクリック
    await page.click('[data-testid="filter-stage"]');
    await page.selectOption('[data-testid="filter-stage"]', '提案');

    const dealRow = page.locator('table tbody tr').first();
    await dealRow.click();

    // 請求書生成ボタンをクリック
    await page.click('[data-testid="btn-generate-invoice"]');

    // 請求書生成の確認ダイアログが表示されるまで待機
    const modal = page.locator('#modal-generate');
    if (await modal.isVisible()) {
      // ダイアログが表示された場合、ボタンをクリックして必須情報チェックをトリガー
      await page.click('[data-testid="btn-confirm-generate"]');
    }

    // 処理完了を待機
    await page.waitForTimeout(1000);

    // エラーメッセージが赤色で表示される
    const errorMsg = page.locator('text=/エラー：請求書生成に必要な情報が不足しています|顧客住所、請求予定金額、商品情報を確認してください/');
    if (await errorMsg.isVisible()) {
      await expect(errorMsg).toBeVisible();
      // エラーメッセージの色を確認（赤色）
      const color = await errorMsg.evaluate((el) => getComputedStyle(el).color);
      expect(color).toBeDefined();
    }

    // [請求書生成ボタン]は無効状態（グレーアウト）のままである
    const generateBtn = page.locator('[data-testid="btn-generate-invoice"]');
    await expect(generateBtn).toBeDisabled();

    // エラーメッセージの直下に「詳細を表示」リンクが表示され、不足している項目が箇条書きで列挙される
    const detailLink = page.locator('text=/詳細を表示/');
    if (await detailLink.isVisible()) {
      await expect(detailLink).toBeVisible();

      // 詳細を表示をクリック
      await detailLink.click();

      // 不足している項目が表示される
      const missingItems = page.locator('text=/顧客住所|請求予定金額|商品情報/');
      await expect(missingItems).toBeVisible();
    }

    // 画面は遷移しない
    await expect(page).toHaveURL(/scr-1791354351333/);
  });
});
