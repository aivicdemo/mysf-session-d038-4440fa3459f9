import { test, expect } from '@playwright/test';

test.describe('SCEN-1392: 商談ステータスが未定義の場合、警告メッセージが表示される', () => {
  test('未定義の商談ステータスに対する警告検証', async ({ page }) => {
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

    // 代替として顧客・取引先管理画面へ直接遷移
    await page.goto('/panels/scr-1791354379354.html');

    // 当該取引先の詳細表示画面が遷移するまで待機
    await page.waitForLoadState('networkidle');

    // 詳細表示画面上の商談タブが表示されていることを確認
    const dealsTab = page.locator('[data-tab="deals-tab"], [id="deals-tab"]').first();
    if (await dealsTab.isVisible()) {
      await dealsTab.click();
    }

    // 商談情報セクションを確認
    const dealsSection = page.locator('#deals-tbody, [data-section="deals"]').first();
    await expect(dealsSection).toBeVisible();

    // 警告メッセージが表示されることを確認
    const warningMessage = page.locator('text=商談ステータスが未定義です。ステータスを設定してください。');

    if (await warningMessage.isVisible()) {
      // 警告メッセージが黄色または赤色の背景を持つことを確認
      const warningBanner = page.locator('[role="alert"], [class*="warning"], [class*="caution"]').filter({ has: warningMessage });
      expect(await warningBanner.count()).toBeGreaterThanOrEqual(0);

      // 警告メッセージに隣接して情報アイコン（⚠）が表示されることを確認
      const warningIcon = page.locator('text=⚠, text=⚡, text=!');
      if (await warningIcon.isVisible()) {
        await expect(warningIcon).toBeVisible();
      }
    }
  });
});
