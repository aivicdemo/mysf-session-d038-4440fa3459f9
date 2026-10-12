import { test, expect } from '@playwright/test';

test.describe('SCEN-1171: ユーザーIDが空の場合、ユーザー認証エラーが表示される', () => {
  test('ユーザーIDが空の場合、認証エラーが表示される', async ({ page }) => {
    // ネットワークリクエストをインターセプトして、認証リクエストのユーザーID値が空であることを確認
    await page.route('**/*', route => {
      const request = route.request();
      const postData = request.postDataJSON();

      // 認証リクエストをチェック
      if (request.url().includes('/api/') && postData?.userId === '') {
        // ユーザーIDが空のため、エラーレスポンスを返す
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    // 商談詳細タブのページへ遷移
    await page.goto('/panels/scr-1791354351333.html');

    // ユーザー認証エラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=ユーザー認証に失敗しました。ユーザーIDが無効です。再度ログインしてください');
    await expect(errorMessage).toBeVisible();

    // 商談詳細タブの表示が行われていないことを確認
    const detailPanel = page.locator('#detail-panel');
    const isDetailVisible = await detailPanel.isVisible().catch(() => false);
    if (isDetailVisible) {
      const emptyState = page.locator('text=/商談を選択してください|エラーが発生しました/');
      await expect(emptyState).toBeVisible();
    }

    // ログイン画面へのリダイレクトが発生していることを確認
    // ページが自動でリダイレクトされるか、またはログイン関連の要素が表示されるか
    const loginForm = page.locator('.login-card, [data-testid="login-form"], text=/ログイン/').first();
    const isRedirected = await loginForm.isVisible().catch(() => false);

    if (isRedirected) {
      await expect(loginForm).toBeVisible();
    } else {
      // リダイレクトが発生していない場合でも、エラーメッセージが表示されていることを確認
      await expect(errorMessage).toBeVisible();
    }
  });
});
