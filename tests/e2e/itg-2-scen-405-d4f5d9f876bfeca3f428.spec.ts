import { test, expect } from '@playwright/test';

test('SCEN-405: 機能マッピング表生成 - 既存システムの計算ロジックが移行対象システムにマッピングされ、実装可能性が判定される', async ({ page }) => {
  // 機能マッピング管理画面を開く
  await page.goto('/panels/scr-1791354749663.html');
  await page.waitForLoadState('networkidle');

  // 左側メニューから『機能マッピング表を生成』ボタンをクリック
  const generateButton = page.locator('[data-testid="generate-mapping-button"]');
  await generateButton.click();

  // 表示される『同期開始』ダイアログで両チェックボックスが有効になっていることを確認
  const syncDialog = page.locator('[data-testid="sync-dialog"]');
  await expect(syncDialog).toBeVisible();

  const sfCheckbox = page.locator('[data-testid="sf-checkbox"]');
  const targetCheckbox = page.locator('[data-testid="target-checkbox"]');

  await expect(sfCheckbox).toBeEnabled();
  await expect(targetCheckbox).toBeEnabled();

  // 『生成実行』ボタンをクリック
  const generateExecuteButton = page.locator('[data-testid="generate-execute-button"]');
  await generateExecuteButton.click();

  // システムがメタデータを取得し、プログレスバーで取得進捗を表示するまで待機（目安3～5秒）
  const progressBar = page.locator('[data-testid="progress-bar"]');
  await expect(progressBar).toBeVisible();

  // プログレスバーが100%に到達する
  await expect(progressBar).toHaveAttribute('aria-valuenow', '100', { timeout: 10000 });

  // 『マッピング解析中』ステータスメッセージが表示される
  const analysisMessage = page.locator('[data-testid="analysis-message"]');
  await expect(analysisMessage).toContainText('マッピング解析中');

  // 画面中央にテーブル形式で『機能マッピング表』が生成されたことを確認
  const mappingTable = page.locator('[data-testid="mapping-table"]');
  await expect(mappingTable).toBeVisible();

  // スクロールして全体を確認
  await mappingTable.scrollIntoViewIfNeeded();

  // マッピング表の『実装可能性』列に対して、以下の判定結果が行ごとに表示される
  // Salesforceの計算項目『税抜金額』→Oracleの標準フィールド『INVOICE_AMOUNT』：『完全マッピング』
  const taxExcludedMapping = page.locator('text=税抜金額').locator('..').locator('[data-testid="feasibility-status"]');
  await expect(taxExcludedMapping).toContainText('完全マッピング');

  // 『税金額』→『TAX_AMOUNT』：『完全マッピング』
  const taxAmountMapping = page.locator('text=税金額').locator('..').locator('[data-testid="feasibility-status"]');
  await expect(taxAmountMapping).toContainText('完全マッピング');

  // 『合計金額』→『TOTAL_AMOUNT』：『完全マッピング』
  const totalAmountMapping = page.locator('text=合計金額').locator('..').locator('[data-testid="feasibility-status"]');
  await expect(totalAmountMapping).toContainText('完全マッピング');

  // 請求明細の『単価×数量』→『UNIT_PRICE×QTY』：『完全マッピング』
  const unitPriceQtyMapping = page.locator('text=単価×数量').locator('..').locator('[data-testid="feasibility-status"]');
  await expect(unitPriceQtyMapping).toContainText('完全マッピング');

  // 表の上部にサマリーが表示される
  const mappingSummary = page.locator('[data-testid="mapping-summary"]');
  await expect(mappingSummary).toBeVisible();

  const summaryText = await mappingSummary.textContent();
  expect(summaryText).toContain('Salesforceメタデータ：13件');
  expect(summaryText).toContain('移行対象システムメタデータ：14件');
  expect(summaryText).toContain('マッピング成功件数：13件');

  // 画面操作に対する応答時間は 3 秒以内である
  const startTime = Date.now();
  const filterButton = page.locator('[data-testid="filter-button"]');
  await filterButton.click();
  const endTime = Date.now();
  expect(endTime - startTime).toBeLessThan(3000);
});
