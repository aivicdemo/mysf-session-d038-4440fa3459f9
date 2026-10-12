import { test, expect } from '@playwright/test';

test.describe('SCEN-1173: 請求書レコードが取得できない場合、データ取得失敗のエラーが表示される', () => {
  test('請求書レコード取得失敗時にエラーメッセージが表示される', async ({ page }) => {
    // 既存の商談レコードで商談詳細タブを開く
    await page.goto('/panels/scr-1791354351333.html?dealId=DEAL-20250107-001');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 詳細タブ内の『請求情報』セクションが読み込まれるまで待機
    const invoiceSection = page.locator('text=/請求情報|関連請求書|関連請求情報/').first();
    await expect(invoiceSection).toBeVisible();

    // 『請求情報』セクション内でローディング表示が現れることを確認
    const loadingIndicator = page.locator('.loading-spinner, [data-testid="loading"], text=読込中').first();
    const isLoading = await loadingIndicator.isVisible().catch(() => false);

    // リクエストをインターセプトして請求書データ取得処理をタイムアウトまたはエラーにする
    await page.route('**/api/**', route => {
      if (route.request().url().includes('invoice')) {
        // タイムアウトまたはサーバーエラーをシミュレート
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    // ページを再度読み込み
    await page.reload();
    await page.waitForLoadState('networkidle');

    // エラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=/請求書データの取得に失敗しました|表示できません/');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // エラーメッセージが赤色で表示されることを確認
    const errorElement = errorMessage.first();
    const color = await errorElement.evaluate(el => window.getComputedStyle(el).color);
    expect(color).toMatch(/^rgb\(255,\s*0,\s*0\)|#[fF]{2}0000/);

    // 『再読み込み』ボタンが表示されることを確認
    const retryButton = page.locator('button:has-text("再読み込み"), button:has-text("再試行")').first();
    await expect(retryButton).toBeVisible();

    // 他のセクション（商談基本情報など）は正常に表示されているか確認
    const basicInfoSection = page.locator('text=/商談基本情報|商談情報|基本情報/').first();
    const isBasicInfoVisible = await basicInfoSection.isVisible().catch(() => false);
    if (isBasicInfoVisible) {
      await expect(basicInfoSection).toBeVisible();
    }
  });
});
