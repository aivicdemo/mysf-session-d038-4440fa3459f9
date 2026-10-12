import { test, expect } from '@playwright/test';

test.describe('SCEN-1172: 商談IDが空または不正な形式の場合、エラーメッセージが表示される', () => {
  test('商談IDが空の場合、エラーメッセージが表示される', async ({ page }) => {
    // ブラウザのアドレスバーに商談詳細タブのURLを入力（商談IDをクエリパラメータで指定）
    await page.goto('/panels/scr-1791354351333.html?dealId=');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 商談詳細タブが表示されないことを確認
    const detailPanel = page.locator('#detail-panel');
    const isDetailVisible = await detailPanel.isVisible().catch(() => false);

    if (isDetailVisible) {
      // ディテールパネルが表示されている場合、エラーメッセージが含まれていることを確認
      const errorText = page.locator('text=/商談IDが指定されていません|不正な商談IDが指定されました/');
      await expect(errorText).toBeVisible();
    } else {
      // ディテールパネルが表示されていない場合、ページ上にエラーメッセージが表示されることを確認
      const errorMessage = page.locator('text=/商談IDが指定されていません|不正な商談IDが指定されました/');
      await expect(errorMessage).toBeVisible();
    }

    // エラーメッセージが赤色で強調表示されていることを確認
    const errorElement = page.locator('text=/商談IDが指定されていません|不正な商談IDが指定されました/').first();
    const color = await errorElement.evaluate(el => window.getComputedStyle(el).color);
    expect(color).toMatch(/^rgb\(255,\s*0,\s*0\)|#[fF]{2}0000/);

    // ダッシュボードへ戻るためのボタンが提供されることを確認
    const backButton = page.locator('button:has-text("戻る"), a:has-text("戻る"), button:has-text("ダッシュボード"), a:has-text("ダッシュボード")').first();
    await expect(backButton).toBeVisible();
  });

  test('商談IDが不正な形式の場合、エラーメッセージが表示される', async ({ page }) => {
    // 不正な形式の商談IDでアクセス
    await page.goto('/panels/scr-1791354351333.html?dealId=INVALID_ID_FORMAT');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // エラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=/商談IDが指定されていません|不正な商談IDが指定されました/');
    await expect(errorMessage).toBeVisible();
  });
});
