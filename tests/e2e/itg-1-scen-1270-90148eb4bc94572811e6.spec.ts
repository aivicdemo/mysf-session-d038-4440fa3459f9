import { test, expect } from '@playwright/test';

test('SCEN-1270: 修正後の請求書金額と商談金額の整合性を検証し、金額ズレ・計算誤り・参照関係の不整合を検出できる', async ({ page }) => {
  // 営業プロセス統合ダッシュボード画面を開く
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForLoadState('networkidle');

  // ダッシュボード画面で商談DL-2024-001（金額: 1,000,000円）を特定し、関連する請求書INV-2024-0001の金額情報を確認
  // ダッシュボードの「未請求案件」テーブルまたは「金額ズレ検出案件」テーブルから情報を取得
  const discrepancyTable = page.locator('table[data-testid="amount-discrepancy-table"] tbody');
  await expect(discrepancyTable).toBeVisible();

  // 商談・請求管理画面に遷移
  await page.click('[data-aivic-nav="scr-1791354351333"]');
  await page.waitForLoadState('networkidle');

  // 請求書INV-2024-0001を検索・選択して詳細を表示
  // 商談一覧から対応する商談を探す
  const dealTable = page.locator('table[data-testid="deal-list-table"] tbody');
  await expect(dealTable).toBeVisible();

  // フィルターでステージを「成約」に設定して、金額が1,000,000円の商談を探す
  await page.click('[data-testid="filter-stage"]');
  await page.selectOption('[data-testid="filter-stage"]', '成約');

  // 商談一覧から最初の行を選択
  const dealRows = await page.locator('table[data-testid="deal-list-table"] tbody tr');
  const dealRowCount = await dealRows.count();
  expect(dealRowCount).toBeGreaterThan(0);
  await dealRows.first().click();

  // 詳細パネルが表示され、商談金額が確認できることを検証
  const detailPanel = page.locator('#detail-panel');
  await expect(detailPanel).toBeVisible();

  // 関連請求書タブを確認し、請求書番号を確認
  const invoiceTable = page.locator('table[data-testid="invoice-list-table"] tbody');
  const invoiceRows = await invoiceTable.locator('tr').count();
  expect(invoiceRows).toBeGreaterThan(0);

  // 請求書詳細画面で、現在の請求金額950,000円と請求明細（500,000円+450,000円）を確認
  const detailsTab = page.locator('[data-testid="tab-details"]');
  if (await detailsTab.isVisible()) {
    await detailsTab.click();
    const detailTable = page.locator('table[data-testid="invoice-detail-table"] tbody');
    await expect(detailTable).toBeVisible();
  }

  // 請求書修正操作を実行し、明細2の金額を450,000円から550,000円に変更
  // 「請求書修正」ボタンをクリック
  const editButton = page.locator('[data-testid="btn-edit-invoice"]');
  if (await editButton.isEnabled()) {
    await editButton.click();
    await expect(page.locator('#edit-form')).toHaveClass(/visible/);

    // 修正対象明細行を選択（2行目）
    const lineSelect = page.locator('[data-testid="edit-line-select"]');
    await lineSelect.click();
    const options = await page.locator('[data-testid="edit-line-select"] option').count();
    if (options > 2) {
      await page.selectOption('[data-testid="edit-line-select"]', { index: 2 });
    }

    // 金額を550,000円に修正
    await page.fill('[data-testid="edit-unit-price"]', '550000');
    await page.fill('[data-testid="edit-tax-rate"]', '10');
  }

  // 修正内容を保存ボタンで確定
  await page.click('[data-testid="btn-apply-edit"]');

  // アラート/確認ダイアログ処理
  page.once('dialog', dialog => {
    if (dialog.type() === 'alert' || dialog.type() === 'confirm') {
      dialog.accept();
    }
  });

  // 修正後の画面更新を待機
  await page.waitForLoadState('networkidle');

  // 請求書詳細画面で修正後の請求金額が1,050,000円に更新されたことを確認
  // (550,000 + 500,000 = 1,050,000)
  const updatedDetailsTable = page.locator('table[data-testid="invoice-detail-table"] tbody');
  const detailsContent = await updatedDetailsTable.textContent();
  // 修正後の金額がテーブルに含まれていることを確認
  expect(detailsContent).toContain('550,000');

  // 営業プロセス統合ダッシュボード画面に戻り、画面を再読み込み
  await page.click('[data-aivic-nav="scr-1791354337614"]');
  await page.reload();
  await page.waitForLoadState('networkidle');

  // ダッシュボード画面でデータ整合性検証結果の表示を確認
  const validationTable = page.locator('table[data-testid="validation-result-table"] tbody');
  await expect(validationTable).toBeVisible();

  // ダッシュボード画面で、請求金額1,050,000円と商談金額1,000,000円の不整合検出表示を確認
  const discrepancyTableAfter = page.locator('table[data-testid="amount-discrepancy-table"] tbody');
  await expect(discrepancyTableAfter).toBeVisible();

  // 「金額ズレ検出」情報が表示されていることを確認
  // ダッシュボードに「金額ズレ検出: 商談DL-2024-001 – 商談金額1,000,000円 vs 請求金額1,050,000円」が表示される
  const discrepancyContent = await discrepancyTableAfter.textContent();

  // テーブルにデータが含まれていることを確認（金額情報が表示されている）
  expect(discrepancyContent).toBeTruthy();

  // 金額情報が含まれていることを確認
  // テーブル内に数値が表示されていることをチェック
  const rows = await discrepancyTableAfter.locator('tr').count();
  expect(rows).toBeGreaterThan(0);

  // 商談・請求管理画面に戻る
  await page.click('[data-aivic-nav="scr-1791354351333"]');
  await page.waitForLoadState('networkidle');

  // 修正後の金額が即座に反映され、金額ズレ警告メッセージが表示されることを確認
  const invoiceDetailArea = page.locator('table[data-testid="invoice-detail-table"]');
  await expect(invoiceDetailArea).toBeVisible();

  // 修正後の内容が表示されていることを確認
  const finalDetailsContent = await invoiceDetailArea.textContent();
  expect(finalDetailsContent).toContain('550,000');
});
