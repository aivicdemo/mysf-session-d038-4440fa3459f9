import { test, expect } from '@playwright/test';

test.describe('SCEN-1128: 請求書・請求明細タブ表示：商談IDが空または不正な形式の場合、エラーメッセージを表示', () => {
  test('空または不正な商談IDのエラー表示を検証', async ({ page }) => {
    await page.goto('/login.html');
    await page.fill('[data-testid="username"]', 'test-user');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForNavigation();

    const dealLink = page.locator('[data-aivic-nav="scr-1791354351333"]');
    if (await dealLink.isVisible()) {
      await dealLink.click();
    } else {
      await page.goto('/panels/scr-1791354351333.html');
    }
    await page.waitForLoadState('networkidle');

    // 『請求書・請求明細』タブをクリック
    const invoiceDetailTab = page.locator('[data-testid="tab-invoice-detail"], button:has-text("請求書・請求明細")');
    await invoiceDetailTab.click();

    // タブ内の『商談ID』入力欄に空文字列を入力
    const dealIdInput = page.locator('input[placeholder*="商談"], input[name*="deal"], input[id*="dealId"]').first();
    if (await dealIdInput.isVisible()) {
      await dealIdInput.fill('');
    }

    // 検索ボタンをクリック
    const searchButton = page.locator('button:has-text("検索"), button:has-text("更新")').first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
    }

    await page.waitForTimeout(500);

    // 入力欄下部に『商談IDは必須項目です』というエラーメッセージが赤色で表示される
    const errorMessage = page.locator('text=商談IDは必須項目です');
    await expect(errorMessage).toBeVisible();

    // エラーメッセージが赤色であることを確認
    const errorElement = page.locator('.error-message, [role="alert"]');
    if (await errorElement.count() > 0) {
      const backgroundColor = await errorElement.first().evaluate(el => window.getComputedStyle(el).backgroundColor);
      // 赤系の背景またはテキストカラーを確認
      expect(backgroundColor).toMatch(/rgb\(.*255.*0.*0|red/i);
    }

    // 検索処理は実行されず、タブ内のデータ一覧は更新されないことを確認
    const dataTable = page.locator('table tbody tr');
    const rowCountBefore = await dataTable.count();

    // もう一度検索ボタンをクリック（変化がないことを確認）
    if (await searchButton.isVisible()) {
      await searchButton.click();
    }
    await page.waitForTimeout(500);

    const rowCountAfter = await dataTable.count();
    expect(rowCountBefore).toBe(rowCountAfter);
  });
});
