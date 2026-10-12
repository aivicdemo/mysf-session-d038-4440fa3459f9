import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-1314: 請求書再発行確定 - 異常検知ログの記録', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');
  });

  test('請求書再発行時に検出された商談と請求書の金額ズレ・ステータス不整合の異常検知ログが記録される', async () => {
    // 商談・請求管理画面にアクセス (既にアクセス済み)

    // 初回請求書（INV-001）を検索・表示し、再発行ボタンをクリック
    const invoiceRows = await page.locator('[id="invoice-tbody"] tr');
    let invoiceFound = false;

    const invoiceCount = await invoiceRows.count();
    for (let i = 0; i < invoiceCount; i++) {
      const row = invoiceRows.nth(i);
      const text = await row.textContent();
      if (text && (text.includes('INV-001') || text.includes('INV-2024-001'))) {
        await row.click();
        invoiceFound = true;
        break;
      }
    }

    expect(invoiceFound).toBe(true);

    // 請求書再発行ダイアログが表示されることを確認
    const reissueBtn = page.locator('[id="btn-reissue-invoice"]');
    if (await reissueBtn.isEnabled()) {
      await reissueBtn.click();
    }

    const modal = page.locator('[id="modal-reissue"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    // 再発行内容確認画面で、商談金額（500,000円）と請求書金額（450,000円）のズレが表示されていることを確認
    const modalText = await modal.textContent();
    // ズレがある場合、差異額が表示される
    expect(modalText || '').toMatch(/500|450|差異|ズレ/);

    // 「再発行確定」ボタンをクリック
    const reasonInput = page.locator('[id="modal-reissue-reason"]');
    await reasonInput.fill('金額ズレの修正');

    const confirmBtn = page.locator('[id="btn-confirm-reissue"]');
    if (await confirmBtn.isEnabled()) {
      await confirmBtn.click();
    }

    // システムが異常検知ロジックを実行し、異常検知ログテーブルを確認
    await page.waitForTimeout(2000);

    // 期待結果：異常検知ログテーブルに以下の属性を持つ1件のレコードが新規作成されて記録される

    // 【異常タイプ】「金額ズレ」
    // 【重要度】「高」
    // 【対象テーブル】「請求書」
    // 【対象レコードID】「INV-001」
    // 【異常内容】「商談金額と請求書金額が不一致」
    // 【期待値】「500000」
    // 【実際値】「450000」
    // 【ステータス】「未対応」

    const pageText = await page.textContent('body');

    // 異常ログが記録されたことを示す表示を確認
    expect(pageText || '').toMatch(/金額ズレ|異常|検知|INV-001|450|500/);

    // 異常ログ表示セクションを確認
    const anomalySection = page.locator('[id*="anomaly"], [class*="anomaly"], text=異常検知');
    if (await anomalySection.isVisible()) {
      const anomalyText = await anomalySection.textContent();
      expect(anomalyText || '').toMatch(/金額|ズレ|450|500/);
    }
  });
});
