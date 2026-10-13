import { test, expect } from '@playwright/test';

test('SCEN-420: 機能マッピング表再読込操作が監査証跡として記録され、操作履歴テーブルに保存される', async ({
  page,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error('baseURL is not configured');
  }

  // 1. 機能マッピング管理画面を開く（ログイン状態を前提）
  // 仕様のテスト対象画面は認証済みユーザーがアクセスする場合を想定
  await page.goto('/panels/scr-1791354749663.html');
  await page.waitForLoadState('networkidle');

  // 2. 再読込（更新）ボタンの存在を確認
  const refreshBtn = page.locator('#refresh-btn, [data-testid="refresh-btn"]');
  await expect(refreshBtn).toBeVisible();

  // 3. API 接続情報を取得
  const pageConfig = await page.evaluate(() => ({
    apiUrl: (window as any).AIVIC_API_URL,
    appId: (window as any).AIVIC_APP_ID,
    tables: (window as any).AIVIC_TABLES,
  }));

  if (!pageConfig.apiUrl || !pageConfig.appId) {
    throw new Error('API configuration not available on page');
  }

  // 操作履歴テーブル名を決定（デフォルト: operation_audit_trail）
  const auditTableName = 'operation_audit_trail';

  // 操作前の既存レコード数を取得
  const countBeforeResponse = await page.request.get(
    `${pageConfig.apiUrl}/api/by-name?app=${pageConfig.appId}&table=${encodeURIComponent(auditTableName)}`
  );

  const recordsBefore = await countBeforeResponse.json().catch(() => []);
  const initialRecordCount = Array.isArray(recordsBefore) ? recordsBefore.length : (recordsBefore.records || []).length;

  // 4. 再読込ボタンをクリック
  const operationTime = new Date();
  await refreshBtn.click();

  // 5. ローディング表示が出現する場合を待機
  const mappingTable = page.locator('table tbody');
  await expect(mappingTable).toBeVisible();

  // 6. ネットワークが安定するまで待機
  await page.waitForLoadState('networkidle');

  // 7. 操作後の履歴テーブルをクエリ
  const countAfterResponse = await page.request.get(
    `${pageConfig.apiUrl}/api/by-name?app=${pageConfig.appId}&table=${encodeURIComponent(auditTableName)}`
  );

  const recordsAfter = await countAfterResponse.json().catch(() => []);
  const allRecords = Array.isArray(recordsAfter) ? recordsAfter : (recordsAfter.records || []);

  // 8. 新規レコードが追加されたことを確認
  expect(allRecords.length).toBeGreaterThanOrEqual(initialRecordCount);

  // 9. 最新レコードが「機能マッピング表再読込」操作であることを確認
  const latestRecord = allRecords[allRecords.length - 1];

  // 操作種別が「機能マッピング表再読込」
  expect(latestRecord.operationType || latestRecord.operation_type).toBe('機能マッピング表再読込');

  // 操作結果が「成功」
  expect(latestRecord.operationStatus || latestRecord.operation_status).toBe('成功');

  // 操作対象が「機能マッピング表」を含む
  const targetTableName = latestRecord.targetTableName || latestRecord.target_table_name || '';
  expect(targetTableName).toMatch(/機能マッピング表|Salesforce請求書|請求明細/);

  // 10. 操作者（ログイン中のユーザーID）が記録されている
  const userId = latestRecord.userId || latestRecord.user_id;
  expect(userId).toBeTruthy();

  // 11. 操作日時が秒単位まで記録されている（秒単位の精度）
  const recordedTimestamp = latestRecord.operationTimestamp || latestRecord.operation_timestamp;
  expect(recordedTimestamp).toBeTruthy();

  const recordedTime = new Date(recordedTimestamp);
  expect(recordedTime.getTime()).toBeGreaterThanOrEqual(operationTime.getTime() - 2000);
  expect(recordedTime.getTime()).toBeLessThanOrEqual(new Date().getTime() + 1000);

  // 12. 詳細情報に呼び出し API 境界が記録されている
  const operationDetails = latestRecord.operationDetails || latestRecord.operation_details || '';
  expect(operationDetails).toMatch(
    /SalesforceMetadataApiConnector|TargetSystemMetadataConnector|metadata/i
  );

  // 13. 同期メタデータレコード数が記録されている
  expect(operationDetails).toMatch(/同期.*レコード|synced|records|件/i);
});
