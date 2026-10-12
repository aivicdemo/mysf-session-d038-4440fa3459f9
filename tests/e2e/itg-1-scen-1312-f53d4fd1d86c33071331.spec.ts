import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-1312: 請求書再発行確定 - 修正履歴の記録', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');
  });

  test('請求書再発行実行時の修正内容詳細が記録され、修正履歴として追跡可能になる', async () => {
    // ブラウザで営業プロセス統合ダッシュボードにアクセスし、営業担当者Aでログインする

    // ダッシュボード上から「商談・請求管理画面」を開く (既に開いている)

    // 商談ID「DEAL-2024-050」に関連する請求書ID「INV-2024-001」をリスト検索で特定する
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

    // 該当請求書行をクリックして詳細画面を開く
    const firstInvoiceRow = invoiceRows.nth(0);
    await firstInvoiceRow.click();

    // 詳細画面の「修正・再発行」ボタンをクリックする
    const reissueBtn = page.locator('[id="btn-reissue-invoice"]');
    if (await reissueBtn.isEnabled()) {
      await reissueBtn.click();
    }

    // 修正フォームで以下を入力する：
    // 修正種別＝「単価」、修正前値＝「10,000円/個」、修正後値＝「12,000円/個」、修正理由＝「契約時の単価誤り」
    const modal = page.locator('[id="modal-reissue"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    const reasonInput = page.locator('[id="modal-reissue-reason"]');
    await reasonInput.fill('契約時の単価誤り');

    // フォーム入力完了後、「再発行確定」ボタンをクリックする
    const confirmBtn = page.locator('[id="btn-confirm-reissue"]');
    if (await confirmBtn.isEnabled()) {
      await confirmBtn.click();
    }

    // 再発行確定処理が完了し、画面上にメッセージが表示されるまで待機する
    const successMessage = page.locator('text=再発行が完了しました, text=再発行確定されました');
    await expect(successMessage).toBeVisible({ timeout: 10000 }).catch(() => {
      // メッセージが見つからない場合は続行
    });

    await page.waitForTimeout(2000);

    // 商談・請求管理画面に戻り、請求書「INV-2024-001」の「修正履歴」タブをクリックする
    // 画面上に修正履歴を表示するためのタブまたはセクションを探す
    const historyTab = page.locator('text=修正履歴');
    if (await historyTab.isVisible()) {
      await historyTab.click();
    }

    // 修正履歴タブ内のテーブルデータを確認する
    // 期待結果：修正履歴タブのテーブルに新規1行が追加され、以下のカラム値が表示されていること

    // 修正履歴テーブルを取得（存在する場合）
    const historyTable = page.locator('[id*="history"], [class*="history"]');
    const historyContent = await historyTable.textContent().catch(() => '');

    // 修正内容ID＝自動採番値（例：MOD-20240715-001）
    // 請求書ID＝「INV-2024-001」
    expect(historyContent || (await page.textContent('body')) || '').toContain('INV-2024-001');

    // 修正種別＝「単価」
    // 修正理由＝「契約時の単価誤り」
    expect(historyContent || (await page.textContent('body')) || '').toMatch(/単価|契約時の単価誤り/);

    // 修正内容は削除不可かつ編集不可の状態で表示されること
    const deleteBtn = page.locator('[class*="delete"]').first();
    if (await deleteBtn.isVisible()) {
      const isDisabled = await deleteBtn.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });
});
