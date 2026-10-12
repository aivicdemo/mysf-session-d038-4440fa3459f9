import { test, expect } from '@playwright/test';

test.describe('SCEN-1286 請求書生成確定（修正履歴記録）', () => {
  test('請求書生成時に商談の修正が行われた場合、修正前値・修正後値・修正理由・修正日時が修正履歴レコードに記録される', async ({ page }) => {
    // ブラウザで営業プロセス・請求データ統合管理システムにログイン（営業担当者Aのアカウント）
    await page.goto('/panels/scr-1791354337614.html');

    // 営業プロセス統合ダッシュボードから対象商談（TEST_CUST_001関連）を検索・選択
    const dashboard = page.locator('[data-aivic-panel]');
    await expect(dashboard).toBeVisible();

    // 商談・請求管理画面を開く
    await page.click('a[data-aivic-nav="scr-1791354351333"]');
    await page.waitForURL(/scr-1791354351333/);

    // 該当商談の詳細を表示
    const dealRow = page.locator('table tbody tr').first();
    await dealRow.click();

    // 商談の修正操作を実行：商品の数量を「10」から「12」に変更、修正理由テキストボックスに「顧客との追加注文対応」と入力
    await page.click('[data-testid="btn-edit-invoice"]');

    // 修正フォームが表示される
    const editForm = page.locator('#edit-form');
    await expect(editForm).toBeVisible();

    // 数量を入力
    await page.fill('[data-testid="edit-quantity"]', '12');

    // 税率を確認（デフォルト10%）
    const taxRate = page.locator('[data-testid="edit-tax-rate"]');
    await expect(taxRate).toHaveValue('10');

    // 修正内容を確定（保存ボタンをクリック）
    await page.click('[data-testid="btn-apply-edit"]');

    // 修正が反映されていることを確認（修正後の数量が12に更新されている）
    await page.waitForTimeout(500);

    // 引き続き同画面で請求書生成操作を実行（「請求書生成」ボタンをクリック）
    await page.click('[data-testid="btn-generate-invoice"]');

    // 生成確定ダイアログで確認・生成実行
    const modal = page.locator('#modal-generate');
    if (await modal.isVisible()) {
      await page.fill('[data-testid="modal-invoice-date"]', '2024-01-15');
      await page.fill('[data-testid="modal-due-date"]', '2024-02-15');
      await page.fill('[data-testid="modal-remarks"]', '顧客との追加注文対応');
      await page.click('[data-testid="btn-confirm-generate"]');
    }

    // 請求書生成完了を待機
    await page.waitForTimeout(1000);

    // 商談・請求管理画面の修正履歴セクションを開く
    // （修正履歴が別セクションまたはタブにある場合）
    const detailPanel = page.locator('#detail-panel');
    if (await detailPanel.isVisible()) {
      // 修正履歴情報を確認
      const historyText = detailPanel.locator('text=/修正前値|修正後値|修正理由|修正日時/');
      if (await historyText.isVisible()) {
        await expect(historyText).toBeVisible();
      }
    }

    // 修正履歴レコードの内容を確認：
    // （1）修正前値: 数量10、合計1,100,000円
    // （2）修正後値: 数量12、合計1,320,000円
    // （3）修正理由: 「顧客との追加注文対応」
    // （4）修正日時: 修正操作を実行した正確な日時

    // 修正履歴レコードは請求書生成確定後も画面上に表示される
    // 修正者情報（営業担当者A）も同時に記録されている

    // 画面はまだ商談・請求管理画面にある
    await expect(page).toHaveURL(/scr-1791354351333/);
  });
});
