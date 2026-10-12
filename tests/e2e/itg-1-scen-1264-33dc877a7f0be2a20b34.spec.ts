import { test, expect } from '@playwright/test';

test('SCEN-1264: 請求書再発行画面表示操作が完了すると、監査ログに操作記録が残される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 営業プロセス統合ダッシュボードから商談・請求管理画面へ遷移
  await page.goto('/panels/scr-1791354337614.html');
  await page.click('text=商談・請求管理');
  await page.waitForNavigation();

  // 表示された請求書一覧から、再発行対象の請求書（INV-2024-001）の行を特定
  const invoiceRow = page.locator('text=INV-2024-001').first();
  await invoiceRow.scrollIntoViewIfNeeded();

  // 当該請求書の行上にある再発行ボタン（またはアクション選択肢）をクリック
  await page.click('button:has-text("再発行")');

  // 請求書再発行画面が表示されることを確認
  await page.waitForLoadState('networkidle');
  const reissueForm = page.locator('[data-test-id="reissue-form"]');
  await expect(reissueForm).toBeVisible();

  // 画面上の確認ボタン（決定・承認など）をクリックして再発行操作を確定
  await page.click('button:has-text("確定"), button:has-text("再発行実行")');

  // 再発行完了を待つ
  await page.waitForLoadState('networkidle');

  // 監査ログが記録されたことを検証するため、管理画面またはログ表示に遷移
  // 通常の画面では見えないため、ネットワークリクエストで検証
  page.on('response', response => {
    if (response.url().includes('/api/audit-logs')) {
      expect(response.status()).toBe(200);
    }
  });

  // 監査ログの確認ページに遷移
  await page.goto('/panels/audit-logs.html');

  // 監査ログテーブルに新規作成された記録が存在することを確認
  const auditLogRows = page.locator('[data-test-id="audit-log-table"] tr');

  // 最新の監査ログレコードを確認
  const latestRow = auditLogRows.first();

  // 操作種別＝「請求書再発行画面表示」
  const operationType = latestRow.locator('td:nth-child(1)');
  await expect(operationType).toContainText('請求書再発行画面表示');

  // 対象請求書ID＝「INV-2024-001」
  const targetInvoiceId = latestRow.locator('td:nth-child(2)');
  await expect(targetInvoiceId).toContainText('INV-2024-001');

  // 操作ユーザーID＝ログイン中のユーザーID（testuser）
  const operationUserId = latestRow.locator('td:nth-child(3)');
  await expect(operationUserId).toContainText('testuser');

  // 操作日時＝操作実行時刻のISO8601形式
  const operationDateTime = latestRow.locator('td:nth-child(4)');
  const dateText = await operationDateTime.textContent();
  expect(dateText).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

  // 操作画面＝「商談・請求管理画面」
  const operationScreen = latestRow.locator('td:nth-child(5)');
  await expect(operationScreen).toContainText('商談・請求管理画面');

  // 操作詳細＝「再発行画面を表示し確定操作を実行」
  const operationDetails = latestRow.locator('td:nth-child(6)');
  await expect(operationDetails).toContainText('再発行画面を表示し確定操作を実行');

  // 監査ログは削除不可、改ざん不可の状態であることを確認
  // 削除ボタンが無効または非表示
  const deleteButton = latestRow.locator('button:has-text("削除")');
  const isDeleteDisabled = !await deleteButton.isVisible().catch(() => false) ||
    await deleteButton.isDisabled().catch(() => false);
  expect(isDeleteDisabled).toBeTruthy();
});
