import { test, expect } from '@playwright/test';

test('SCEN-427: カスタムオブジェクト間参照関係の定義が完全かつ矛盾なく検証される', async ({ page }) => {
  await page.goto('/panels/scr-1791354749663.html');

  // オブジェクト参照関係セクションを表示
  const refSection = page.locator('[data-role="object-reference-section"]');
  await expect(refSection).toBeVisible();

  // 参照関係データが読み込まれる
  const refData = refSection.locator('[data-role="reference-data"]');
  await expect(refData).toBeVisible();

  // 参照関係の一覧表示またはグラフ表示
  const refVisualization = refSection.locator('[data-role="reference-visualization"]');
  await expect(refVisualization).toBeVisible();

  // 「関係を検証」ボタンをクリック
  const validateBtn = refSection.locator('[data-role="validate-relationships-btn"]');
  await validateBtn.click();

  // 検証処理のローディング表示
  const loading = page.locator('[data-role="loading-indicator"]');
  await expect(loading).toBeVisible();

  // 検証完了を待機
  await loading.waitFor({ state: 'hidden', timeout: 10000 });

  // 検証結果パネルの表示
  const resultPanel = page.locator('[data-role="validation-result-panel"]');
  await expect(resultPanel).toBeVisible();

  // 期待されるメッセージの表示確認
  const resultMessage = resultPanel.locator('[data-role="result-message"]');
  await expect(resultMessage).toContainText('参照関係検証完了: 請求書(Invoice__c)→請求明細(InvoiceLineItem__c)のマスター詳細関係を確認しました');
  await expect(resultMessage).toContainText('1件の参照関係が定義されており');
  await expect(resultMessage).toContainText('矛盾・欠落・循環参照は検出されませんでした');

  // 参照関係図に2つのオブジェクトノードが描画
  const invoiceNode = page.locator('[data-object-node="Invoice__c"]');
  const lineItemNode = page.locator('[data-object-node="InvoiceLineItem__c"]');
  await expect(invoiceNode).toBeVisible();
  await expect(lineItemNode).toBeVisible();

  // 接続線でノードが結ばれている
  const connectionLine = page.locator('[data-connection="invoice-to-lineitem"]');
  await expect(connectionLine).toBeVisible();

  // 接続線上にマスター詳細関係のラベルが表示
  const relationshipLabel = connectionLine.locator('[data-label="relationship-type"]');
  await expect(relationshipLabel).toBeVisible();
  await expect(relationshipLabel).toContainText('マスター詳細');

  // 検証ステータスが「✓ 完全」と表示
  const statusDisplay = resultPanel.locator('[data-role="validation-status"]');
  await expect(statusDisplay).toContainText('✓ 完全');
});
