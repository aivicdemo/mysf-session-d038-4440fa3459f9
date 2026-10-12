import { test, expect } from '@playwright/test';

test.describe('SCEN-1450: 商談に紐付く請求書が存在しない場合', () => {
  test('差異理由として「未請求」が検出され、警告がハイライト表示される', async ({ page }) => {
    // 営業プロセス統合ダッシュボードにアクセス
    await page.goto('/login.html');
    await page.fill('[name="username"]', 'test_user');
    await page.fill('[name="password"]', 'test_password');
    await page.click('button:has-text("ログイン")');

    // 取引先一覧から取引先A（CUST-001）を選択
    await page.goto('/panels/scr-1791354379354.html');

    // テスト用の取引先を検索
    const customerSearch = page.locator('#search-field');
    await customerSearch.fill('CUST-001');

    const customerRow = page.locator('#customer-tbody tr').first();
    await customerRow.click();

    // 「取引先請求タブ」を開く
    await page.click('[data-tab="invoices"]');
    await page.waitForSelector('#invoices-tab.active');

    // 商談B（OPP-001）の行を確認
    const invoiceTable = page.locator('[data-testid="invoice-info-table"]');
    const dealRow = invoiceTable.locator('tbody tr').filter({ has: page.locator('text=OPP-001|未請求') });

    // 差異理由列に「未請求」テキストが表示されることを確認
    const reasonCell = dealRow.locator('td');
    const rowText = await dealRow.textContent();
    expect(rowText).toContain('未請求');

    // その行全体が黄色またはオレンジ色のハイライト背景で強調表示されることを確認
    const bgColor = await dealRow.evaluate(el => window.getComputedStyle(el).backgroundColor);
    // 黄色またはオレンジ色の背景色を持つことを確認
    expect(bgColor).toMatch(/rgb\(\s*255\s*,\s*200\s*|rgb\(\s*255\s*,\s*165\s*|yellow|orange|#FFCC00|#FFA500/i);
  });
});
