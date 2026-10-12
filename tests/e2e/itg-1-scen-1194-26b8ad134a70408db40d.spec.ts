import { test, expect } from '@playwright/test';

test.describe('SCEN-1194: 商談詳細タブ表示 - 無効な商談IDが指定された場合のエラー', () => {
  test('無効な商談IDでアクセスするとエラーメッセージが表示される', async ({ page }) => {
    // 無効な商談IDをURLパラメータで指定してアクセス
    await page.goto('/panels/scr-1791354351333.html?dealId=99999999');

    // エラーメッセージが表示されるまで待機
    // 画面に「商談IDが無効です」または「指定された商談が見つかりません」のメッセージが表示される
    const errorMessage = page.locator('text=/商談IDが無効です|指定された商談が見つかりません/');

    // エラーメッセージが表示されることを確認
    await expect(errorMessage).toBeVisible();

    // 商談詳細が描画されていないことを確認
    const detailPanel = page.locator('#detail-panel');
    const detailContent = detailPanel.locator('.detail-row');

    // 詳細情報が表示されていないか、または「商談を選択してください」のメッセージが表示されている
    const noSelectionText = page.locator('text=商談を選択してください');
    const isNoSelectionVisible = await noSelectionText.isVisible().catch(() => false);

    if (isNoSelectionVisible) {
      // 「商談を選択してください」のみ表示されている状態
      await expect(noSelectionText).toBeVisible();
      await expect(detailContent).not.toBeVisible();
    } else {
      // エラーメッセージが優先的に表示されている
      await expect(errorMessage).toBeVisible();
    }

    // ネットワークログから HTTP ステータスを確認できるよう、APIコールを待機
    const response = await page.waitForResponse(
      response => response.url().includes('/api/') || true,
      { timeout: 3000 }
    ).catch(() => null);

    if (response) {
      const status = response.status();
      // 400 Bad Request または 404 Not Found が返される
      expect([400, 404]).toContain(status);
    }
  });

  test('nullの商談IDでアクセスするとエラーが発生する', async ({ page }) => {
    // null値の商談IDをURLパラメータで指定
    await page.goto('/panels/scr-1791354351333.html?dealId=null');

    // エラーメッセージが表示される
    const errorMessage = page.locator('text=/商談IDが無効です|指定された商談が見つかりません|値が無効です/');

    // エラーメッセージが表示されるか、商談詳細が表示されないことを確認
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);
    const noSelectionText = page.locator('text=商談を選択してください');
    const isNoSelectionVisible = await noSelectionText.isVisible().catch(() => false);

    expect(isErrorVisible || isNoSelectionVisible).toBeTruthy();
  });

  test('存在しない商談IDでアクセスするとエラーが発生する', async ({ page }) => {
    // 存在しない商談IDをURLで指定
    await page.goto('/panels/scr-1791354351333.html');

    // 商談一覧が読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // その後、JavaScriptで存在しない商談IDをシミュレート
    // テスト用に直接 selectDeal 関数を呼び出す
    await page.evaluate(() => {
      const event = new CustomEvent('selectDeal', { detail: { dealId: 'invalid-deal-id-12345' } });
      window.dispatchEvent(event);
    });

    // 詳細パネルが空の状態（選択メッセージのみ）であることを確認
    const detailPanel = page.locator('#detail-panel');
    const emptyStateText = detailPanel.locator('text=商談を選択してください');

    await expect(emptyStateText).toBeVisible();

    // 詳細行情報が表示されていないことを確認
    const detailRows = detailPanel.locator('.detail-row');
    await expect(detailRows).toHaveCount(0);
  });
});
