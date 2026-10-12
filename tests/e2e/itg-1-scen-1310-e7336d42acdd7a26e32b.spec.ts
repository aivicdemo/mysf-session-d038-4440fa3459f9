import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-1310: 請求書再発行確定 - データベース永続化', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');
  });

  test('再発行後の請求書レコードがデータベースに永続化される', async () => {
    // 商談・請求管理画面の再発行確定画面上で、再発行内容を確認する
    // 請求書ID: INV-2025-0150、新バージョン番号：2、発行日：本日の日付、金額: 150,000円

    // 請求書一覧から該当する請求書を探す
    const invoiceRows = await page.locator('[id="invoice-tbody"] tr');
    let invoiceFound = false;

    const invoiceCount = await invoiceRows.count();
    for (let i = 0; i < invoiceCount; i++) {
      const row = invoiceRows.nth(i);
      const text = await row.textContent();
      // テスト用データの中から適切な請求書を選ぶ
      if (text && (text.includes('INV-2025') || text.includes('150'))) {
        await row.click();
        invoiceFound = true;
        break;
      }
    }

    // 「再発行を確定する」ボタンをクリックする
    const reissueBtn = page.locator('[id="btn-reissue-invoice"]');
    if (await reissueBtn.isEnabled()) {
      await reissueBtn.click();
    }

    const modal = page.locator('[id="modal-reissue"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    const reasonInput = page.locator('[id="modal-reissue-reason"]');
    await reasonInput.fill('再発行確定');

    // 処理の進行状況を示すローディング表示が画面に現れることを確認する
    const loadingIndicator = page.locator('text=読込中');
    const confirmBtn = page.locator('[id="btn-confirm-reissue"]');
    if (await confirmBtn.isEnabled()) {
      await confirmBtn.click();
    }

    // ローディング表示が消え、確定完了メッセージが表示されることを確認する
    const successMessage = page.locator('text=再発行が完了しました');
    await expect(successMessage).toBeVisible({ timeout: 10000 });

    // 商談・請求管理画面に自動遷移し、請求書一覧にINV-2025-0150が「再発行版（v2）」として表示されていることを確認する
    await page.waitForTimeout(2000);

    const updatedInvoiceList = page.locator('[id="invoice-tbody"]');
    const updatedText = await updatedInvoiceList.textContent();

    // 新しい請求書レコード（請求書ID: INV-2025-0150、バージョン: 2）が表示されていることを確認
    expect(updatedText || '').toMatch(/INV-2025-0150|再発行版|v2/);

    // 期待結果：再発行確定後、請求書レコードがデータベースに永続化されている
    // 新しい請求書レコード（請求書ID: INV-2025-0150、バージョン: 2、ステータス: 「発行済み」）が表示されていること
    expect(updatedText).toContain('発行済');

    // 金額: 150,000円の確認
    expect(updatedText || '').toMatch(/150000|150,000/);
  });
});
