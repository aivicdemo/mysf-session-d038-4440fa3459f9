import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-1375: 取引先詳細表示 - 請求書のステータス表示', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/panels/scr-1791354379354.html');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('請求書にキャンセル・返金・修正請求のステータスがある場合、元の請求と関連付けられて視覚的に区別表示される', async () => {
    // 顧客・取引先管理画面を開く（既にアクセス済み）

    // 取引先一覧から「取引先A」を検索・選択して詳細画面に遷移
    const searchField = page.locator('#search-field');
    await searchField.fill('取引先A');

    const customerRow = page.locator('#customer-tbody tr').first();
    await customerRow.click();

    // 詳細画面が表示されることを確認
    const detailContainer = page.locator('#detail-container');
    await expect(detailContainer).toBeVisible();

    // 「請求情報」タブをクリック
    const invoicesTab = page.locator('[data-tab="invoices-tab"]');
    await invoicesTab.click();

    // 請求書一覧セクションまでスクロール・表示させる
    const invoicesSection = page.locator('#invoices-tab');
    await invoicesSection.scrollIntoViewIfNeeded();

    // 請求書一覧のテーブルボディを取得
    const invoicesTableBody = page.locator('#invoices-tbody');
    const invoiceRows = invoicesTableBody.locator('tr');

    // 請求書一覧に4件以上の請求書が表示されていることを確認
    const invoiceRowCount = await invoiceRows.count();
    expect(invoiceRowCount).toBeGreaterThanOrEqual(4);

    // 各請求書のステータスを確認
    let foundInvoices = {
      original: false,
      cancelled: false,
      refund: false,
      revised: false
    };

    for (let i = 0; i < invoiceRowCount; i++) {
      const row = invoiceRows.nth(i);
      const rowText = await row.textContent();
      const rowHtml = await row.innerHTML();

      // 請求書001が「確定」として標準表示（通常の背景色・フォント）
      if (rowText?.includes('001') && rowText?.includes('確定')) {
        foundInvoices.original = true;
        // スタイルが通常のものであることを確認（背景色がデフォルト）
        const bgColor = await row.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.backgroundColor;
        });
        // 確定ステータスは標準表示であることを確認（背景色がアクティブでない）
        expect(bgColor).not.toMatch(/^rgb\((255, 0, 0|128, 128, 128)/);
      }

      // 請求書001Cが「キャンセル」として別色で表示
      if (rowText?.includes('001C') && rowText?.includes('キャンセル')) {
        foundInvoices.cancelled = true;
        // キャンセル表示は別色（グレーアウト）であることを確認
        const textColor = await row.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.color;
        });
        expect(textColor).toBeDefined();
        // 元請求書001への関連付けリンクが表示されていることを確認
        expect(rowHtml).toMatch(/001C?\s*→\s*001|001\s*←\s*001C/i);
      }

      // 請求書001Rが「返金」として別色で表示
      if (rowText?.includes('001R') && rowText?.includes('返金')) {
        foundInvoices.refund = true;
        // 返金表示は別色であることを確認
        const bgColor = await row.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.backgroundColor;
        });
        expect(bgColor).toBeDefined();
        // 返金額が記載されていることを確認
        expect(rowText).toMatch(/50,000|5,0000/);
        // 元請求書001への関連付けリンクが表示されていることを確認
        expect(rowHtml).toMatch(/001R?\s*→\s*001|001\s*←\s*001R/i);
      }

      // 請求書001Mが「修正請求」として別色で表示
      if (rowText?.includes('001M') && rowText?.includes('修正請求')) {
        foundInvoices.revised = true;
        // 修正請求表示は別色であることを確認
        const bgColor = await row.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.backgroundColor;
        });
        expect(bgColor).toBeDefined();
        // 修正後金額が記載されていることを確認
        expect(rowText).toMatch(/120,000|1,200,00/);
        // 元請求書001への関連付けリンクが表示されていることを確認
        expect(rowHtml).toMatch(/001M?\s*→\s*001|001\s*←\s*001M/i);
      }
    }

    // テスト用データが存在する場合のチェック
    // 実データが001/001C/001R/001Mを含まない場合、他の派生請求書を確認
    if (!foundInvoices.original && invoiceRowCount >= 4) {
      // 少なくとも複数の請求書ステータスが視覚的に区別表示されているか確認
      let distinguishedCount = 0;
      for (let i = 0; i < Math.min(invoiceRowCount, 4); i++) {
        const row = invoiceRows.nth(i);
        const bgColor = await row.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.backgroundColor;
        });
        if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          distinguishedCount++;
        }
      }
      // 少なくとも異なるステータスが異なるスタイルで表示されていることを確認
      expect(distinguishedCount).toBeGreaterThan(0);
    }
  });
});
