import { test, expect } from '@playwright/test';

test('SCEN-406: 機能マッピング表生成 - Salesforceの請求書・請求明細オブジェクト構造と移行対象システムの標準機能を対比した機能マッピング表が生成される', async ({ page }) => {
  // 機能マッピング管理画面上の「機能マッピング表生成」ボタンをクリック
  await page.goto('/panels/scr-1791354749663.html');
  await page.waitForLoadState('networkidle');

  const generateButton = page.locator('[data-testid="generate-mapping-button"]');
  await generateButton.click();

  // 「生成対象オブジェクト選択」ダイアログで「請求書（Invoice__c）」を選択
  const objectSelectDialog = page.locator('[data-testid="object-select-dialog"]');
  await expect(objectSelectDialog).toBeVisible();

  const invoiceCheckbox = page.locator('[data-testid="invoice-object-checkbox"]');
  await invoiceCheckbox.check();

  // 同ダイアログで「請求明細（InvoiceLineItem__c）」も合わせて選択
  const lineItemCheckbox = page.locator('[data-testid="line-item-object-checkbox"]');
  await lineItemCheckbox.check();

  // 「マッピング形式を選択」で「標準機能対比表」を選択
  const formatSelect = page.locator('[data-testid="mapping-format-select"]');
  await formatSelect.click();

  const standardComparisonOption = page.locator('text=標準機能対比表');
  await standardComparisonOption.click();

  // 「生成開始」ボタンをクリック
  const startButton = page.locator('[data-testid="generation-start-button"]');
  await startButton.click();

  // システムが請求書・請求明細の全フィールド・計算式・参照関係を取得する処理を待機
  const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
  await expect(loadingIndicator).toBeVisible();

  // システムが移行対象システムの請求テーブルスキーマ・計算ロジック・標準機能を取得する処理を待機
  const metadataFetch = page.locator('[data-testid="metadata-fetch-progress"]');
  await expect(metadataFetch).toBeVisible();

  // 生成完了後、画面に機能マッピング表が表示されるまで待機
  const mappingTable = page.locator('[data-testid="comparison-mapping-table"]');
  await expect(mappingTable).toBeVisible({ timeout: 20000 });

  // 機能マッピング管理画面上に以下の構成を持つ機能マッピング表が表示される

  // (1) 左列に「Salesforce請求書オブジェクト（Invoice__c）」のフィールド名・データ型・必須/オプション属性・計算式が行単位で列挙
  const sfInvoiceSection = page.locator('[data-testid="sf-invoice-section"]');
  await expect(sfInvoiceSection).toBeVisible();

  const sfFieldRows = page.locator('[data-testid="sf-invoice-field-row"]');
  const sfFieldCount = await sfFieldRows.count();
  expect(sfFieldCount).toBeGreaterThan(0);

  // (2) 中央列に該当するOracleテーブルの標準フィールドが対比表示
  const oracleSection = page.locator('[data-testid="oracle-invoice-section"]');
  await expect(oracleSection).toBeVisible();

  // (3) 右列に「マッピング状態」（完全一致・部分一致・手動マッピング必要等）が表示
  const mappingStatusColumn = page.locator('[data-testid="mapping-status-column"]');
  await expect(mappingStatusColumn).toBeVisible();

  // (4) 請求明細（InvoiceLineItem__c）についても同様の対比表が別セクションに生成
  const sfLineItemSection = page.locator('[data-testid="sf-line-item-section"]');
  await expect(sfLineItemSection).toBeVisible();

  const sfLineItemFieldRows = page.locator('[data-testid="sf-line-item-field-row"]');
  const lineItemFieldCount = await sfLineItemFieldRows.count();
  expect(lineItemFieldCount).toBeGreaterThan(0);

  // (5) 表の最下部に「生成日時」「同期源メタデータ版」「検証ステータス」が記載
  const tableFooter = page.locator('[data-testid="table-footer"]');
  await expect(tableFooter).toBeVisible();

  const footerText = await tableFooter.textContent();
  expect(footerText).toContain('生成日時');
  expect(footerText).toContain('同期源メタデータ版');
  expect(footerText).toContain('検証ステータス');

  // 画面上に生成失敗やエラーメッセージは表示されない
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).not.toBeVisible();
});
