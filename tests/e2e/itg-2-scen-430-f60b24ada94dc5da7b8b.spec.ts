import { test, expect } from '@playwright/test';

test('SCEN-430: 参照関係可視化操作が監査証跡として記録され、操作の追跡可能性が確保される', async ({ page }) => {
  await page.goto('/panels/scr-1791354749663.html');

  // 『オブジェクト参照関係』セクションを確認
  const refSection = page.locator('[data-role="object-reference-section"]');
  await expect(refSection).toBeVisible();

  // 参照関係ビジュアライゼーション機能を操作
  // 「参照関係を表示」ボタンをクリック
  const displayBtn = refSection.locator('[data-role="display-references-btn"]');
  await displayBtn.click();

  // ローディング表示
  const loading = page.locator('[data-role="loading-indicator"]');
  await expect(loading).toBeVisible();
  await loading.waitFor({ state: 'hidden', timeout: 10000 });

  // ビジュアライゼーション表示を確認
  const visualization = refSection.locator('[data-role="visualization"]');
  await expect(visualization).toBeVisible();

  // 請求書オブジェクトと請求明細オブジェクトを表す箱が矢印で接続された図が表示
  const invoiceBox = visualization.locator('[data-object="invoice"]');
  const lineItemBox = visualization.locator('[data-object="lineitem"]');
  const connectionArrow = visualization.locator('[data-connection="invoice-to-lineitem"]');

  await expect(invoiceBox).toBeVisible();
  await expect(lineItemBox).toBeVisible();
  await expect(connectionArrow).toBeVisible();

  // ブラウザのデベロッパーツールで監査ログを確認
  // テスト環境では監査ログAPIを直接呼び出す
  const auditLogsResponse = await page.evaluate(async () => {
    const response = await fetch('/api/audit-logs?operation=参照関係可視化&limit=1');
    return await response.json();
  });

  // 監査ログレコードの確認
  expect(auditLogsResponse.logs).toBeDefined();
  expect(auditLogsResponse.logs.length).toBeGreaterThan(0);

  const auditRecord = auditLogsResponse.logs[0];

  // (1) 操作種別：『オブジェクト参照関係可視化』または『参照関係ビジュアライゼーション表示』
  expect(auditRecord.operationType).toMatch(/オブジェクト参照関係可視化|参照関係ビジュアライゼーション表示/);

  // (2) 操作ユーザー：ログイン中のユーザーID
  expect(auditRecord.userId).toBeTruthy();

  // (3) 操作日時：テスト実行時刻に対応するタイムスタンプ（秒単位以上の精度）
  const now = new Date();
  const auditTime = new Date(auditRecord.operationDateTime);
  const timeDiffSeconds = Math.abs((now.getTime() - auditTime.getTime()) / 1000);
  expect(timeDiffSeconds).toBeLessThan(60); // 1分以内

  // (4) 対象オブジェクト：『請求書』および『請求明細』
  expect(auditRecord.targetObjects).toContain('請求書');
  expect(auditRecord.targetObjects).toContain('請求明細');

  // (5) 操作内容の詳細：実行されたアクション（例：『参照関係表示』）
  expect(auditRecord.operationDetail).toMatch(/参照関係表示/);

  // (6) 操作前後の状態変化：表示対象フィルタ条件など
  expect(auditRecord.stateChange).toBeDefined();
});
