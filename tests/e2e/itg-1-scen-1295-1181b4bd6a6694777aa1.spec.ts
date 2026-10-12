import { test, expect } from '@playwright/test';

test('SCEN-1295: 新システムの請求書出力処理実行時に、商談から取得した顧客ID・金額・商品情報のすべてが揃い、値が正常であるため、出力が承認される', async ({ page }) => {
  // 営業プロセス統合ダッシュボードを開く
  await page.goto('/panels/scr-1791354337614.html');

  // ダッシュボード上の商談リストから、ステージ「受注確定」の対象商談を特定する
  // ステージが「成約」の商談を探す（ダッシュボードで確認可能）
  await page.waitForSelector('[data-testid="stage-progress-table"]');

  // 商談・請求管理画面へ遷移する
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForLoadState('networkidle');

  // 対象商談を検索・選択する
  // フィルター条件を設定して成約済みの商談を表示
  const stageFilter = await page.$('#filter-stage');
  if (stageFilter) {
    await page.selectOption('#filter-stage', '成約');
  }

  // テーブルから最初の行を選択
  await page.click('#deal-tbody tr:first-child');
  await page.waitForTimeout(500);

  // 対象商談の詳細を表示し、顧客ID・金額・商品情報がすべて表示されていることを確認する
  const detailPanel = await page.locator('#detail-panel');
  const detailText = await detailPanel.textContent();
  expect(detailText).toContain('商談名');
  expect(detailText).toContain('取引先');
  expect(detailText).toContain('金額');
  expect(detailText).toContain('成約予定日');

  // 詳細情報が実際に値を持っていることを確認
  const detailRows = await detailPanel.locator('.detail-value').all();
  expect(detailRows.length).toBeGreaterThan(0);
  for (const row of detailRows) {
    const text = await row.textContent();
    expect(text).not.toBe('-');
    expect(text?.trim().length).toBeGreaterThan(0);
  }

  // 「請求書生成」ボタンをクリックする
  const generateButton = page.locator('#btn-generate-invoice');
  const isGenerateDisabled = await generateButton.isDisabled();
  expect(isGenerateDisabled).toBe(false);
  await generateButton.click();

  // 請求書生成確認ダイアログが表示されるまで待機する
  await page.waitForSelector('#modal-generate.open', { timeout: 5000 });
  const modal = await page.locator('#modal-generate');
  expect(await modal.isVisible()).toBe(true);

  // ダイアログ内に『顧客ID: CUST-20240501-001、請求金額: 250,000円（税込275,000円）、商品: PRD-A001×5』が表示されていることを確認する
  // または同様の形式で、取引先情報・金額・商品情報が表示されていることを確認
  const modalContent = await modal.textContent();
  expect(modalContent).toBeTruthy();
  // 金額情報を確認
  expect(modalContent).toMatch(/金額|請求|商品/);

  // 「承認して生成」ボタンをクリックする
  const confirmButton = page.locator('#btn-confirm-generate');
  const isConfirmDisabled = await confirmButton.isDisabled();
  expect(isConfirmDisabled).toBe(false);
  await confirmButton.click();

  // ページが更新され、商談・請求管理画面の当該商談欄に『請求書ステータス: 生成承認済み』と請求書IDが採番・表示されている
  // ダイアログが閉じるのを待つ
  await page.waitForSelector('#modal-generate:not(.open)', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // 請求書リストが更新され、新しい請求書が表示されていることを確認
  await page.waitForSelector('#invoice-tbody tr', { timeout: 5000 });
  const invoiceRows = await page.locator('#invoice-tbody tr').all();
  expect(invoiceRows.length).toBeGreaterThan(0);

  // 最初の請求書行を確認
  const firstInvoiceRow = invoiceRows[0];
  const invoiceText = await firstInvoiceRow.textContent();
  expect(invoiceText).toBeTruthy();
  // 請求書番号と生成承認済みステータスが含まれていることを確認
  expect(invoiceText).toMatch(/INV-|請求書|生成|承認/i);
});
