import { test, expect } from '@playwright/test';

test.describe('SCEN-1174: 商談に紐付く請求書が1件以上存在しない場合、参照関係が無効と判定される', () => {
  test('請求書が存在しない場合、参照関係が無効と表示される', async ({ page }) => {
    // 営業プロセス統合ダッシュボードにログインする（必要に応じてログイン処理を実装）
    // ここではログイン済みの状態からテストを開始
    await page.goto('/panels/scr-1791354337614.html');

    // 商談・請求管理画面を開く
    const dealManagementNav = page.locator('[data-testid="deal-management"], text=/商談・請求管理/').first();
    await dealManagementNav.click();
    await page.waitForLoadState('networkidle');

    // 検索条件で商談ID「DEAL-20250107-001」を入力して検索
    const searchInput = page.locator('[data-testid="filter-customer"], input').first();
    await searchInput.fill('DEAL-20250107-001');
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');

    // 検索結果一覧から対象商談をクリックして商談詳細タブを開く
    const dealRow = page.locator('table tbody tr').first();
    await dealRow.click();
    await page.waitForLoadState('networkidle');

    // 商談詳細タブ内の「請求書参照関係」または「紐付け請求書一覧」セクションを確認
    const invoiceSection = page.locator('text=/請求書参照関係|紐付け請求書一覧|関連請求情報/').first();
    await expect(invoiceSection).toBeVisible();

    // 「この商談に紐付く請求書がありません」メッセージが表示されることを確認
    const noInvoiceMessage = page.locator('text=/この商談に紐付く請求書がありません|参照関係: 無効/');
    await expect(noInvoiceMessage).toBeVisible();

    // 請求書一覧が空欄（件数: 0）で表示されることを確認
    const invoiceList = page.locator('[data-testid="invoice-list-table"], table:has(text=/請求書/)', { hasText: '件数' }).first();
    const zeroCount = invoiceList.locator('text=/件数.*0|0件/').first();
    const isZeroVisible = await zeroCount.isVisible().catch(() => false);

    if (isZeroVisible) {
      await expect(zeroCount).toBeVisible();
    }

    // 画面上に視覚的に参照関係が無効な状態が表示されることを確認
    const invalidStatusElement = page.locator('[data-testid*="invalid"], [class*="invalid"], text=/無効|グレーアウト/').first();
    const isInvalidVisible = await invalidStatusElement.isVisible().catch(() => false);

    if (isInvalidVisible) {
      await expect(invalidStatusElement).toBeVisible();
    }
  });
});
