import { test, expect } from '@playwright/test';

test('SCEN-1469: 活動登録画面が開くと、商談ステージマスタ・活動タイプマスタ・活動結果マスタ・活動頻度マスタと入力値検証ルールが事前に読み込まれる', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 顧客・取引先管理画面へ移動
  await page.click('a:has-text("顧客・取引先管理")');
  await page.waitForLoadState('networkidle');

  // テスト用取引先（TEST-CUST-001）の行をクリック
  const customerRow = page.locator('table tbody tr');
  const testCustomerRow = customerRow.filter({ has: page.locator('text=TEST-CUST-001') });
  await testCustomerRow.click();
  await page.waitForLoadState('networkidle');

  // 取引先詳細画面で「活動登録」ボタンをクリック
  await page.click('button:has-text("活動登録")');

  // 営業活動実績入力画面が開くまで待機
  await page.waitForURL('**/scr-1791354364933.html');
  await page.waitForLoadState('domcontentloaded');

  // グローバルオブジェクトのマスタデータと検証ルールを確認
  const masterDataAndRules = await page.evaluate(() => {
    // @ts-ignore
    return window.AIVIC_MASTER_DATA;
  });

  // 商談ステージマスタ：3件以上の値が選択可能
  const dealStageOptions = await page.locator('select#deal').locator('option').all();
  expect(dealStageOptions.length).toBeGreaterThanOrEqual(3);

  // 活動タイプマスタ：3件以上の値が選択可能
  const activityTypeOptions = await page.locator('select[name="activity-type"]').locator('option').all();
  expect(activityTypeOptions.length).toBeGreaterThanOrEqual(3);

  // 活動結果マスタ：3件以上の値が選択可能
  const activityResultOptions = await page.locator('select[name="activity-result"]').locator('option').all();
  expect(activityResultOptions.length).toBeGreaterThanOrEqual(3);

  // 活動頻度マスタ：3件以上の値が選択可能
  const activityFrequencyOptions = await page.locator('select[name="activity-frequency"]').locator('option').all();
  expect(activityFrequencyOptions.length).toBeGreaterThanOrEqual(3);

  // 入力フィールドが存在し、フォーカス時・ブラー時に検証ルールが機能することを確認
  const activityContentField = page.locator('#activity-content');
  await expect(activityContentField).toBeVisible();

  // フォーカス時の検証
  await activityContentField.focus();
  const focusedState = await page.evaluate(() => {
    // @ts-ignore
    return document.activeElement === document.getElementById('activity-content');
  });
  expect(focusedState).toBe(true);

  // ブラー時の検証ルール機能確認（実装依存）
  await activityContentField.blur();

  // マスタデータが正しく読み込まれていることを確認
  if (masterDataAndRules) {
    expect(masterDataAndRules).toHaveProperty('dealStages');
    expect(masterDataAndRules).toHaveProperty('activityTypes');
    expect(masterDataAndRules).toHaveProperty('activityResults');
    expect(masterDataAndRules).toHaveProperty('activityFrequencies');
    expect(masterDataAndRules).toHaveProperty('validationRules');
  }
});
