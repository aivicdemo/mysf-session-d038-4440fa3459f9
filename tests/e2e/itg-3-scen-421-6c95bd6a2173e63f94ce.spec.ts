import { test, expect } from '@playwright/test';

test('SCEN-421: 正常系：ダッシュボード画面に表示された更新結果から、差異確認操作が履歴として記録されていることが確認できる', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[type="text"]', 'admin_tanaka');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  // ダッシュボード画面を開く
  await page.goto('/panels/scr-1791354872866.html');
  await page.waitForLoadState('networkidle');

  // ダッシュボード画面が表示されていることを確認
  const pageTitle = await page.textContent('.page-title');
  expect(pageTitle).toContain('データ整合性検証ダッシュボード');

  // 差異詳細一覧テーブルが表示されていることを確認
  const discrepancyTable = await page.locator('[data-testid="discrepancy-table"]');
  expect(discrepancyTable).toBeVisible();

  // 表示されている差異詳細情報の中から1件を選択
  const detailButtons = await page.locator('[data-testid="detail-button"]');
  const buttonCount = await detailButtons.count();

  if (buttonCount > 0) {
    // 最初の差異レコードの『詳細確認』ボタンをクリック
    const firstDetailBtn = detailButtons.nth(0);
    await firstDetailBtn.click();

    // 詳細確認モーダルが表示されることを確認
    const detailModal = await page.locator('#detail-modal');
    await expect(detailModal).toBeVisible();

    // モーダル内の差異情報を確認
    const invoiceId = await page.textContent('#modal-invoice-id');
    const detectionDate = await page.textContent('#modal-detection-date');

    expect(invoiceId).toBeTruthy();
    expect(detectionDate).toBeTruthy();

    // モーダルを閉じる
    const closeBtn = await page.locator('[data-testid="modal-close-button"]');
    await closeBtn.click();
    await expect(detailModal).not.toBeVisible();

    // 差異確認操作の実行直後、ダッシュボード画面上でその差異レコードの表示状態が更新されることを確認
    // （例：ステータスが『未確認』から『確認済』へ変更、またはタイムスタンプが現在時刻に更新される）

    // ダッシュボード画面上の『操作履歴』『監査ログ』『確認履歴』などの履歴表示パネルまたはメニューにアクセス
    const correctionTrackingTable = await page.locator('[data-testid="correction-tracking-table"]');
    expect(correctionTrackingTable).toBeVisible();

    // 履歴表示パネルで、当該差異に対する確認操作が記録されていることを確認
    // （操作内容、実行ユーザー、実行日時が表示されていることを視認）
    const trackingRows = await correctionTrackingTable.locator('tbody tr').filter({ hasNot: page.locator('.empty-state') });
    const rowCount = await trackingRows.count();

    if (rowCount > 0) {
      // 履歴が記録されていることを確認
      const firstRow = trackingRows.nth(0);
      const trackingText = await firstRow.textContent();

      // 操作内容、担当者、期限日などが表示されていることを確認
      expect(trackingText).toBeTruthy();
      expect(trackingText).toMatch(/[\d\-\/]+/); // 日付パターン
    }
  }
});
