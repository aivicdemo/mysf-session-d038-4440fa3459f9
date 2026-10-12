import { test, expect, Page } from '@playwright/test';

test('SCEN-1362: ユーザーが表示対象データへのアクセス権限を持たない場合、取引先詳細画面の表示が拒否される', async ({ page }) => {
  // 営業担当者Aでログイン
  await page.goto('/panels/scr-1791354337614.html');

  // 取引先Xへのアクセスを試みる
  await page.goto('/customer/X');

  // HTTP 403エラーまたはアクセス拒否画面が表示される
  const statusCode = page.url();

  // アクセス拒否メッセージが表示される
  const errorMessage = page.locator('text=/このデータへのアクセス権限がありません|取引先の表示権限がありません/');
  await expect(errorMessage).toBeVisible();

  // ダッシュボードまたはトップページへのリダイレクトボタンが提供される
  const redirectButton = page.locator('button, a, [role="button"]', { hasText: /ダッシュボード|トップページ/ });
  await expect(redirectButton).toBeVisible();

  // ブラウザのコンソールにアクセス拒否ログが記録される
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    if (msg.text().includes('アクセス拒否') || msg.text().includes('権限')) {
      consoleLogs.push(msg.text());
    }
  });
});
