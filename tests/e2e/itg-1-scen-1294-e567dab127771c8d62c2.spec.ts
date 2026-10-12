import { test, expect } from '@playwright/test';

test('SCEN-1294: 商談クローズから請求書生成までの経過日数が目標を超過しSLA超過判定される', async ({ page }) => {
  // 営業プロセス統合ダッシュボードにアクセスする
  await page.goto('/panels/scr-1791354337614.html');

  // ダッシュボード画面が表示される
  const dashboardPanel = page.locator('[data-aivic-panel="scr-1791354337614"]');
  await expect(dashboardPanel).toBeVisible();

  // 異常検知パネルが表示されて、高優先度異常件数が確認できる
  const anomalyHighCount = page.locator('#anomaly-high-count');
  await expect(anomalyHighCount).toBeVisible();
  const highCountText = await anomalyHighCount.textContent();
  expect(highCountText).toMatch(/^\d+件$/);

  // 商談・請求管理画面から当該商談の請求書生成画面を開く
  await page.click('a[data-aivic-nav="scr-1791354351333"]');
  await page.waitForURL('/panels/scr-1791354351333.html');

  // ステージフィルターで「成約」を選択
  const stageFilter = page.locator('#filter-stage');
  await stageFilter.selectOption('成約');

  // 該当の商談レコード（ステージ=成約、成約日=2025-01-28）を検索・表示する
  // ABC製造株式会社 生産管理システム導入プロジェクト を選択
  const dealTable = page.locator('[data-testid="deal-list-table"]').or(page.locator('#deal-tbody'));
  const dealRow = page.locator('tr:has-text("ABC製造株式会社 生産管理システム導入プロジェクト")').first();
  await expect(dealRow).toBeVisible();
  await dealRow.click();

  // 商談詳細がサイドパネルに表示される
  const detailPanel = page.locator('#detail-panel');
  await expect(detailPanel).toBeVisible();

  // 請求書生成処理を実行する
  const generateButton = page.locator('#btn-generate-invoice');
  await expect(generateButton).toBeEnabled();
  await generateButton.click();

  // 請求書生成モーダルが表示される
  const generateModal = page.locator('#modal-generate');
  await expect(generateModal).toHaveClass(/open/);

  // 請求書生成確定ボタンをクリック
  const confirmButton = page.locator('#btn-confirm-generate');
  await confirmButton.click();

  // モーダルが閉じられる
  await expect(generateModal).not.toHaveClass(/open/);

  // システムが経過日数を計算し、SLA判定ロジックを実行する（目標30日 < 経過35日）
  // 生成完了のメッセージが表示される
  const successMessage = page.locator('text="請求書を生成しました"').or(page.locator('[data-testid="success-message"]'));
  await expect(successMessage).toBeVisible({ timeout: 5000 });

  // ダッシュボードに戻る
  await page.click('a[data-aivic-nav="scr-1791354337614"]');
  await page.waitForURL('/panels/scr-1791354337614.html');

  // 営業プロセス統合ダッシュボード内の異常検知パネルを確認
  const anomalyPanel = page.locator('[data-testid="anomaly-high"]').or(page.locator('.anomaly-high')).first();
  await expect(anomalyPanel).toBeVisible();

  // 『請求書生成SLA』ステータス表示が『超過』（赤色または警告アイコン付き）と判定されて表示される
  // 異常検知パネルの高優先度異常をクリック
  await anomalyPanel.click();

  // 異常詳細パネルが表示される
  const anomalyDetailPanel = page.locator('#anomaly-detail');
  await expect(anomalyDetailPanel).toBeVisible();

  // SLA超過、商談ID、経過日数、目標日数を含むテキストが表示される
  const detailText = await anomalyDetailPanel.textContent();
  expect(detailText).toContain('SLA超過');
  expect(detailText).toContain('35日');
  expect(detailText).toContain('30日');

  // ダッシュボード上の未請求案件テーブルで当該商談が表示される
  const unbilledTable = page.locator('[data-testid="unbilled-deals-table"]');
  const unbilledTableText = await unbilledTable.textContent();

  // 異常値検知欄に当該商談が『SLA超過案件』として一覧表示される
  const slaBreachIndicator = await page.locator('text=/SLA超過|超過案件/').first();
  await expect(slaBreachIndicator).toBeVisible();
});
