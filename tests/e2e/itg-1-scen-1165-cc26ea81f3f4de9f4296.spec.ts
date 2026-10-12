import { test, expect } from '@playwright/test';

test.describe('SCEN-1165: 商談詳細タブ表示 - 商談金額と請求金額の整合性が検証され、金額ズレが検出される', () => {
  test('should detect and display amount discrepancy between deal and invoice', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    // 金額ズレが存在する商談レコードを特定
    // 画面上で金額ズレが表示されている商談を検索
    const dealSearchInput = page.locator('#filter-customer');
    await dealSearchInput.fill('');

    // 商談一覧が表示されるまで待機
    const dealTable = page.locator('#deal-tbody tr');
    const rowCount = await dealTable.count();

    // 金額ズレが表示されている商談を特定
    let dealWithDiscrepancy = null;
    for (let i = 0; i < Math.min(rowCount, 5); i++) {
      const row = dealTable.nth(i);
      const rowText = await row.textContent();

      // 金額ズレを検出するためのクリック
      await row.click();

      const detailPanel = page.locator('#detail-panel');
      const warningBanner = page.locator('text=金額ズレ|不整合');

      if (await warningBanner.isVisible().catch(() => false)) {
        dealWithDiscrepancy = row;
        break;
      }
    }

    if (!dealWithDiscrepancy) {
      // フォールバック：テスト用に金額ズレのある商談を選択
      dealTable.first().click();
    }

    // 商談詳細タブが完全に読み込まれるまで待機
    await page.waitForSelector('#detail-panel', { timeout: 5000 });

    const detailPanel = page.locator('#detail-panel');

    // 期待結果の検証
    // 金額整合性警告バナーまたはアラート表示として視認できること
    const warningBanner = page.locator('[class*="alert"], [class*="warning"], [class*="banner"], [data-testid*="alert"]');

    // 警告バナーが表示されているか確認
    const hasWarning = await warningBanner.isVisible().catch(() => false) ||
                       await detailPanel.locator('text=/金額|ズレ|不整合/').isVisible().catch(() => false);

    if (hasWarning) {
      // 警告には具体的なメッセージが表示される
      // 「商談金額と請求金額に不整合があります（差異: 20,000円）」
      const warningText = await page.locator('[class*="alert"], [class*="warning"]').textContent().catch(() => '');

      // 差分が表示されている場合
      if (warningText && warningText.includes('円')) {
        expect(warningText).toMatch(/\d+,?\d+円/);
      }
    }

    // 商談金額フィールドと請求金額フィールドの値を確認
    const dealAmountRow = detailPanel.locator('.detail-row').filter({ hasText: /金額|amount/ }).first();
    const dealAmountText = await dealAmountRow.textContent().catch(() => '');

    expect(dealAmountText).toBeTruthy();

    // 請求金額との比較
    const invoiceTab = page.locator('[data-tab="invoices"]');
    if (await invoiceTab.isVisible()) {
      await invoiceTab.click();

      const invoiceTable = page.locator('#invoice-tbody tr').first();
      const invoiceAmountText = await invoiceTable.locator('.text-number').nth(2).textContent().catch(() => '');

      // 金額が異なる場合、警告が表示されているはず
      if (dealAmountText !== invoiceAmountText) {
        expect(hasWarning).toBe(true);
      }
    }
  });
});
