import { test, expect } from '@playwright/test';

test('SCEN-435: 移行対象システムメタデータ取得APIが失敗した場合、前回同期時点のデータが使用され警告が表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354749663.html');

  // 『メタデータ再同期』ボタンをクリック
  const resyncBtn = page.locator('[data-role="metadata-resync-btn"]');
  await resyncBtn.click();

  // ローディング表示
  const loading = page.locator('[data-role="loading-indicator"]');
  await expect(loading).toBeVisible();

  // テストシナリオ：API呼び出しが段階的に失敗
  // 1回目：タイムアウト・接続エラー
  await page.waitForTimeout(1000);

  // 1分後の再試行をスケジュール
  // テスト環境では短縮
  await page.waitForTimeout(2000);

  // 2回目のタイムアウト・接続エラー
  await page.waitForTimeout(1000);

  // 5分後の再試行をスケジュール
  await page.waitForTimeout(2000);

  // 3回目のタイムアウト・接続エラー
  await page.waitForTimeout(1000);

  // ローディング完了を待機
  await loading.waitFor({ state: 'hidden', timeout: 10000 });

  // (1) 警告メッセージがアラートバナーとして画面上部に表示
  const alertBanner = page.locator('[data-role="alert-banner"]');
  await expect(alertBanner).toBeVisible();
  await expect(alertBanner).toContainText('Salesforceメタデータの取得に失敗しました');
  await expect(alertBanner).toContainText('前回同期時点のデータを表示しています');
  await expect(alertBanner).toContainText('管理者に連絡してください');

  // (2) 請求書・請求明細カスタムオブジェクトの前回同期時点の参照関係がオブジェクト参照関係可視化エリアに表示
  const visualizationArea = page.locator('[data-role="visualization-area"]');
  await expect(visualizationArea).toBeVisible();

  const invoiceObj = visualizationArea.locator('[data-object="invoice"]');
  const lineItemObj = visualizationArea.locator('[data-object="lineitem"]');
  await expect(invoiceObj).toBeVisible();
  await expect(lineItemObj).toBeVisible();

  // ルックアップ関係、マスター詳細関係などが表示
  const relationshipElements = visualizationArea.locator('[data-role="relationship-element"]');
  const relationshipCount = await relationshipElements.count();
  expect(relationshipCount).toBeGreaterThanOrEqual(2);

  // (3) マッピング作業用の入力フィールド・保存ボタンなどが有効な状態
  const mappingForm = page.locator('[data-role="mapping-form"]');
  await expect(mappingForm).toBeVisible();

  const inputFields = mappingForm.locator('input[type="text"]');
  const firstInput = inputFields.first();
  await expect(firstInput).toBeEnabled();

  const saveBtn = page.locator('[data-role="save-btn"]');
  await expect(saveBtn).toBeEnabled();
});
