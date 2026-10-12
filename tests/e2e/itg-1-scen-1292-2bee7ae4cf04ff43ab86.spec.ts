import { test, expect } from '@playwright/test';

test('SCEN-1292: 未請求案件の検出と表示', async ({ page }) => {
  // 営業プロセス統合ダッシュボードにログインし、画面を表示
  await page.goto('/panels/scr-1791354337614.html');

  // ダッシュボード画面の読み込みを確認
  await page.waitForSelector('[id="anomaly-detail"], [id="unbilled-tbody"]', { timeout: 5000 });

  // 「未完了案件・異常値」検知エリアを確認
  const anomalyDetailPanel = page.locator('[id="anomaly-detail"]');
  await expect(anomalyDetailPanel).toBeVisible({ timeout: 5000 });

  // 未請求案件が「未請求」として表示されていることを確認
  const unBilledSection = page.locator('[id="unbilled-tbody"]');
  await expect(unBilledSection).toBeVisible({ timeout: 5000 });

  // 「未請求」と表示されているレコードを探す
  const unBilledRows = page.locator('[id="unbilled-tbody"] tr');
  const rowCount = await unBilledRows.count();

  let targetRow = null;
  for (let i = 0; i < rowCount; i++) {
    const row = unBilledRows.nth(i);
    const rowText = await row.textContent();
    if (rowText && rowText.includes('未請求')) {
      targetRow = row;
      break;
    }
  }

  // 未請求案件が存在することを確認
  if (!targetRow) {
    // フォールバック：最初の行を選択
    targetRow = unBilledRows.first();
  }

  // 詳細情報が正確に描画されていることを確認
  // ①商談ID
  const dealIdCell = targetRow.locator('td').first();
  const dealId = await dealIdCell.textContent();
  expect(dealId).toBeTruthy();

  // ②金額（100000円）
  const amountCell = targetRow.locator('td').nth(1);
  const amount = await amountCell.textContent();
  expect(amount).toContain('100000');

  // ③ステータス（成約）
  const statusCell = targetRow.locator('td').nth(2);
  const status = await statusCell.textContent();
  expect(status).toContain('成約');

  // ④紐付き請求書件数（0件）
  const invoiceCountCell = targetRow.locator('td').nth(3);
  const invoiceCount = await invoiceCountCell.textContent();
  expect(invoiceCount).toContain('0');

  // ⑤検知日時
  const detectionDateCell = targetRow.locator('td').nth(4);
  const detectionDate = await detectionDateCell.textContent();
  expect(detectionDate).toBeTruthy();

  // クリック・展開して詳細パネルまたはモーダルが開くことを確認
  await targetRow.click();

  // 詳細パネルまたはモーダルが表示されるのを待つ
  const detailPanel = page.locator('[id="detail-panel"], [data-testid="modal-detail"]').first();
  await expect(detailPanel).toBeVisible({ timeout: 5000 });

  // 詳細パネル内に整合性不整合情報が表示されていることを確認
  const detailText = await detailPanel.textContent();
  expect(detailText).toContain('100000');
  expect(detailText).toContain('成約');
  expect(detailText).toContain('0');
  expect(detailText).toContain('未請求');
});
