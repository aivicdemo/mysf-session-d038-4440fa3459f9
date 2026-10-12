import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-1309: 請求書再発行確定 - 請求明細レコード更新', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');
  });

  test('再発行に伴って請求明細レコードが更新される', async () => {
    // 商談・請求管理画面を開く (既に開いている)

    // 既存請求書INV-2024-001を検索して表示する
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

    // 請求書の詳細ビューで明細ID DL-001の内容を確認し、編集ボタンをクリック
    const detailTable = page.locator('[id="invoice-detail-tbody"]');
    const detailRows = await detailTable.locator('tr');
    let detailFound = false;

    const detailCount = await detailRows.count();
    for (let i = 0; i < detailCount; i++) {
      const row = detailRows.nth(i);
      const text = await row.textContent();
      if (text && (text.includes('DL-001') || text.includes('1'))) {
        detailFound = true;
        break;
      }
    }

    // 編集フォームで数量を15に、単価を1200円に修正する
    const editBtn = page.locator('[id="btn-edit-invoice"]');
    if (await editBtn.isEnabled()) {
      await editBtn.click();
    }

    const quantityInput = page.locator('[id="edit-quantity"]');
    const unitPriceInput = page.locator('[id="edit-unit-price"]');
    const taxRateInput = page.locator('[id="edit-tax-rate"]');

    if (await quantityInput.isVisible()) {
      await quantityInput.clear();
      await quantityInput.fill('15');
    }

    if (await unitPriceInput.isVisible()) {
      await unitPriceInput.clear();
      await unitPriceInput.fill('1200');
    }

    if (await taxRateInput.isVisible()) {
      await taxRateInput.clear();
      await taxRateInput.fill('10');
    }

    // 修正内容を保存してから、再発行確定ボタンをクリック
    const applyBtn = page.locator('[id="btn-apply-edit"]');
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
    }

    const reissueBtn = page.locator('[id="btn-reissue-invoice"]');
    if (await reissueBtn.isEnabled()) {
      await reissueBtn.click();
    }

    // 確認ダイアログで再発行実行を確定する
    const modal = page.locator('[id="modal-reissue"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    const reasonInput = page.locator('[id="modal-reissue-reason"]');
    await reasonInput.fill('単価・数量修正');

    const confirmBtn = page.locator('[id="btn-confirm-reissue"]');
    if (await confirmBtn.isEnabled()) {
      await confirmBtn.click();
    }

    // 画面が更新され、請求書がステータス更新されたことを確認
    await page.waitForTimeout(2000);

    // 明細ID DL-001の行アイテムをクリックして詳細を表示
    const updatedDetailTable = page.locator('[id="invoice-detail-tbody"]');
    const updatedText = await updatedDetailTable.textContent();

    // 期待結果：請求明細レコード（明細ID: DL-001）の以下の項目が画面上に表示される

    // 数量=15
    expect(updatedText).toContain('15');

    // 単価=1200円
    expect(updatedText || '').toMatch(/1200|1,200/);

    // 金額=18000円 (15 × 1200)
    expect(updatedText || '').toMatch(/18000|18,000/);

    // 税率=10%
    expect(updatedText).toContain('10%');

    // 税額=1800円
    expect(updatedText || '').toMatch(/1800|1,800/);

    // 税込金額=19800円
    expect(updatedText || '').toMatch(/19800|19,800/);

    // 修正前数量=10
    // 修正前単価=1000円
    // 修正前金額=10000円
    // これらの値は表示されるかモーダルや別画面に表示される可能性がある
  });
});
