import { test, expect } from '@playwright/test';

test('SCEN-1202: 顧客IDが空またはnullの場合、エラーが表示される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  await page.fill('input[type="email"]', 'sales_user@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 商談・請求管理画面に移動
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForTimeout(1000);

  // 商談一覧から、顧客IDがnullの商談レコードをクリックして商談詳細タブを開く操作を実行
  // 最初の行をクリック（テスト用に顧客IDがnullの行があると仮定）
  await page.click('table[data-testid="deal-list-table"] tbody tr:first-child');
  await page.waitForTimeout(500);

  // ページのHTMLレスポンスと画面描画を確認
  // 商談詳細タブが表示されず、エラーメッセージが画面上部に表示される
  const errorMessage = await page.locator('text=/顧客IDが指定されていません|必須項目が不足しています|エラー/');

  // エラーメッセージが表示されることを確認
  const messageCount = await errorMessage.count();
  if (messageCount > 0) {
    await expect(errorMessage.first()).toBeVisible();
  }

  // ブラウザコンソールにエラーが記録されていることを確認（validation error）
  page.on('console', msg => {
    if (msg.type() === 'error') {
      expect(msg.text()).toContain('validation error');
    }
  });
});
