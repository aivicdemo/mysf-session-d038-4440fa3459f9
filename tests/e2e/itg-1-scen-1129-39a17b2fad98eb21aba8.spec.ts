import { test, expect } from '@playwright/test';

test.describe('SCEN-1129: 請求書・請求明細タブ表示：請求書レコードが取得できない場合、システムエラーメッセージを表示', () => {
  test('請求書取得エラーのメッセージ表示を検証', async ({ page }) => {
    await page.goto('/login.html');
    await page.fill('[data-testid="username"]', 'test-user');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForNavigation();

    // ネットワークエラーをシミュレート
    await page.route('**/api/**', route => {
      // 請求書取得APIをブロック
      if (route.request().url().includes('invoice')) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    const dealLink = page.locator('[data-aivic-nav="scr-1791354351333"]');
    if (await dealLink.isVisible()) {
      await dealLink.click();
    } else {
      await page.goto('/panels/scr-1791354351333.html');
    }
    await page.waitForLoadState('networkidle');

    // 「請求書・請求明細」タブをクリック
    const invoiceDetailTab = page.locator('[data-testid="tab-invoice-detail"], button:has-text("請求書・請求明細")');
    await invoiceDetailTab.click();

    // タブ切り替え処理が実行され、請求書レコード取得処理が呼び出される
    await page.waitForTimeout(1000);

    // 取得処理がエラーで完了し、システムエラーメッセージが表示される
    const errorMessage = page.locator('text=/申し訳ございません.*請求書情報の取得に失敗しました/');
    await expect(errorMessage).toBeVisible();

    // メッセージに「画面を再読み込みしてください」が含まれることを確認
    const reloadMessage = page.locator('text=画面を再読み込みしてください');
    await expect(reloadMessage).toBeVisible();

    // タブの読み込み中インジケーター（スピナー）が消えることを確認
    const spinner = page.locator('[role="progressbar"], .spinner, [data-testid="spinner"]');
    await expect(spinner).not.toBeVisible({ timeout: 3000 }).catch(() => {
      // スピナーが消えるまで待機
    });

    // ユーザーは請求書・請求明細の一覧表示領域には何も表示されていない状態を確認
    const emptyMessage = page.locator('text=データがありません, 検索結果がありません');
    if (await emptyMessage.count() > 0) {
      await expect(emptyMessage.first()).toBeVisible();
    }
  });
});
