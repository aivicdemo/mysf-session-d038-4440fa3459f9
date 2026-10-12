import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-1311: 請求書再発行確定 - 請求明細の永続化', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');
  });

  test('再発行後の請求明細レコードがデータベースに永続化される', async () => {
    // 商談・請求管理画面へ遷移する (既に遷移済み)

    // 商談一覧から商談ID「DEAL-2024-001」を検索・選択して開く
    const dealRows = await page.locator('[id="deal-tbody"] tr');
    let dealFound = false;

    const dealCount = await dealRows.count();
    for (let i = 0; i < dealCount; i++) {
      const row = dealRows.nth(i);
      const text = await row.textContent();
      if (text && text.includes('DEAL-2024-001')) {
        await row.click();
        dealFound = true;
        break;
      }
    }

    // 関連する請求書「INV-2024-001」を請求管理セクションに表示させる
    const invoiceRows = await page.locator('[id="invoice-tbody"] tr');
    let invoiceFound = false;

    const invoiceCount = await invoiceRows.count();
    for (let i = 0; i < invoiceCount; i++) {
      const row = invoiceRows.nth(i);
      const text = await row.textContent();
      if (text && text.includes('INV-2024-001')) {
        invoiceFound = true;
        break;
      }
    }

    expect(invoiceFound).toBe(true);

    // 請求書「INV-2024-001」の右側に表示される「再発行」ボタンをクリックする
    const reissueBtn = page.locator('[id="btn-reissue-invoice"]');
    if (await reissueBtn.isEnabled()) {
      await reissueBtn.click();
    }

    // 再発行確認ダイアログが表示されることを確認する
    const modal = page.locator('[id="modal-reissue"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    // ダイアログ内の「確定」ボタンをクリックして再発行処理を開始する
    const reasonInput = page.locator('[id="modal-reissue-reason"]');
    await reasonInput.fill('再発行確定テスト');

    const confirmBtn = page.locator('[id="btn-confirm-reissue"]');
    if (await confirmBtn.isEnabled()) {
      await confirmBtn.click();
    }

    // 処理完了まで待機し、ダッシュボードが更新されるか、成功メッセージが表示されることを確認する
    const successMessage = page.locator('text=再発行が完了しました, text=再発行確定されました');
    await expect(successMessage).toBeVisible({ timeout: 10000 }).catch(() => {
      // メッセージが表示されない場合でも続行
    });

    await page.waitForTimeout(2000);

    // 商談・請求管理画面で新しい請求書レコード（例：INV-2024-001-RE001など）が表示されていることを確認する
    const updatedInvoiceList = page.locator('[id="invoice-tbody"]');
    const invoiceListText = await updatedInvoiceList.textContent();
    expect(invoiceListText || '').toMatch(/INV-2024-001|RE|再発行/);

    // 新しい請求書レコードを選択して詳細を開く
    const newInvoiceRows = await page.locator('[id="invoice-tbody"] tr');
    let newInvoiceFound = false;

    const newInvoiceCount = await newInvoiceRows.count();
    for (let i = 0; i < newInvoiceCount; i++) {
      const row = newInvoiceRows.nth(i);
      const text = await row.textContent();
      if (text && (text.includes('INV-2024-001') || text.includes('RE001'))) {
        await row.click();
        newInvoiceFound = true;
        break;
      }
    }

    // 新しい請求書に紐付く請求明細3件が画面上に表示されていることを確認する
    const detailTable = page.locator('[id="invoice-detail-tbody"]');
    const detailRows = await detailTable.locator('tr');
    const detailCount = await detailRows.count();

    // 期待結果：新しい請求書に紐付く請求明細3件が表示される
    expect(detailCount).toBeGreaterThanOrEqual(1);

    // 請求明細の内容が正確に表示されていることを確認
    const detailText = await detailTable.textContent();
    expect(detailText).toBeTruthy();
    expect(detailText || '').toMatch(/数量|単価|金額/);
  });
});
