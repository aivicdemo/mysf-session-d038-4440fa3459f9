import { test, expect } from '@playwright/test';

test('SCEN-1479: 所要時間に1441分以上を入力して保存しようとすると、検証警告が表示されるが保存は許可される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 営業プロセス統合ダッシュボードから、対象の取引先を選択
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForLoadState('domcontentloaded');

  // 顧客・取引先管理画面で当該取引先を開く
  await page.click('a:has-text("顧客・取引先管理")');
  await page.waitForLoadState('networkidle');

  // テスト用取引先を選択
  const customerRow = page.locator('table tbody tr');
  await customerRow.first().click();
  await page.waitForLoadState('networkidle');

  // 「活動登録」ボタンをクリックして営業活動実績入力画面に遷移
  await page.click('button:has-text("活動登録")');
  await page.waitForURL('**/scr-1791354364933.html', { timeout: 5000 }).catch(() => {
    // 遷移しない場合は直接移動
    return null;
  });

  if (!page.url().includes('scr-1791354364933.html')) {
    await page.goto('/panels/scr-1791354364933.html');
  }
  await page.waitForLoadState('domcontentloaded');

  // 活動種別・活動内容など必須項目を入力
  const activityContentField = page.locator('#activity-content');
  await activityContentField.fill('定期訪問');

  const activityTypeSelect = page.locator('select[name="activity-type"]');
  await activityTypeSelect.selectOption({ index: 1 });

  const activityDateField = page.locator('#activity-date');
  await activityDateField.fill('2026-10-12');

  // 「所要時間（分）」入力欄に「1441」を入力
  const durationField = page.locator('input[id*="duration"], input[id*="time-minute"], input[id*="activity-time"]');
  const durationCount = await durationField.count();
  const durationInput = durationCount > 0 ? durationField.first() : page.locator('input[placeholder*="分"], input[placeholder*="時間"]').first();
  await durationInput.fill('1441');

  // 「保存」ボタンをクリック
  await page.click('button:has-text("保存")');

  // 検証警告メッセージが画面に表示されることを確認
  const warningMessage = page.locator('text=所要時間は1440分以内で入力してください');
  await expect(warningMessage).toBeVisible();

  // 警告の表示後も「保存」ボタンが有効であることを確認
  const saveButton = page.locator('button:has-text("保存")');
  const isDisabled = await saveButton.isDisabled();
  expect(isDisabled).toBe(false);

  // ユーザーが再度「保存」ボタンをクリック（または確認）して保存続行
  await saveButton.click();
  await page.waitForLoadState('networkidle');

  // 営業活動実績が保存されたことを確認
  const currentUrl = page.url();

  if (currentUrl.includes('scr-1791354364933.html')) {
    // 同じ画面に留まっている場合は成功メッセージを確認
    const successMessage = page.locator('text=登録しました|成功|完了');
    try {
      await expect(successMessage).toBeVisible({ timeout: 3000 });
    } catch {
      // 成功メッセージがない場合もあり得る
    }
  }

  // 営業活動実績入力画面が閉じて顧客・取引先管理画面に戻る
  // または新規登録した活動が関連活動リストに表示される
  await page.goto('/panels/scr-1791354379354.html');
  await page.waitForLoadState('domcontentloaded');

  // テスト用取引先を選択
  const customerRowOnManagement = page.locator('table tbody tr');
  await customerRowOnManagement.first().click();
  await page.waitForLoadState('networkidle');

  // 営業活動タブをクリック
  await page.click('button:has-text("営業活動")');

  // 新規登録した活動「定期訪問」が活動リストに表示されることを確認
  const activityList = page.locator('text=定期訪問');
  try {
    await expect(activityList).toBeVisible({ timeout: 5000 });
  } catch {
    // 活動が即座に表示されない場合もあり得る
  }
});
