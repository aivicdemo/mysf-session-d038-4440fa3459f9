import { test, expect } from '@playwright/test';

test.describe('SCEN-1417: 商談ステータスが不正な値の場合のエラーメッセージ表示', () => {
  test('商談ステータスが定義済みの値以外の場合、エラーメッセージが表示される', async ({ page }) => {
    // 顧客・取引先管理画面を開く
    await page.goto('/panels/scr-1791354379354.html');
    await page.waitForLoadState('networkidle');

    // 対象の取引先レコードを選択・表示
    const customerRow = page.locator('table tbody tr').first();
    if (await customerRow.count() > 0) {
      await customerRow.click();
      await page.waitForTimeout(500);
    }

    // 取引先レコード内の「商談タブ」をクリック・選択
    const dealsTab = page.locator('button, [role="tab"]', { hasText: /関連商談|商談|deals|tab-deals/ });
    if (await dealsTab.count() > 0) {
      await dealsTab.first().click();
      await page.waitForTimeout(500);
    }

    // ブラウザが商談タブの表示を試みる
    await page.waitForLoadState('networkidle');

    // 商談ステータスが不正な値で初期化された状況をシミュレート
    // ページ内で不正なステータス値を含むデータを検出するか、APIをインターセプト
    await page.evaluate(() => {
      // テスト用: 不正なステータスを持つ商談データを注入
      window.sessionStorage.setItem('invalidDealStatus', 'INVALID_STATUS_XXXX');
    });

    // ページを再読み込み
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 商談タブ表示領域にエラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=商談ステータスが不正です');
    await expect(errorMessage).toBeVisible();

    // エラーメッセージのみが視認可能で、商談一覧データは表示されない
    const dealTable = page.locator('table, [data-testid="related-deals-table"]');
    const dealRows = dealTable.locator('tbody tr');

    // テーブルが存在しないか、エラーメッセージのみの状態
    if (await dealTable.count() > 0) {
      const visibleRows = dealRows.locator('xpath=.//*[not(contains(@class, "empty-state"))]');
      expect(await visibleRows.count()).toBe(0);
    }
  });
});
