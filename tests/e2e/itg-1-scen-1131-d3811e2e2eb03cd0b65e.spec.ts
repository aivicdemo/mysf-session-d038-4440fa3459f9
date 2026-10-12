import { test, expect } from '@playwright/test';

test.describe('SCEN-1131: 請求書・請求明細タブ表示：参照関係が有効な場合、請求書・請求明細の詳細画面へ遷移できる', () => {
  test('参照関係が有効な場合の詳細画面遷移を検証', async ({ page }) => {
    await page.goto('/login.html');
    await page.fill('[data-testid="username"]', 'test-user');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForNavigation();

    // 営業プロセス統合ダッシュボード画面を開く
    await page.waitForURL(/\/panels\/scr-.*\.html/);

    // 商談・請求管理画面へ遷移する
    const dealLink = page.locator('[data-aivic-nav="scr-1791354351333"]');
    if (await dealLink.isVisible()) {
      await dealLink.click();
    } else {
      await page.goto('/panels/scr-1791354351333.html');
    }
    await page.waitForLoadState('networkidle');

    // 一覧表示されている商談の中から、請求書・請求明細タブに関連レコードが存在する商談を確認
    const dealRows = page.locator('table tbody tr');
    const targetRow = dealRows.first();
    await targetRow.click();

    // 当該商談行の『請求書・請求明細タブ』をクリック
    const invoiceDetailTab = page.locator('[data-testid="tab-invoice-detail"], button:has-text("請求書・請求明細")');
    await invoiceDetailTab.click();

    // 請求書・請求明細タブが画面上で切り替わることを確認
    const tabContent = page.locator('[data-testid="tab-invoice-detail-content"], [role="tabpanel"]');
    await expect(tabContent).toBeVisible();

    // タブ内に表示された請求書・請求明細レコードのいずれかをクリック
    const invoiceRows = page.locator('table tbody tr');
    if (await invoiceRows.count() > 0) {
      const firstInvoiceRow = invoiceRows.first();
      await firstInvoiceRow.click();
    }

    // クリックされたレコードの詳細画面へ正常に遷移する
    await page.waitForNavigation();
    await page.waitForLoadState('networkidle');

    // 請求書番号が表示されていることを確認
    const invoiceNumber = page.locator('text=/請求書番号|Invoice Number/');
    await expect(invoiceNumber).toBeVisible();

    // 請求金額が表示されていることを確認
    const invoiceAmount = page.locator('text=/請求金額|請求額|Amount/');
    await expect(invoiceAmount).toBeVisible();

    // 請求明細行（商品名・数量・単価・小計）が表示されていることを確認
    const productName = page.locator('text=商品名');
    const quantity = page.locator('text=数量');
    const unitPrice = page.locator('text=単価');
    const subtotal = page.locator('text=小計');

    await expect(productName).toBeVisible();
    await expect(quantity).toBeVisible();
    await expect(unitPrice).toBeVisible();
    await expect(subtotal).toBeVisible();

    // 請求日、支払期日などの詳細情報が表示されている
    const invoiceDate = page.locator('text=/請求日|Invoice Date/');
    const dueDate = page.locator('text=/支払期日|Payment Due/');

    await expect(invoiceDate).toBeVisible();
    await expect(dueDate).toBeVisible();

    // ブラウザの戻るボタンまたは『戻る』リンクで商談・請求管理画面に戻ることが可能
    const backButton = page.locator('button:has-text("戻る"), a:has-text("戻る"), [aria-label="戻る"]');
    if (await backButton.count() > 0) {
      await backButton.first().click();
      await page.waitForNavigation();
      // 商談・請求管理画面に戻っていることを確認
      await expect(page).toHaveURL(/scr-1791354351333/);
    } else {
      // ブラウザのネイティブ戻るボタンを使用
      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
  });
});
