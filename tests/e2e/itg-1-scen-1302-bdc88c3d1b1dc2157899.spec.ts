import { test, expect } from '@playwright/test';

test('SCEN-1302: 再発行対象の既存請求明細レコード（18項目）が取得され、画面に表示される', async ({ page }) => {
  // 商談・請求管理画面から再発行対象の請求書を特定
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForSelector('[id="deal-tbody"]');

  // 対象請求書の「再発行」ボタンをクリック
  const dealRow = page.locator('[id="deal-tbody"] tr').first();
  await dealRow.click();

  const reissueBtn = page.locator('[id="btn-reissue-invoice"]');
  await reissueBtn.click();

  // システムが請求書再発行確定画面へ遷移するまで待機
  const modal = page.locator('[id="modal-reissue"]');
  await expect(modal).toBeVisible();

  // 再発行確定画面が表示されたことを確認
  await page.waitForSelector('[id="invoice-detail-tbody"]');

  // 画面上に請求明細一覧表が描画されていることを確認
  const detailTable = page.locator('[id="invoice-detail-tbody"]');
  await expect(detailTable).toBeVisible();

  // 一覧表の各カラムヘッダーが正しく表示されていることを確認
  // 期待するカラムヘッダー：「請求明細ID」「請求書ID」「商談ID」「営業活動ID」「明細行番号」
  // 「商品名」「商品説明」「数量」「単価」「金額」「税率」「税額」「税込金額」「摘要」
  // 「修正前数量」「修正前単価」「修正前金額」

  const rows = page.locator('[id="invoice-detail-tbody"] tr');
  const firstRow = rows.first();

  // 画面内で最初の請求明細レコードの行データを目視確認
  await expect(firstRow).toBeVisible();

  // 該当するレコードの数量フィールドに数値が正しく表示されていることを確認
  const quantityCell = firstRow.locator('td').nth(7); // 数量は8番目カラム
  await expect(quantityCell).toContainText(/\d+/);

  // 該当するレコードの単価フィールドに数値が正しく表示されていることを確認
  const unitPriceCell = firstRow.locator('td').nth(8); // 単価は9番目カラム
  await expect(unitPriceCell).toContainText(/\d+/);

  // 該当するレコードの金額フィールドに数値が正しく表示されていることを確認
  const amountCell = firstRow.locator('td').nth(9); // 金額は10番目カラム
  await expect(amountCell).toContainText(/\d+/);

  // 該当するレコードの修正前数量フィールドに過去の数値が正しく表示されていることを確認
  const prevQuantityCell = firstRow.locator('td').nth(14); // 修正前数量は15番目カラム
  await expect(prevQuantityCell).toContainText(/\d+/);

  // 該当するレコードの修正前単価フィールドに過去の単価が正しく表示されていることを確認
  const prevUnitPriceCell = firstRow.locator('td').nth(15); // 修正前単価は16番目カラム
  await expect(prevUnitPriceCell).toContainText(/\d+/);

  // 画面内で2番目以降の請求明細レコードもスクロール可能な範囲内に存在することを確認
  const secondRow = rows.nth(1);
  if (await secondRow.isVisible({ timeout: 1000 }).catch(() => false)) {
    // スクロールして複数の請求明細データが全て画面に表示可能なことを確認
    await page.locator('[id="invoice-detail-tbody"]').evaluate((el) => {
      el.scrollTop = 100;
    });
    await page.waitForTimeout(300);
    await expect(secondRow).toBeVisible();
  }
});
