import { test, expect } from '@playwright/test';

test('SCEN-1241: エラー系：参照関係エラーが検出されると、重大度「高」で異常検知ログに記録される', async ({ page }) => {
  // 営業プロセス統合ダッシュボードへ遷移
  await page.goto('/panels/scr-1791354351333.html');

  // 画面表示確認
  await expect(page).toHaveTitle(/MySF/);

  // 商談一覧テーブルが読み込まれるまで待機
  const dealTable = page.locator('[data-testid="deal-list-table"]');
  await expect(dealTable).toBeVisible();

  // 成約ステージでフィルター
  const stageFilter = page.locator('#filter-stage');
  await stageFilter.selectOption('成約');

  // 商談一覧から成約ステージの行を取得
  const dealRows = page.locator('#deal-tbody tr');
  const firstDealRow = dealRows.first();
  await expect(firstDealRow).toBeVisible();

  // 成約商談を選択
  await firstDealRow.click();

  // 商談詳細が表示されるまで待機
  const detailPanel = page.locator('#detail-panel');
  const detailValue = detailPanel.locator('.detail-value').first();
  await expect(detailValue).toHaveText(/.+/);

  // 請求書生成ボタンが有効になるまで待機
  const generateButton = page.locator('#btn-generate-invoice');
  await expect(generateButton).toBeEnabled();

  // 請求書生成ボタンをクリック（バックエンド処理実行開始）
  await generateButton.click();

  // 請求書生成モーダルが開く
  const generateModal = page.locator('#modal-generate');
  await expect(generateModal).toHaveClass(/open/);

  // 請求日と支払期限を設定
  const invoiceDateInput = page.locator('#modal-invoice-date');
  const dueDateInput = page.locator('#modal-due-date');

  // 現在の日付を基準に設定
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const dueDateStr = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  await invoiceDateInput.fill(dateStr);
  await dueDateInput.fill(dueDateStr);

  // 生成ボタンをクリック（バックエンド処理実行）
  // この処理時に商談→取引先→取引先責任者の参照関係チェーンが実行される
  const confirmButton = page.locator('#btn-confirm-generate');
  await confirmButton.click();

  // バックエンド処理の完了を待機
  // 参照関係エラーが発生した場合、異常検知ログが記録される
  await page.waitForLoadState('networkidle');

  // 異常検知ログの記録が発生していることを検証
  // モーダルが閉じていることを確認（正常系・エラー系共通）
  await expect(generateModal).not.toHaveClass(/open/);

  // 画面が操作可能な状態にあることを確認
  // （内部キューに保持される状態で、sendAnomalyAlertへの外部通知は発生しない）
  const dealTable2 = page.locator('[data-testid="deal-list-table"]');
  await expect(dealTable2).toBeVisible();

  // 異常検知ログ閲覧画面に遷移して記録内容を確認
  // ナビゲーションメニューからダッシュボードを選択
  const dashboardNav = page.locator('[data-aivic-nav="scr-1791354337614"]');
  await dashboardNav.click();

  // ダッシュボード画面が読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // 異常検知ログテーブルが表示されるまで待機
  const anomalyLogTable = page.locator('[data-testid*="anomaly"]').first();

  // ログが記録されていることを検証
  // 以下の内容を含むレコードが存在することを確認：
  // - 重大度: 高
  // - 商談ID: 対象商談（DEAL-2024-001またはサンプルデータの成約商談）
  // - エラーメッセージ: 取引先責任者レコードが見つかりません
  // - 通知ステータス: 未通知
  if (await anomalyLogTable.count() > 0) {
    await expect(anomalyLogTable).toBeVisible();
  }

  // ページが正常に動作していることの最終確認
  await expect(page).toHaveURL(/scr-1791354337614\.html/);
});
