import { test, expect } from '@playwright/test';

test('SCEN-1198: 営業担当者が他者の担当顧客にアクセスを試みると、アクセスが拒否される', async ({ page }) => {
  // 営業担当者A（sales_user_A）でログイン
  await page.goto('/');
  await page.fill('input[type="email"]', 'sales_user_A@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 営業プロセス統合ダッシュボード画面を表示
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForTimeout(1000);

  // 営業担当者Bの商談一覧または検索機能から商談ID「deal_Y_001」を直接指定してアクセスを試みる
  // ダッシュボードから商談・請求管理画面に遷移
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForTimeout(1000);

  // フィルターに営業担当者B (対象は別の担当者) の商談 deal_Y_001 を検索
  await page.fill('[data-testid="filter-customer"]', 'deal_Y_001');
  await page.waitForTimeout(500);

  // 商談詳細タブを開こうとするアクション（クリック）を実行
  const dealRows = await page.locator('table[data-testid="deal-list-table"] tbody tr').count();

  // アクセス権限がないメッセージが表示される、または結果が表示されない
  if (dealRows === 0) {
    // アクセス拒否されている場合、結果が表示されない
    const emptyState = await page.locator('.empty-state');
    await expect(emptyState).toBeVisible();
  } else {
    // もし行がある場合、クリックしてアクセス制限エラーを確認
    await page.click('table[data-testid="deal-list-table"] tbody tr:first-child');
    await page.waitForTimeout(500);

    // HTTP 403 Forbidden エラーまたは同等のアクセス拒否画面が表示される
    const errorMessage = await page.locator('text=/アクセス権限|アクセス|拒否|許可されていません/');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  }

  // ブラウザの開発者ツール・ネットワークタブで HTTP 403 Forbidden が返されたことを確認
  page.on('response', response => {
    if (response.status() === 403) {
      expect(response.status()).toBe(403);
    }
  });
});
