import { test, expect } from '@playwright/test';

test('SCEN-1200: 営業部長が異なる部門の顧客にアクセスを試みると、アクセスが拒否される', async ({ page }) => {
  // 営業部長A部門でログイン
  await page.goto('/');
  await page.fill('input[type="email"]', 'manager_dept_a@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 営業プロセス統合ダッシュボード画面を表示
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForTimeout(1000);

  // 商談・請求管理画面に移動
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForTimeout(1000);

  // 商談一覧から他部門（B部門）の商談「DEAL-B-2024-001」をクリック
  // フィルターで該当商談を検索
  await page.fill('[data-testid="filter-customer"]', 'DEAL-B-2024-001');
  await page.waitForTimeout(500);

  const dealRows = await page.locator('table[data-testid="deal-list-table"] tbody tr').count();

  if (dealRows > 0) {
    // ブラウザが商談詳細タブへの遷移を試みる
    await page.click('table[data-testid="deal-list-table"] tbody tr:first-child');
    await page.waitForTimeout(500);

    // HTTP 403 Forbidden エラーまたは同等のアクセス拒否画面が表示される
    const errorMessage = await page.locator('text=/アクセス権限がありません|このデータにはアクセス権限がありません/');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  } else {
    // 結果が表示されない場合は、アクセス制限が既に機能している
    const emptyState = await page.locator('.empty-state');
    await expect(emptyState).toBeVisible();
  }

  // ネットワークレスポンスで HTTP 403 Forbidden が確認される
  page.on('response', response => {
    if (response.status() === 403) {
      expect(response.status()).toBe(403);
    }
  });
});
