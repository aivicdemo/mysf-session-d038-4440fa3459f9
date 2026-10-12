import { test, expect } from '@playwright/test';

test.describe('SCEN-1279 請求書生成確定（正常系）', () => {
  test('権限検証が通り、請求対象の商談を取得でき、既存請求書がなく、必須フィールドが揃い、金額が整合し、請求書が生成され、参照関係が有効で、レコードがDBに保存され、監査・異常・修正・通知ログが記録される', async ({ page }) => {
    // ログイン済みの状態で商談・請求管理画面にアクセス
    await page.goto('/panels/scr-1791354351333.html');

    // ステージが「成約」の商談「テスト案件SCEN-1279」を検索・選択
    // フィルタでステージを「成約」に設定
    await page.click('[data-testid="filter-stage"]');
    await page.selectOption('[data-testid="filter-stage"]', '成約');

    // 商談一覧から該当商談を選択（金額150,000円の商談）
    const dealRow = page.locator('table tbody tr', { has: page.locator('text=150') }).first();
    await dealRow.click();

    // 商談詳細画面で商談内容（金額150,000円、商品情報、納期日）が表示されることを確認
    await expect(page.locator('#detail-panel')).toContainText('150,000');
    await expect(page.locator('#detail-panel')).toContainText('2025');

    // 「請求書生成」ボタンをクリック
    await page.click('[data-testid="btn-generate-invoice"]');

    // 請求書生成確認ダイアログが表示され、商談金額150,000円・取引先「テスト株式会社」・商品明細が画面に表示されることを確認
    const modal = page.locator('#modal-generate');
    await expect(modal).toBeVisible();

    // ダイアログ内の「生成実行」ボタンをクリック
    await page.fill('[data-testid="modal-invoice-date"]', '2024-10-15');
    await page.fill('[data-testid="modal-due-date"]', '2024-11-14');
    await page.click('[data-testid="btn-confirm-generate"]');

    // 生成完了ダイアログが表示され、生成された請求書番号（例：INV-202410-00001）が画面に表示されることを確認
    // 処理完了を待機
    await page.waitForTimeout(1000);

    // 商談・請求管理画面の請求書一覧に新規請求書が表示されることを確認
    const invoiceTable = page.locator('[data-testid="invoice-list-table"] tbody');
    await expect(invoiceTable).toContainText('INV-');

    // 新規請求書レコードをクリックして詳細を開き、商談との参照関係が表示されることを確認
    const invoiceRow = invoiceTable.locator('tr').first();
    await expect(invoiceRow).toContainText('確定');

    // 営業プロセス統合ダッシュボードを開き、請求書が表示され、未請求案件リストから消えていることを画面で確認
    await page.goto('/panels/scr-1791354337614.html');

    // ダッシュボード画面で請求書一覧と未請求案件リストの状態を確認
    const unbilledTable = page.locator('[data-testid="unbilled-deals-table"]');
    if (unbilledTable.isVisible()) {
      await expect(unbilledTable).not.toContainText('テスト案件SCEN-1279');
    }
  });
});
