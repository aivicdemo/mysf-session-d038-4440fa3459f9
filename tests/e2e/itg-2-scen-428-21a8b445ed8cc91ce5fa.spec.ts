import { test, expect } from '@playwright/test';

test('SCEN-428: Salesforceカスタムオブジェクト間の参照関係が分析され、依存グラフが生成される', async ({ page }) => {
  await page.goto('/panels/scr-1791354749663.html');

  // 左側パネルで『オブジェクト参照関係』メニューをクリック
  const refMenu = page.locator('[data-role="object-reference-menu"]');
  await refMenu.click();

  // 『参照関係分析を実行』ボタンをクリック
  const analyzeBtn = page.locator('[data-role="analyze-reference-btn"]');
  await analyzeBtn.click();

  // グラフ表示エリアに依存グラフが表示開始
  const graphArea = page.locator('[data-role="dependency-graph-area"]');
  await expect(graphArea).toBeVisible();

  // ローディングインジケータが表示
  const loading = page.locator('[data-role="loading-indicator"]');
  await expect(loading).toBeVisible();

  // ローディング完了を待機
  await loading.waitFor({ state: 'hidden', timeout: 15000 });

  // グラフが描画されている
  const graph = graphArea.locator('[data-role="graph-canvas"]');
  await expect(graph).toBeVisible();

  // 4つのノード『請求書』『請求明細』『商談』『商品』が配置
  const invoiceNode = graph.locator('[data-node-id="invoice"]');
  const lineItemNode = graph.locator('[data-node-id="lineitem"]');
  const opportunityNode = graph.locator('[data-node-id="opportunity"]');
  const productNode = graph.locator('[data-node-id="product"]');

  await expect(invoiceNode).toBeVisible();
  await expect(lineItemNode).toBeVisible();
  await expect(opportunityNode).toBeVisible();
  await expect(productNode).toBeVisible();

  // 各ノードにカスタムオブジェクト名が表示
  await expect(invoiceNode).toContainText('請求書');
  await expect(lineItemNode).toContainText('請求明細');
  await expect(opportunityNode).toContainText('商談');
  await expect(productNode).toContainText('商品');

  // 有向矢印による関係表示
  // 請求書→商談（ルックアップ関係）
  const invoiceToOpp = graph.locator('[data-edge-from="invoice"][data-edge-to="opportunity"]');
  await expect(invoiceToOpp).toBeVisible();

  // 請求明細→請求書（マスター詳細、太線）
  const lineItemToInvoice = graph.locator('[data-edge-from="lineitem"][data-edge-to="invoice"][data-edge-type="master-detail"]');
  await expect(lineItemToInvoice).toBeVisible();

  // 請求明細→商品（ルックアップ、細線）
  const lineItemToProduct = graph.locator('[data-edge-from="lineitem"][data-edge-to="product"][data-edge-type="lookup"]');
  await expect(lineItemToProduct).toBeVisible();

  // グラフ下部に最終同期日時の表示
  const syncTimestamp = graph.locator('[data-field="sync-timestamp"]');
  await expect(syncTimestamp).toHaveValue(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);

  // 完了メッセージが一時表示（3秒後に消える）
  const successMsg = page.locator('[data-role="success-message"]');
  await expect(successMsg).toBeVisible();
  await expect(successMsg).toContainText('依存グラフを正常に生成しました');

  // メッセージが消えるのを確認
  await successMsg.waitFor({ state: 'hidden', timeout: 5000 });
});
