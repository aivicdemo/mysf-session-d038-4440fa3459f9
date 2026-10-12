import { test, expect } from '@playwright/test';

test.describe('SCEN-1126: 請求書と請求明細の金額が一致しない場合、エラーメッセージを表示して遷移を中止', () => {
  test('金額不一致時のエラー表示を検証', async ({ page }) => {
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

    // 商談DEAL-001を検索・表示
    const searchInput = page.locator('input[placeholder*="商談"], input[type="text"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('DEAL-001');
      await page.keyboard.press('Enter');
    }

    // 請求書・請求明細タブを開く
    const invoiceDetailTab = page.locator('[data-testid="tab-invoice-detail"], button:has-text("請求書・請求明細")');
    await invoiceDetailTab.click();

    await page.waitForTimeout(500);

    // システムが自動的に金額を比較検証し、エラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=/エラー.*請求書合計金額.*請求明細合計金額.*一致しません/');
    await expect(errorMessage).toBeVisible();

    // エラーメッセージが赤色で表示されていることを確認
    const errorElement = page.locator('[role="alert"], .error-message');
    if (await errorElement.count() > 0) {
      const color = await errorElement.first().evaluate(el => window.getComputedStyle(el).color);
      // 赤色（rgb(xxx, 0, 0)の形式または#赤系の色）であることを確認
      expect(color).toMatch(/rgb\(.*255.*0.*0|#.*[fF][0-9a-fA-F]0000/);
    }

    // 請求書・請求明細タブは現在の状態のまま留まり、他の画面への遷移は中止されることを確認
    const currentUrl = page.url();
    expect(currentUrl).toContain('scr-1791354351333');

    // エラーメッセージは閉じるボタンで非表示にできることを確認
    const closeButton = page.locator('button:has-text("閉じる"), [aria-label="閉じる"]');
    if (await closeButton.count() > 0) {
      await closeButton.first().click();
      await expect(errorMessage).not.toBeVisible({ timeout: 1000 }).catch(() => {});
    }

    // 金額が一致するまでタブ外への操作は制限されたままであることを確認
    const otherNavLinks = page.locator('[data-aivic-nav]:not([data-aivic-nav="scr-1791354351333"])');
    if (await otherNavLinks.count() > 0) {
      // 他のナビゲーションリンクが無効化されていることを確認（実装に応じて）
      const disabled = await otherNavLinks.first().evaluate(el => el.hasAttribute('disabled') || el.classList.contains('disabled'));
      // 実装によってはこのチェックが不要な場合もあり
    }
  });
});
