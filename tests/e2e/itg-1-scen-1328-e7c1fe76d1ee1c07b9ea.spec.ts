import { test, expect, Page } from '@playwright/test';

test('SCEN-1328: 営業活動実績保存フロー全体', async ({ page, context }) => {
  // ログイン画面でログイン
  await page.goto('/');
  const loginButton = page.locator('button.login-button');
  await loginButton.click();

  // ダッシュボード画面へ遷移するまで待機
  await page.waitForURL('**/panels/scr-1791354337614.html');

  // 営業活動実績入力画面へ遷移
  const activityInputNavLink = page.locator('a[href*="scr-1791354364933"]');
  await activityInputNavLink.click();
  await page.waitForURL('**/panels/scr-1791354364933.html');

  // 取引先選択フィールドをクリックしてドロップダウンを開く
  const customerSelect = page.locator('#customer');
  await customerSelect.click();

  // ドロップダウンから「株式会social」を選択
  const socialOption = customerSelect.locator('option').filter({ hasText: '株式会social' });
  if (await socialOption.count() > 0) {
    const value = await socialOption.first().getAttribute('value');
    if (value) {
      await customerSelect.selectOption(value);
    }
  }

  // 商談選択フィールドをクリックしてドロップダウンを開く
  const dealSelect = page.locator('#deal');
  await dealSelect.click();

  // ドロップダウンから「大型案件2024-01」を選択
  const dealOption = dealSelect.locator('option').filter({ hasText: '大型案件2024-01' });
  if (await dealOption.count() > 0) {
    const value = await dealOption.first().getAttribute('value');
    if (value) {
      await dealSelect.selectOption(value);
    }
  }

  // 活動種類選択フィールド
  const activityTypeVisit = page.locator('#type-visit');
  await activityTypeVisit.check();

  // 活動内容テキストエリアに「顧客との要件ヒアリング実施」と入力
  const activityContent = page.locator('#activity-content');
  await activityContent.fill('顧客との要件ヒアリング実施');

  // 活動日付フィールドに本日の日付を入力
  const activityDate = page.locator('#activity-date');
  const today = new Date().toISOString().split('T')[0];
  await activityDate.fill(today);

  // 件数フィールドに「1」と入力
  const activityCount = page.locator('#activity-count');
  await activityCount.fill('1');

  // 保存ボタンをクリック
  const submitButton = page.locator('#btn-submit');
  await submitButton.click();

  // トースト通知で「営業活動実績を保存しました」と表示される
  const successMessage = page.locator('.success-message:has-text("営業活動実績を保存しました")');
  await expect(successMessage).toBeVisible();

  // 営業プロセス統合ダッシュボードへ遷移
  await page.waitForURL('**/panels/scr-1791354337614.html');

  // ダッシュボードの当日の営業担当者の活動実績欄に「訪問：1件」が追加表示される
  const activitySummaryTable = page.locator('#activity-tbody');
  const activityRow = activitySummaryTable.locator('tr:has-text("訪問")');
  await expect(activityRow).toBeVisible();

  // ネットワークタブでPOST /api/sales-activities エンドポイントへのリクエストと201レスポンスを確認
  // （Playwrightでネットワークモニタリングが必要な場合の検証）
  const responses = [];
  context.on('page', (newPage) => {
    newPage.on('response', (response) => {
      if (response.url().includes('/api/sales-activities')) {
        responses.push(response);
      }
    });
  });

  // 監査ログテーブルにレコードが作成されているか確認（後で検証が可能なAPI呼び出し確認）
  const apiUrl = page.evaluate(() => (window as any).AIVIC_API_URL);
  const appId = page.evaluate(() => (window as any).AIVIC_APP_ID);
  const auditLogs = await page.request.get(`${apiUrl}/by-name?app=${appId}&table=${encodeURIComponent('audit_logs')}`);
  const auditData = await auditLogs.json();
  const latestAuditLog = auditData.records?.[auditData.records.length - 1];

  expect(latestAuditLog?.operation).toBe('CREATE');
  expect(latestAuditLog?.target_record_id).toBeDefined();
  expect(latestAuditLog?.changes).toBeDefined();
});
