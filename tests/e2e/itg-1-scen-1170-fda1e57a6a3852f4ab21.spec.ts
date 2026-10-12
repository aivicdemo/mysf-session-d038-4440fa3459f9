import { test, expect } from '@playwright/test';

test.describe('SCEN-1170: 権限なしユーザーが商談詳細タブ表示を試みると、アクセスが拒否される', () => {
  test('権限のないユーザーのアクセスは拒否される', async ({ page }) => {
    // ログイン前（未認証）のため、商談詳細タブへの直接アクセスを試みる
    const response = await page.goto('/panels/scr-1791354351333.html');

    // HTTPレスポンスステータスを確認（401 Unauthorized または 403 Forbidden）
    if (response?.status() === 401 || response?.status() === 403) {
      // エラーメッセージが表示されることを確認
      const errorText = page.locator('text=/HTTP 40[13]|アクセス権限がありません|このページにアクセスする権限がありません/');
      await expect(errorText).toBeVisible();
    } else {
      // ページが読み込まれた場合、ダッシュボード画面に留まっていることを確認
      // または、エラーメッセージが表示されることを確認
      const dashboardSection = page.locator('[data-aivic-panel]');
      const hasError = await page.locator('text=/アクセス権限がありません|このページにアクセスする権限がありません/').isVisible().catch(() => false);

      if (!hasError) {
        // ダッシュボード画面に留まっていることを確認
        await expect(dashboardSection).toBeVisible();
      }
    }

    // 商談詳細タブの内容が表示されていないことを確認
    const detailPanel = page.locator('#detail-panel');
    const isDetailPanelVisible = await detailPanel.isVisible().catch(() => false);

    if (isDetailPanelVisible) {
      // もしディテールパネルが表示されている場合、その中身は空またはエラー表示であるべき
      const emptyState = page.locator('text=/商談を選択してください|エラーが発生しました/');
      await expect(emptyState).toBeVisible();
    }
  });
});
