import { test, expect } from '@playwright/test';

test('SCEN-429: 既存の機能マッピング詳細と検証結果が取得され、参照関係の可視化に必要な情報が準備される', async ({ page }) => {
  await page.goto('/panels/scr-1791354749663.html');

  // 既存マッピング一覧から『請求書・請求明細参照関係』を選択
  const mappingSelect = page.locator('[data-role="mapping-select"]');
  await mappingSelect.click();
  const mappingOption = page.locator('[data-value="invoice-refrel-mapping"]');
  await mappingOption.click();

  // 『オブジェクト参照関係可視化』ボタンをクリック
  const vizBtn = page.locator('[data-role="reference-visualization-btn"]');
  await vizBtn.click();

  // ローディング表示を確認
  const loading = page.locator('[data-role="loading-indicator"]');
  await expect(loading).toBeVisible();

  // 参照関係情報の取得が実行される
  // 待機：ローディング完了
  await loading.waitFor({ state: 'hidden', timeout: 15000 });

  // 可視化画面が表示
  const vizScreen = page.locator('[data-role="visualization-screen"]');
  await expect(vizScreen).toBeVisible();

  // Salesforce側の参照関係ノード2個：マスター詳細関係『請求書→取引先』
  const sfMasterDetailNode = vizScreen.locator('[data-reference-type="master-detail"][data-system="salesforce"]');
  await expect(sfMasterDetailNode).toBeVisible();
  await expect(sfMasterDetailNode).toContainText('請求書→取引先');

  // ルックアップ関係『請求明細→請求書』
  const sfLookupNode = vizScreen.locator('[data-reference-type="lookup"][data-system="salesforce"]');
  await expect(sfLookupNode).toBeVisible();
  await expect(sfLookupNode).toContainText('請求明細→請求書');

  // Oracle側の外部キー制約ノード3個
  const oracleFKNodes = vizScreen.locator('[data-reference-type="foreign-key"][data-system="oracle"]');
  const oracleFKCount = await oracleFKNodes.count();
  expect(oracleFKCount).toBe(3);

  // 既存機能マッピング詳細5件がリンク線として描画
  const mappingLinks = vizScreen.locator('[data-element-type="mapping-link"]');
  const mappingLinkCount = await mappingLinks.count();
  expect(mappingLinkCount).toBe(5);

  // 検証結果アイコン表示
  // 成功=緑3件
  const successIcons = vizScreen.locator('[data-validation-status="success"]');
  const successCount = await successIcons.count();
  expect(successCount).toBe(3);

  // 警告=黄2件
  const warningIcons = vizScreen.locator('[data-validation-status="warning"]');
  const warningCount = await warningIcons.count();
  expect(warningCount).toBe(2);

  // 画面下部に最新同期状態の表示
  const syncStatus = vizScreen.locator('[data-role="sync-status-footer"]');
  await expect(syncStatus).toContainText('最新同期状態：Salesforce[同期済み]、Oracle[同期済み]');

  // 取得日時の表示
  const lastSyncDate = vizScreen.locator('[data-field="last-sync-date"]');
  await expect(lastSyncDate).toHaveValue(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);

  // UI操作が可能（ズーム・パン）
  const zoomInBtn = vizScreen.locator('[data-role="zoom-in-btn"]');
  await expect(zoomInBtn).toBeEnabled();

  // エラーメッセージが表示されていない
  const errorMsg = page.locator('[data-role="error-message"]');
  await expect(errorMsg).not.toBeVisible();
});
