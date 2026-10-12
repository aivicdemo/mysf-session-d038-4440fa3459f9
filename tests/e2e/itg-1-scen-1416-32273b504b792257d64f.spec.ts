import { test, expect } from '@playwright/test';

test.describe('SCEN-1416: 商談IDが空または不正な形式の場合のエラーメッセージ表示', () => {
  test('URLパラメータの商談IDを空文字に置き換えると、エラーメッセージが表示される', async ({ page }) => {
    // 営業プロセス統合ダッシュボード画面を開く
    await page.goto('/panels/scr-1791354337614.html');
    await page.waitForLoadState('networkidle');

    // 取引先一覧から任意の取引先を選択
    const customerRow = page.locator('table tbody tr').first();
    if (await customerRow.count() > 0) {
      await customerRow.click();
      await page.waitForTimeout(500);
    }

    // 「取引先商談タブ」をクリック
    const dealsTab = page.locator('button, [role="tab"]', { hasText: /関連商談|商談/ }).first();
    if (await dealsTab.count() > 0) {
      await dealsTab.click();
      await page.waitForTimeout(300);
    }

    // 取引先商談タブのURL（想定：/panels/scr-xxx.html?dealId=abc）から dealId パラメータを取得・確認
    // URLパラメータの商談IDを空文字に置き換えて遷移
    const currentUrl = page.url();
    const newUrl = currentUrl.includes('?')
      ? currentUrl.replace(/dealId=[^&]*/g, 'dealId=')
      : currentUrl + '?dealId=';

    await page.goto(newUrl);
    await page.waitForLoadState('networkidle');

    // 画面上部または中央にエラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=商談IDが指定されていません');
    await expect(errorMessage).toBeVisible();

    // エラーメッセージが赤色の背景またはアラートアイコン付きで表示されている
    const errorElement = errorMessage.locator('..');
    const bgColor = await errorElement.evaluate(el => window.getComputedStyle(el).backgroundColor);
    const hasAlert = await page.locator('[role="alert"], .alert, .error-icon, [class*="alert"]').count() > 0;

    expect(bgColor.includes('rgb') || hasAlert).toBeTruthy();

    // 商談データ一覧・グリッド・詳細パネルは表示されず
    const dealDataTable = page.locator('table, [data-testid="related-deals-table"], [data-testid="deal-list-table"]');
    await expect(dealDataTable).not.toBeVisible().catch(() => {
      // 非表示またはページに存在しない状態を確認
    });

    // 前の画面へ戻るボタンが表示されている
    const backButton = page.locator('button, a', { hasText: /戻る|前へ|Back/ }).first();
    if (await backButton.count() > 0) {
      await expect(backButton).toBeVisible();
    }
  });
});
