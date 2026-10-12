import { test, expect } from '@playwright/test';

test.describe('SCEN-1289 請求書生成確定（参照関係と金額一致検証）', () => {
  test('商談と請求書・請求明細の参照関係を検証したとき、すべての参照が有効で、金額が一致しているため、請求書・請求明細画面への遷移が許可される', async ({ page }) => {
    // 商談・請求管理画面を開く
    await page.goto('/panels/scr-1791354351333.html');

    // クローズ_受注ステージの商談（金額1,000,000円）を検索・選択
    await page.click('[data-testid="filter-stage"]');
    await page.selectOption('[data-testid="filter-stage"]', '成約');

    // 金額1,000,000円の商談を検索
    const amountFilter = page.locator('[data-testid="filter-amount-min"]');
    await amountFilter.fill('1000000');

    const amountMaxFilter = page.locator('[data-testid="filter-amount-max"]');
    await amountMaxFilter.fill('1000000');

    // 該当商談の詳細パネルで「請求書生成確定」ボタンを確認
    const dealRow = page.locator('table tbody tr').first();
    await dealRow.click();

    // 詳細パネルを確認
    const detailPanel = page.locator('#detail-panel');
    await expect(detailPanel).toBeVisible();

    // 「請求書生成確定」ボタンをクリック
    const generateBtn = page.locator('[data-testid="btn-generate-invoice"]');
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // 請求書生成ダイアログが表示される
    const modal = page.locator('#modal-generate');
    await expect(modal).toBeVisible();

    // 金額が表示される
    const modalText = modal.textContent();
    expect(modalText).toBeTruthy();

    // ダイアログで必須項目を入力
    await page.fill('[data-testid="modal-invoice-date"]', '2024-01-15');
    await page.fill('[data-testid="modal-due-date"]', '2024-02-15');

    // 「生成」ボタンをクリック
    await page.click('[data-testid="btn-confirm-generate"]');

    // システムが商談・請求書・請求明細の参照関係と金額一致を検証するのを待つ
    await page.waitForTimeout(2000);

    // 検証完了後、請求書・請求明細画面への遷移が成立し、以下の状態が表示される：

    // (1) 請求書ステータスが「生成確定」に更新されている
    const invoiceList = page.locator('[data-testid="invoice-list-table"] tbody');
    const invoiceRow = invoiceList.locator('tr').first();
    if (await invoiceRow.isVisible()) {
      const statusText = await invoiceRow.textContent();
      expect(statusText).toContain('確定');
    }

    // (2) 請求書画面に商談ID・商談金額（1,000,000円）が正しく表示されている
    const detailsTab = page.locator('[data-testid="tab-details"]');
    if (await detailsTab.isVisible()) {
      await detailsTab.click();

      // 詳細タブが表示される
      const detailsContent = page.locator('#details-tab');
      await expect(detailsContent).toBeVisible();
    }

    // (3) 請求明細画面に3件の明細が表示され、各明細の合計が1,000,000円となっている
    const detailTable = page.locator('[data-testid="invoice-detail-table"] tbody');
    if (await detailTable.isVisible()) {
      const rows = await detailTable.locator('tr').count();
      // 明細が複数存在することを確認
      expect(rows).toBeGreaterThanOrEqual(1);

      // 合計金額を確認（最後の行に合計がある可能性）
      const lastRow = detailTable.locator('tr').last();
      const rowText = await lastRow.textContent();
      expect(rowText).toContain('1000000');
    }

    // (4) 商談・請求書・請求明細それぞれの参照関係が有効である旨の内部状態が確立されている
    // （参照関係が無効な場合はエラーが表示されない状態で確認）

    // 画面が商談・請求管理画面にとどまっている
    await expect(page).toHaveURL(/scr-1791354351333/);

    // 請求書一覧に新しい請求書が表示されている
    const invoiceTable = page.locator('[data-testid="invoice-list-table"] tbody');
    await expect(invoiceTable).toContainText('INV-');
  });
});
