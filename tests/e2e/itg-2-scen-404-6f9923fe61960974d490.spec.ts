import { test, expect } from '@playwright/test';

test('SCEN-404: 機能マッピング表生成 - Salesforceオブジェクト間の参照関係が分析され、マッピング対象の依存構造が把握される', async ({ page }) => {
  // 機能マッピング管理画面で『新規マッピング表生成』ボタンをクリック
  await page.goto('/panels/scr-1791354749663.html');
  await page.waitForLoadState('networkidle');

  const newMappingButton = page.locator('[data-testid="new-mapping-table-button"]');
  await newMappingButton.click();

  // メタデータ取得ダイアログで『同期開始』ボタンをクリック
  const syncDialog = page.locator('[data-testid="sync-metadata-dialog"]');
  await expect(syncDialog).toBeVisible();

  const syncButton = page.locator('[data-testid="sync-start-button"]');
  await syncButton.click();

  // 画面上部の『依存構造を分析』ボタンをクリック
  const analyzeButton = page.locator('[data-testid="analyze-dependency-button"]');
  await analyzeButton.click();

  // マッピング表の生成完了を待つ（ローディング表示が消えるまで）
  const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
  await expect(loadingIndicator).not.toBeVisible({ timeout: 15000 });

  // 生成されたマッピング表をスクロールして確認
  const mappingTableContainer = page.locator('[data-testid="mapping-table-container"]');
  await expect(mappingTableContainer).toBeVisible();

  // マッピング表内に依存構造情報が視覚的に表示されていること
  // (1) Salesforce請求書オブジェクトと請求明細オブジェクト間のマスター詳細関係が『依存関係：強』と記載
  const masterDetailRelationship = page.locator('[data-testid="master-detail-relationship"]');
  await expect(masterDetailRelationship).toContainText('依存関係：強');

  // (2) Salesforce請求明細オブジェクトから取引先への参照関係（Account_Lookup__c）が『依存関係：弱』と記載
  const lookupRelationship = page.locator('[data-testid="lookup-relationship"]');
  await expect(lookupRelationship).toContainText('依存関係：弱');

  // (3) Oracle側のINVOICE_IDとINVOICE_LINE.INVOICE_IDの外部キー関係が対応欄に記載
  const oracleForeignKey = page.locator('[data-testid="oracle-foreign-key"]');
  await expect(oracleForeignKey).toContainText('INVOICE_ID');

  // (4) 『依存構造マップ』タブをクリックするとノード図形でオブジェクト間の矢印・接続線が表示
  const dependencyMapTab = page.locator('[data-testid="dependency-map-tab"]');
  await dependencyMapTab.click();

  const dependencyGraphContainer = page.locator('[data-testid="dependency-graph"]');
  await expect(dependencyGraphContainer).toBeVisible();

  // (5) 依存構造の階層レベルが『請求書（L0）→請求明細（L1）→取引先（L2）』のように段階表示
  const hierarchyLevels = page.locator('[data-testid="hierarchy-level"]');
  const levelCount = await hierarchyLevels.count();
  expect(levelCount).toBeGreaterThanOrEqual(3);

  const invoiceLevel = page.locator('[data-testid="level-invoice"]');
  await expect(invoiceLevel).toContainText('L0');

  const lineItemLevel = page.locator('[data-testid="level-line-item"]');
  await expect(lineItemLevel).toContainText('L1');
});
