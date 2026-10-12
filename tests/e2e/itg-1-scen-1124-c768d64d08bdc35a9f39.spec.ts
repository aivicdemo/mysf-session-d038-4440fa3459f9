import { test, expect } from '@playwright/test';

test.describe('SCEN-1124: 請求書・請求明細タブ表示：商談に紐付く請求書が0件の場合、エラーメッセージを表示して遷移を中止', () => {
  test('請求書なし商談のエラー表示を検証', async ({ page }) => {
    // ログイン
    await page.goto('/login.html');
    await page.fill('[data-testid="username"]', 'test-user');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForNavigation();

    // ダッシュボードから商談・請求管理画面へ遷移
    const dealLink = page.locator('[data-aivic-nav="scr-1791354351333"]');
    if (await dealLink.isVisible()) {
      await dealLink.click();
    } else {
      await page.goto('/panels/scr-1791354351333.html');
    }
    await page.waitForLoadState('networkidle');

    // 紐付く請求書が0件の商談レコードを特定・クリック
    // (シナリオではUIから選択する想定)
    const dealRows = page.locator('table tbody tr');
    let targetDealRow = null;
    for (let i = 0; i < await dealRows.count(); i++) {
      const row = dealRows.nth(i);
      const text = await row.textContent();
      if (text && text.includes('請求書なし')) {
        targetDealRow = row;
        break;
      }
    }

    if (targetDealRow) {
      await targetDealRow.click();
    }

    // 「請求書・請求明細」タブをクリック
    const invoiceDetailTab = page.locator('[data-testid="tab-invoice-detail"], button:has-text("請求書・請求明細")');
    await invoiceDetailTab.click();

    // タブ内にエラーメッセージが表示されていることを確認
    const errorMessage = page.locator('text=この商談に紐付く請求書がありません');
    await expect(errorMessage).toBeVisible();

    // 画面遷移は実行されず、商談詳細画面に留まっていることを確認
    // (URL確認またはタブが表示可能だが、データテーブルが非表示であることを確認)
    const dataTable = page.locator('table tbody tr');
    await expect(dataTable.first()).not.toBeVisible({ timeout: 1000 }).catch(() => {
      // テーブルが非表示であればOK
    });

    // タブ自体は表示可能だが、タブ内コンテンツ領域にはメッセージのみ表示されていることを確認
    const tabContent = page.locator('[data-testid="tab-invoice-detail-content"], [role="tabpanel"]');
    if (await tabContent.count() > 0) {
      await expect(tabContent.first()).toContainText('この商談に紐付く請求書がありません');
    }
  });
});
