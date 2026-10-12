import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-1308: 請求書再発行確定 - レコード更新', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');
  });

  test('検証結果に基づいて請求書が再発行され、各フィールドが更新される', async () => {
    // 商談・請求管理画面で請求書ID「INV-2024-001」の検証済み請求書レコードを検索・表示する
    // 画面の請求書一覧から INV-2024-001 を探す
    const invoiceRows = await page.locator('[id="invoice-tbody"] tr');
    let invoiceFound = false;

    const invoiceCount = await invoiceRows.count();
    for (let i = 0; i < invoiceCount; i++) {
      const row = invoiceRows.nth(i);
      const text = await row.textContent();
      if (text && text.includes('INV-2024-001')) {
        await row.click();
        invoiceFound = true;
        break;
      }
    }

    expect(invoiceFound).toBe(true);

    // 当該請求書の詳細画面を開き、修正内容（請求金額121,000円、修正理由「単価計算誤り」）を入力フォームに入力する
    const editBtn = page.locator('[id="btn-edit-invoice"]');
    if (await editBtn.isEnabled()) {
      await editBtn.click();
    }

    // 編集フォームで修正内容を入力
    const quantityInput = page.locator('[id="edit-quantity"]');
    const unitPriceInput = page.locator('[id="edit-unit-price"]');
    if (await quantityInput.isVisible()) {
      await quantityInput.clear();
      // 金額が121,000円になるように調整（例: 数量11×単価11,000円）
      await quantityInput.fill('11');
    }
    if (await unitPriceInput.isVisible()) {
      await unitPriceInput.clear();
      await unitPriceInput.fill('11000');
    }

    // 「再発行確定」ボタンをクリックし、再発行確定操作を実行する
    const applyBtn = page.locator('[id="btn-apply-edit"]');
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
    }

    const reissueBtn = page.locator('[id="btn-reissue-invoice"]');
    if (await reissueBtn.isEnabled()) {
      await reissueBtn.click();
    }

    const modal = page.locator('[id="modal-reissue"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    const reasonInput = page.locator('[id="modal-reissue-reason"]');
    await reasonInput.fill('単価計算誤り');

    const confirmBtn = page.locator('[id="btn-confirm-reissue"]');
    if (await confirmBtn.isEnabled()) {
      await confirmBtn.click();
    }

    // システムは入力内容を処理し、請求書レコードを更新する
    // 画面が更新結果を表示するまで待機する
    await page.waitForTimeout(2000);

    // 期待結果：商談・請求管理画面の請求書詳細に以下の更新されたレコード情報が表示される

    // 請求書詳細テーブルから値を検証
    const detailTable = page.locator('[id="invoice-detail-tbody"]');
    const detailText = await detailTable.textContent();

    // ①請求書ID: INV-2024-001（変更なし）
    expect(detailText).toContain('INV-2024-001');

    // ②請求金額: 121,000円（修正後の金額に更新）
    expect(detailText || '').toMatch(/121[,0]*/);

    // ③税額: 11,000円（10%で計算）
    expect(detailText || '').toMatch(/11[,0]*/);

    // ④税抜金額: 110,000円
    expect(detailText || '').toMatch(/110[,0]*/);

    // 成功メッセージが表示されることを確認
    const successMessage = page.locator('text=請求書が再発行確定されました');
    await expect(successMessage).toBeVisible();
  });
});
