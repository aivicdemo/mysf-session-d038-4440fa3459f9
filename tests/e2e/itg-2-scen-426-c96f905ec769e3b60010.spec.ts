import { test, expect } from '@playwright/test';

test('SCEN-426: Salesforceカスタムオブジェクト定義（請求書・請求明細）の整合性が検証され、参照関係分析の前提条件を満たす', async ({ page }) => {
  await page.goto('/panels/scr-1791354749663.html');

  // 『メタデータ同期』ボタンをクリック
  const metadataSyncBtn = page.locator('[data-role="metadata-sync-btn"]');
  await metadataSyncBtn.click();

  // 同期処理のローディング表示
  const loading = page.locator('[data-role="loading-indicator"]');
  await expect(loading).toBeVisible();

  // 同期完了を待機
  await loading.waitFor({ state: 'hidden', timeout: 15000 });

  // 『整合性検証』セクション
  const consistencySection = page.locator('[data-role="consistency-check-section"]');
  await expect(consistencySection).toBeVisible();

  // Salesforce定義フィールド数: 18の表示確認
  const sfFieldCountDisplay = consistencySection.locator('[data-field="sf-field-count"]');
  await expect(sfFieldCountDisplay).toContainText('18');

  // 移行対象システム定義フィールド数: 18の表示確認
  const targetFieldCountDisplay = consistencySection.locator('[data-field="target-field-count"]');
  await expect(targetFieldCountDisplay).toContainText('18');

  // 『参照関係整合性チェック』エリア
  const relationshipCheckArea = page.locator('[data-role="relationship-consistency-area"]');
  await expect(relationshipCheckArea).toBeVisible();

  // 請求書と請求明細間の参照関係が「マスター詳細関係: 正常」
  const relationshipStatus = relationshipCheckArea.locator('[data-relationship="invoice-line"]');
  await expect(relationshipStatus).toContainText('マスター詳細関係: 正常');

  // 『参照関係分析へ進む』ボタンが有効
  const analyzeBtn = page.locator('[data-role="analyze-relationship-btn"]');
  await expect(analyzeBtn).toBeEnabled();

  // メイン画面に「メタデータ整合性検証: OK」と緑色ステータス
  const mainStatus = page.locator('[data-role="main-consistency-status"]');
  await expect(mainStatus).toContainText('メタデータ整合性検証: OK');
  await expect(mainStatus).toHaveClass(/status-success|status-green/);

  // Salesforceと移行対象システムのテーブル形式表示
  const consistencyTable = page.locator('[data-role="consistency-table"]');
  await expect(consistencyTable).toBeVisible();

  // タイムスタンプの表示確認（例：『2026-10-07 15:30:45』）
  const timestampDisplay = page.locator('[data-field="check-timestamp"]');
  await expect(timestampDisplay).toHaveValue(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);

  // 前提条件充足バッジの表示
  const prerequisiteBadge = page.locator('[data-role="prerequisite-badge"]');
  await expect(prerequisiteBadge).toContainText('前提条件充足: ✓');
});
