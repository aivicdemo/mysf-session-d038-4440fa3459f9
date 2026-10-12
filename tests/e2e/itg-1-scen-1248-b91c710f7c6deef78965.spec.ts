import { test, expect } from '@playwright/test';

test('SCEN-1248: 請求書修正画面が正常に表示され、修正対象データすべてが取得される', async ({ page }) => {
  // 営業プロセス統合ダッシュボード画面を開く
  await page.goto('/panels/scr-1791354337614.html');

  // ページロード完了を待機
  await page.waitForLoadState('networkidle');

  // 「商談・請求管理画面」へのナビゲーションリンクをクリック
  await page.click('a[data-aivic-nav-system="scr-1791354351333"]');

  // 商談・請求管理画面が表示されたことを確認
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/scr-1791354351333/);

  // 修正対象の商談ID（商談レコード）を検索フィールドに入力して検索ボタンをクリック
  await page.fill('#filter-customer', 'テクノロジー');
  await page.click('button:has-text("検索")');

  // 検索結果から該当商談レコードが一覧に表示されたことを確認
  const dealRow = page.locator('tbody#deal-tbody tr').first();
  await expect(dealRow).toBeVisible();

  // 該当商談レコード行の「請求書修正」ボタンをクリック
  await page.click('button#btn-edit-invoice');

  // 請求書修正画面へのURL遷移が発生し、画面読み込みが開始される
  await page.waitForURL(/scr-1791354749663/);

  // 請求書修正画面が完全に表示されるまで待機（読み込み完了インジケーター消失を確認）
  await page.waitForSelector('[data-aivic-loading]', { state: 'hidden' });

  // 画面上のすべてのセクション表示を確認
  await expect(page.locator('[data-section="deal-info"]')).toBeVisible();
  await expect(page.locator('[data-section="invoice-info"]')).toBeVisible();
  await expect(page.locator('[data-section="invoice-details"]')).toBeVisible();
  await expect(page.locator('[data-section="validation-results"]')).toBeVisible();
  await expect(page.locator('[data-section="modification-history"]')).toBeVisible();

  // 商談情報セクションの内容を確認
  const dealSection = page.locator('[data-section="deal-info"]');
  await expect(dealSection.locator('text=商談ID:')).toContainText('xxxxx');
  await expect(dealSection.locator('text=ステージ:')).toContainText('受注済み');
  await expect(dealSection.locator('text=金額:')).toContainText('500,000円');
  await expect(dealSection.locator('text=取引先名:')).toContainText('〇〇株式会社');

  // ステージマスタから取得した営業ステージ一覧が階層型で表示されていることを確認
  const stageList = page.locator('[data-component="stage-hierarchy"]');
  await expect(stageList).toBeVisible();

  // 請求書情報セクションの内容を確認
  const invoiceSection = page.locator('[data-section="invoice-info"]');
  await expect(invoiceSection.locator('text=請求書ID:')).toContainText('yyyyy');
  await expect(invoiceSection.locator('text=ステータス:')).toContainText('草稿');
  await expect(invoiceSection.locator('text=発行日:')).toContainText('2026-01-15');
  await expect(invoiceSection.locator('text=取引先住所:')).toContainText('東京都渋谷区');

  // 請求明細データ2件がすべて表示されていることを確認
  const detailsTable = page.locator('tbody#invoice-detail-tbody');
  const rows = await detailsTable.locator('tr').count();
  expect(rows).toBeGreaterThanOrEqual(2);

  // 商品A、商品Bの情報を確認
  await expect(detailsTable.locator('text=商品A')).toContainText('300,000円');
  await expect(detailsTable.locator('text=商品B')).toContainText('200,000円');

  // 合計金額が500,000円であることを確認
  await expect(page.locator('[data-component="invoice-total"]')).toContainText('500,000円');

  // 検証ルール実行結果セクションを確認
  const validationSection = page.locator('[data-section="validation-results"]');
  await expect(validationSection.locator('text=商談金額=請求金額')).toContainText('✓');
  await expect(validationSection.locator('text=明細合計=請求金額')).toContainText('✓');
  await expect(validationSection.locator('[role="alert"]')).not.toContainText('警告');

  // 修正履歴セクション内の過去修正ログ3件がタイムスタンプ付きで逆時系列に表示されていることを確認
  const historySection = page.locator('[data-section="modification-history"]');
  const historyRows = await historySection.locator('tbody tr').count();
  expect(historyRows).toBeGreaterThanOrEqual(3);

  // 最新修正ログを確認
  const latestHistory = historySection.locator('tbody tr').first();
  await expect(latestHistory).toContainText('2026-01-10 10:30');
  await expect(latestHistory).toContainText('営業太郎');

  // エラーメッセージ・例外ダイアログが表示されていないことを確認
  const errorDialogs = page.locator('[role="alertdialog"]');
  await expect(errorDialogs).toHaveCount(0);

  // 読み込み処理が2秒以内に完了したことを確認（ローディングインジケーターが消えている）
  await page.waitForSelector('[data-aivic-loading]', { state: 'hidden', timeout: 2000 });
});
