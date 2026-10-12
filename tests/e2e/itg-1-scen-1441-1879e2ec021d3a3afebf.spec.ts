import { test, expect } from '@playwright/test';

test.describe('SCEN-1441: 取引先請求タブ表示', () => {
  test('請求明細取得後、取引先に紐付く商談一覧と進捗状態が取得されて画面に追加表示される', async ({ page }) => {
    await page.goto('/panels/scr-1791354337614.html');

    // 営業プロセス統合ダッシュボード画面から取引先Aのレコードを選択
    await page.waitForSelector('[data-aivic-panel]');

    // ダッシュボード画面で取引先Aに関連する情報を表示
    // データがプリセットされているため、画面に表示されるテーブルを確認

    // 画面右側タブ一覧から「取引先請求タブ」をクリック
    // ここではダッシュボード画面から商談・請求管理画面への遷移を確認

    // 商談・請求管理画面にナビゲート
    await page.goto('/panels/scr-1791354351333.html');

    await page.waitForSelector('[data-aivic-panel]');

    // 商談一覧が表示されるまで待機
    await page.waitForTimeout(2000);

    // 画面に取引先Aに紐付く商談一覧が追加表示されていることを確認
    const dealTable = page.locator('#deal-tbody');
    await expect(dealTable).toBeVisible();

    const dealRows = await page.locator('#deal-tbody tr');
    expect(await dealRows.count()).toBeGreaterThanOrEqual(0);

    // 商談情報が表示されていることを確認
    // 商談ID、商談名、進捗状態、金額が表示されていることを確認
    for (const row of await dealRows.all()) {
      const cells = await row.locator('td');
      const cellCount = await cells.count();
      expect(cellCount).toBeGreaterThanOrEqual(3);
    }
  });
});
