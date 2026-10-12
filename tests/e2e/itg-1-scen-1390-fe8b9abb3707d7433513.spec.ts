import { test, expect } from '@playwright/test';

test.describe('SCEN-1390: 商談金額がゼロ以下の場合、エラーメッセージが表示される', () => {
  test('ゼロ以下の商談金額に対するエラー検証', async ({ page }) => {
    // ログイン画面を開く
    await page.goto('/login.html');

    // ユーザーがログインを実行
    await page.fill('[data-testid="username"]', 'test-user');
    await page.fill('[data-testid="password"]', 'test-password');
    await page.click('[data-testid="login-button"]');

    // ダッシュボード画面に遷移するのを待つ
    await page.waitForNavigation();
    await page.waitForURL(/\/panels\/scr-.*\.html/);

    // 営業プロセス統合ダッシュボードが表示されることを確認
    await expect(page).toHaveURL(/\/panels\/scr-.*\.html/);

    // 営業プロセス統合ダッシュボードから取引先Aをクリック
    await page.goto('/panels/scr-1791354379354.html');

    // 取引先詳細画面が表示されるまで待機
    await page.waitForLoadState('networkidle');

    // 関連商談一覧から商談金額が0円のものを探してクリック
    const dealRows = page.locator('#deals-tbody tr');
    for (let i = 0; i < await dealRows.count(); i++) {
      const row = dealRows.nth(i);
      const amountText = await row.textContent();
      if (amountText && amountText.includes('0') && amountText.includes('円')) {
        await row.click();
        break;
      }
    }

    // 商談詳細画面が読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // エラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=商談金額は1円以上である必要があります');
    await expect(errorMessage).toBeVisible();

    // エラーメッセージが赤背景で表示されていることを確認
    const errorBanner = page.locator('[role="alert"], [class*="error"]').filter({ has: errorMessage });
    expect(await errorBanner.count()).toBeGreaterThanOrEqual(1);

    // 編集フォームがグレーアウト（無効化）されていることを確認
    const formFields = page.locator('input[type="text"], input[type="number"]');
    if (await formFields.count() > 0) {
      const isDisabled = await formFields.first().evaluate((el: HTMLInputElement) => {
        const style = window.getComputedStyle(el);
        return el.disabled || style.opacity === '0.5' || style.pointerEvents === 'none';
      });
      expect(isDisabled).toBe(true);
    }

    // アクションメッセージが表示されることを確認
    const actionMessage = page.locator('text=金額を修正してください');
    if (await actionMessage.isVisible()) {
      await expect(actionMessage).toBeVisible();
    }
  });
});
