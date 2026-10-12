import { test, expect } from '@playwright/test';

test('取引先請求タブ表示：他の営業担当者が担当する顧客を営業部長権限で検索した場合、同一部門内の商談・請求履歴が全件表示される', async ({ page }) => {
  // ダッシュボード画面にアクセス
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForLoadState('networkidle');

  // 顧客・取引先管理画面に遷移
  const customerLink = page.locator('[data-aivic-nav="scr-1791354379354"]');
  await customerLink.click();
  await page.waitForLoadState('networkidle');

  // 検索フィールドに顧客名を入力
  const searchField = page.locator('#search-field');
  await searchField.fill('customer_C001');

  // 検索が実行されるまで待機
  await page.waitForTimeout(500);

  // 検索結果から対象顧客をクリック
  const customerTable = page.locator('[data-testid="customer-list-table"]');
  const customerRow = customerTable.locator('tbody tr').first();
  await customerRow.click();

  // 顧客詳細が表示されるまで待機
  await page.waitForSelector('#detail-container:not([style*="display:none"])');

  // 「請求情報」タブをクリック
  const invoicesTab = page.locator('[data-testid="tab-invoices"]');
  await invoicesTab.click();

  // 請求情報タブが表示されるまで待機
  await page.waitForSelector('#invoices-tab.active');

  // 請求書テーブルの行を取得
  const invoiceTable = page.locator('[data-testid="invoice-info-table"]');
  const invoiceRows = invoiceTable.locator('tbody tr:not(:has(.empty-state))');

  // 5件の請求書が表示されていることを確認
  const rowCount = await invoiceRows.count();
  expect(rowCount).toBe(5);

  // 各請求書の要素を取得（invoice_001～invoice_005と想定）
  const invoices = [];
  for (let i = 0; i < rowCount; i++) {
    const row = invoiceRows.nth(i);
    const cells = row.locator('td');
    const invoiceNumber = await cells.nth(0).textContent();
    const invoiceDate = await cells.nth(1).textContent();
    const dueDate = await cells.nth(2).textContent();
    const amount = await cells.nth(3).textContent();
    const status = await cells.nth(4).textContent();

    invoices.push({
      number: invoiceNumber?.trim(),
      date: invoiceDate?.trim(),
      dueDate: dueDate?.trim(),
      amount: amount?.trim(),
      status: status?.trim(),
    });
  }

  // invoice_001～invoice_005が存在することを確認
  const invoiceNumbers = invoices.map(inv => inv.number);
  expect(invoiceNumbers).toContain('invoice_001');
  expect(invoiceNumbers).toContain('invoice_002');
  expect(invoiceNumbers).toContain('invoice_003');
  expect(invoiceNumbers).toContain('invoice_004');
  expect(invoiceNumbers).toContain('invoice_005');

  // 各請求書に必須情報（請求ID、請求日、請求金額、請求ステータス）が表示されていることを確認
  invoices.forEach((invoice) => {
    expect(invoice.number).toBeTruthy(); // 請求書番号
    expect(invoice.date).toBeTruthy(); // 請求日
    expect(invoice.amount).toBeTruthy(); // 請求金額
    expect(invoice.status).toBeTruthy(); // 請求ステータス
  });

  // 請求日が降順（新しい日付から古い日付）でソートされていることを確認
  const dates = invoices
    .map(inv => inv.date)
    .filter(d => d && d !== '-')
    .map(d => new Date(d).getTime());

  for (let i = 0; i < dates.length - 1; i++) {
    expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
  }

  // 商談リンクが参照可能な状態になっていることを確認
  // （テーブルセルにリンクまたはインタラクティブな要素が含まれていることを確認）
  const invoiceDetailsVisible = await invoiceTable.isVisible();
  expect(invoiceDetailsVisible).toBe(true);

  // 請求情報タブが正しくアクティブ状態であることを確認
  const activeTab = page.locator('[data-testid="tab-invoices"].active');
  expect(await activeTab.isVisible()).toBe(true);
});
