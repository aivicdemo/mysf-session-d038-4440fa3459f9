import { test, expect } from '@playwright/test';

test('SCEN-1306: 商談金額と請求金額が照合され、差異がない場合は一致と判定される', async ({ page }) => {
  // ステップ1: 営業プロセス統合ダッシュボードにログイン
  await page.goto('/panels/scr-1791354337614.html');

  // ログイン後、商談・請求管理画面に移動
  // 画面上の「商談・請求管理」ナビゲーション項目をクリック
  await page.goto('/panels/scr-1791354351333.html');

  // ステップ2: 商談・請求管理画面を開き、請求INV-2024-001を検索・選択
  // 商談を検索するための関連請求書タブを確認
  const invoiceTabBtn = page.locator('[data-testid="tab-invoices"], #invoices-tab');

  // 画面には初期データ（取引先DL-2024-001, 請求INV-2024-001）が表示されていることを想定
  // テーブルから請求書番号「INV-2024-001」を検出
  const invoiceRow = page.locator('text=INV-2024-001').first();
  await expect(invoiceRow).toBeVisible();

  // ステップ3: 請求書の詳細画面で商談金額と請求金額を確認
  // 商談金額: 1,500,000円、請求金額: 1,500,000円が表示されていることを確認
  // 詳細パネルに商談情報が表示される
  const dealDetailPanel = page.locator('#detail-panel');
  await expect(dealDetailPanel).toContainText('1500000');

  // 請求明細に請求金額1,500,000円が表示されていることを確認
  const invoiceDetailsTable = page.locator('#invoice-detail-tbody');
  await expect(invoiceDetailsTable).toContainText('1500000');

  // ステップ4: 請求書再発行ボタンをクリックして再発行確定フローを起動
  const reissueBtn = page.locator('[data-testid="btn-reissue-invoice"], #btn-reissue-invoice');
  await reissueBtn.click();

  // モーダルが開かれることを待つ
  const reissueModal = page.locator('[data-testid="modal-reissue"], #modal-reissue');
  await expect(reissueModal).toHaveClass(/open/);

  // ステップ5: 金額照合ロジックが実行され、画面に照合結果が表示されるのを待つ
  // 再発行確定ボタンをクリック
  const confirmReissueBtn = page.locator('[data-testid="btn-confirm-reissue"], #btn-confirm-reissue');
  await confirmReissueBtn.click();

  // 期待結果: 「金額照合: 一致」メッセージが表示される
  // アラート表示またはモーダル内に「一致」の表示を確認
  const matchResultText = page.locator('text=金額照合: 一致');
  await expect(matchResultText).toBeVisible({ timeout: 5000 });

  // ステータスが「再発行処理中」に遷移していることを確認
  // 再発行ボタンが無効化されるか、進行中インジケータが表示される
  const statusText = page.locator('text=再発行処理中');
  await expect(statusText).toBeVisible({ timeout: 5000 });

  // 差異検知通知（異常検知アラート）が表示されないことを確認
  const anomalyAlert = page.getByText('異常検知');
  await expect(anomalyAlert).not.toBeVisible();

  const discrepancyAlert = page.getByText('差異');
  await expect(discrepancyAlert).not.toBeVisible();
});
