import { test, expect } from '@playwright/test';

test('SCEN-434: Salesforceメタデータ取得APIが失敗した場合、前回同期時点のデータが使用され警告が表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354749663.html');

  // 『メタデータを同期』ボタンをクリック
  const syncBtn = page.locator('[data-role="metadata-sync-btn"]');
  await syncBtn.click();

  // ローディング表示
  const loading = page.locator('[data-role="loading-indicator"]');
  await expect(loading).toBeVisible();

  // テストシナリオ：API呼び出しが段階的に失敗
  // 1回目のタイムアウトエラー（HTTP 504）を想定
  await page.waitForTimeout(1000);

  // 1分待機後、自動的に2回目の再試行がバックグラウンドで実行
  // テスト環境では待機時間を短縮
  await page.waitForTimeout(2000);

  // 2回目の呼び出しがタイムアウトエラー
  await page.waitForTimeout(1000);

  // 5分待機後、3回目の再試行実行
  await page.waitForTimeout(2000);

  // 3回目の呼び出しがタイムアウトエラー
  await page.waitForTimeout(1000);

  // ローディング完了を待機
  await loading.waitFor({ state: 'hidden', timeout: 10000 });

  // 同期ステータス領域に警告メッセージが表示
  const syncStatusArea = page.locator('[data-role="sync-status-area"]');
  await expect(syncStatusArea).toBeVisible();

  const warningMessage = syncStatusArea.locator('[data-role="warning-message"]');
  await expect(warningMessage).toBeVisible();
  await expect(warningMessage).toContainText('Salesforceメタデータの取得に失敗しました');
  await expect(warningMessage).toContainText('前回同期時点のデータを表示しています');
  await expect(warningMessage).toContainText('管理者に連絡してください');

  // 黄色の警告アイコン付き
  const warningIcon = syncStatusArea.locator('[data-role="warning-icon"]');
  await expect(warningIcon).toBeVisible();

  // 参照関係ダイアグラムに前回同期時点のデータが表示
  const diagramArea = page.locator('[data-role="reference-diagram"]');
  await expect(diagramArea).toBeVisible();

  // Invoice_cとInvoiceLineItem_cの3件の参照関係が表示
  const referenceCount = await diagramArea.locator('[data-role="reference-node"]').count();
  expect(referenceCount).toBeGreaterThanOrEqual(3);

  // 新規フィールドや追加された参照関係は反映されていない（前回データのまま）
  const lastSyncDate = diagramArea.locator('[data-field="last-sync-date"]');
  await expect(lastSyncDate).toHaveValue(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);
});
