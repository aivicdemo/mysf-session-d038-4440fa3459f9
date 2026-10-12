import { test, expect } from '@playwright/test';

test('SCEN-1478: 所要時間に1分を入力して保存すると、検証に合格して登録される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 営業活動実績入力画面へ移動
  await page.goto('/panels/scr-1791354364933.html');
  await page.waitForLoadState('domcontentloaded');

  // 『所要時間』項目を特定
  const durationField = page.locator('input[id*="duration"], input[id*="time-minute"], input[id*="activity-time"]');
  const durationCount = await durationField.count();
  const durationInput = durationCount > 0 ? durationField.first() : page.locator('input[placeholder*="分"], input[placeholder*="時間"]').first();

  // 『所要時間』入力フィールドに『1』を入力
  await durationInput.fill('1');

  // 入力後、フィールドからフォーカスを外す（検証トリガー）
  await durationInput.blur();

  // 必須項目を入力（テストを完全にするため）
  const activityContentField = page.locator('#activity-content');
  await activityContentField.fill('訪問');

  const activityDateField = page.locator('#activity-date');
  await activityDateField.fill('2026-10-12');

  const activityTypeSelect = page.locator('select[name="activity-type"]');
  await activityTypeSelect.selectOption({ index: 1 });

  // 『保存』ボタンをクリック
  await page.click('button:has-text("保存")');

  // 画面のレスポンス完了を待つ
  await page.waitForLoadState('networkidle');

  // 検証に合格し、活動が正常に登録されて画面が閉じることを確認
  // または遷移先の画面を確認
  const currentUrl = page.url();
  const pageTitle = await page.title();

  // 営業活動実績入力画面が閉じ、別の画面に遷移したか確認
  // または、成功メッセージが表示されたことを確認
  if (currentUrl.includes('scr-1791354364933.html')) {
    // 同じ画面に留まっている場合は成功メッセージを確認
    const successMessage = page.locator('text=登録しました|成功|完了');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  } else {
    // 別の画面に遷移している場合（顧客・取引先管理画面またはダッシュボード画面）
    expect(
      currentUrl.includes('scr-1791354379354.html') ||
      currentUrl.includes('scr-1791354337614.html')
    ).toBeTruthy();
  }

  // 登録後、当該活動が営業プロセス統合ダッシュボード上に営業担当者の活動実績として表示される
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForLoadState('domcontentloaded');

  // ダッシュボード上で活動が確認できることを確認
  const activityTable = page.locator('table').filter({ has: page.locator('text=訪問') });
  const activityTableCount = await activityTable.count();
  const activityTextCount = await page.locator('text=訪問').count();
  const activityVisible = activityTableCount > 0 || activityTextCount > 0;
  expect(activityVisible).toBeTruthy();
});
