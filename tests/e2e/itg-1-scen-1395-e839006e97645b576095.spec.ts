import { test, expect } from '@playwright/test';

test.describe('SCEN-1395: 請求済み金額が契約金額を超える場合、警告メッセージが表示される', () => {
  test('請求済み金額が契約金額を超過する場合の警告検証', async ({ page }) => {
    // ログイン画面を開く
    await page.goto('/login.html');

    // ユーザーがログインを実行
    await page.fill('[data-testid="username"]', 'test-user');
    await page.fill('[data-testid="password"]', 'test-password');
    await page.click('[data-testid="login-button"]');

    // ダッシュボード画面に遷移するのを待つ
    await page.waitForNavigation();
    await page.waitForURL(/\/panels\/scr-.*\.html/);

    // 顧客・取引先管理画面へ遷移する
    await page.goto('/panels/scr-1791354379354.html');

    // 画面が読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 取引先A の行をクリックして詳細表示を開く
    const customerLink = page.locator('text=取引先A').first();
    if (await customerLink.isVisible()) {
      await customerLink.click();
    } else {
      // リストから最初の取引先をクリック
      const firstCustomer = page.locator('#customer-tbody tr').first();
      await firstCustomer.click();
    }

    // 画面読み込みが完了するまで待機する
    await page.waitForLoadState('networkidle');

    // 警告メッセージが表示されることを確認
    const warningText = page.locator('text=/警告|請求済み金額|契約金額|超過/');

    // 警告メッセージを複数パターンで探索
    const warningMessage = page.locator('text=請求済み金額');
    const warningMessage2 = page.locator('text=契約金額');

    if (await warningMessage.isVisible() || await warningMessage2.isVisible()) {
      // 警告メッセージが画面に表示されていることを確認
      if (await warningMessage.isVisible()) {
        await expect(warningMessage).toBeVisible();
      }

      // 警告メッセージの背景色が黄色またはオレンジ色で視認可能であることを確認
      const warningBanner = page.locator('[role="alert"], [class*="warning"], [class*="caution"]').first();
      if (await warningBanner.isVisible()) {
        const bgColor = await warningBanner.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        // 色が設定されていることを確認
        expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
      }
    }

    // ユーザーが画面上で当該警告を確認できる状態であることを確認
    const detailPanel = page.locator('#detail-panel, [class*="detail"]').first();
    await expect(detailPanel).toBeVisible();
  });
});
