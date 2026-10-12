import { test, expect } from '@playwright/test';

test.describe('SCEN-1449: 商談金額と請求金額が完全に一致する場合', () => {
  test('差異フラグが立たず、正常な連携状態として表示される', async ({ page }) => {
    // ブラウザで営業プロセス統合ダッシュボードにアクセス
    await page.goto('/login.html');
    await page.fill('[name="username"]', 'test_user');
    await page.fill('[name="password"]', 'test_password');
    await page.click('button:has-text("ログイン")');

    // ダッシュボード左側の取引先一覧から「テスト商社001」をクリック
    await page.goto('/panels/scr-1791354379354.html');

    // テスト商社001を検索・選択
    const customerSearch = page.locator('#search-field');
    await customerSearch.fill('テスト商社001');

    const customerRow = page.locator('#customer-tbody tr').first();
    await customerRow.click();

    // 「取引先請求タブ」をクリックして開く
    await page.click('[data-tab="invoices"]');
    await page.waitForSelector('#invoices-tab.active');

    // 表示された請求情報一覧から「INV-2026-0001」の行を確認
    const invoiceTable = page.locator('[data-testid="invoice-info-table"]');
    const invRow = invoiceTable.locator('tbody tr').filter({ has: page.locator('text=INV-2026-0001') });
    await expect(invRow).toBeVisible();

    // 差異フラグ列が空白またはチェックなしであることを確認
    // 正常な連携状態のアイコン・バッジ（例：緑色のチェックマークまたは「正常」ラベル）が表示されることを確認
    const statusCell = invRow.locator('td').nth(4);
    const statusText = await statusCell.textContent();

    // 差異フラグが立っていない、または正常状態を示すラベルが表示されていることを確認
    expect(statusText || '').toMatch(/^(正常|✓|チェック|)$/);

    // 行の背景色が通常の行（異常検知の色分けなし）として描画されていることを確認
    await expect(invRow).not.toHaveCSS('background-color', /rgb\(255,\s*200,\s*0\)|rgb\(255,\s*165,\s*0\)/);
  });
});
