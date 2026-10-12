import { test, expect } from '@playwright/test';

test.describe('SCEN-1127: 請求合計が商談金額と一致しない場合、エラーメッセージを表示して遷移を中止', () => {
  test('請求合計と商談金額の不一致時のエラー表示を検証', async ({ page }) => {
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

    // 対象商談行をクリック
    const dealRows = page.locator('table tbody tr');
    const targetRow = dealRows.first();
    await targetRow.click();

    // 請求書・請求明細タブをクリック
    const invoiceDetailTab = page.locator('[data-testid="tab-invoice-detail"], button:has-text("請求書・請求明細")');
    await invoiceDetailTab.click();

    // 金額整合性チェックロジックが動作し、エラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=/請求合計.*商談金額.*一致しません/');
    await expect(errorMessage).toBeVisible();

    // エラーメッセージに金額情報が含まれていることを確認
    // 期待: 「請求合計が商談金額と一致しません。請求明細を確認してください。（商談金額: 1,000,000 円、請求合計: 950,000 円）」
    const fullErrorMessage = page.locator('text=/商談金額.*1,000,000|請求合計.*950,000/');
    await expect(fullErrorMessage).toBeVisible();

    // タブは遷移せず、ユーザーは現在の商談・請求管理画面上に留まっていることを確認
    const currentUrl = page.url();
    expect(currentUrl).toContain('scr-1791354351333');

    // ブラウザ上に表示されたエラーメッセージを確認
    const alertBox = page.locator('[role="alert"]');
    if (await alertBox.count() > 0) {
      const alertText = await alertBox.first().textContent();
      expect(alertText).toContain('請求合計');
      expect(alertText).toContain('商談金額');
    }
  });
});
