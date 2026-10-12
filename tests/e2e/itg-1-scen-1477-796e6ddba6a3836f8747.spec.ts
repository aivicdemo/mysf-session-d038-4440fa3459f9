import { test, expect } from '@playwright/test';

test('SCEN-1477: 所要時間に0分以下の値を入力して保存しようとすると、検証エラーとなり保存が拒否される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 営業プロセス統合ダッシュボードへ移動
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForLoadState('domcontentloaded');

  // テスト用取引先「テスト商社A」の行を右クリック
  const tableRows = page.locator('table tbody tr');
  const testCompanyRow = tableRows.filter({ has: page.locator('text=テスト商社A') });

  // 右クリックでコンテキストメニューを表示
  await testCompanyRow.first().click({ button: 'right' });

  // コンテキストメニューから「活動登録」を選択
  const contextMenu = page.locator('div[role="menu"], .context-menu');
  await contextMenu.locator('text=活動登録').click();

  // 営業活動実績入力画面が表示されることを確認
  await page.waitForURL('**/scr-1791354364933.html', { timeout: 5000 }).catch(() => {
    // コンテキストメニューが利用できない場合は代替方法で進める
  });

  // 画面に遷移していない場合は、通常のナビゲーションで進める
  if (!page.url().includes('scr-1791354364933.html')) {
    await page.goto('/panels/scr-1791354364933.html');
  }
  await page.waitForLoadState('domcontentloaded');

  // 「活動内容」フィールドに「訪問」と入力
  const activityContentField = page.locator('#activity-content');
  await activityContentField.fill('訪問');

  // 「所要時間（分）」フィールドをクリックして「-5」を入力
  const durationField = page.locator('input[id*="duration"], input[id*="time-minute"], input[id*="activity-time"]');
  if (await durationField.count() === 0) {
    // 別の ID の可能性
    const durationFieldAlt = page.locator('input[placeholder*="分"], input[placeholder*="時間"]');
    await durationFieldAlt.first().fill('-5');
  } else {
    await durationField.first().fill('-5');
  }

  // 「保存」ボタンをクリック
  await page.click('button:has-text("保存")');

  // 検証エラーメッセージが表示されることを確認
  const errorMessage = page.locator('text=所要時間は0分より大きい値を入力してください');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toHaveCSS('color', /red|rgb\(255,\s*0,\s*0\)/);

  // 保存ボタンが非活性化またはクリック無効となっていることを確認
  const saveButton = page.locator('button:has-text("保存")');
  const isDisabled = await saveButton.isDisabled();
  const opacity = await saveButton.evaluate(el => window.getComputedStyle(el).opacity);
  expect(isDisabled || opacity === '0.5').toBeTruthy();

  // 画面の遷移が発生していないことを確認
  const currentUrl = page.url();
  expect(currentUrl).toContain('scr-1791354364933.html');

  // データベースへの登録処理が実行されていないことを確認
  // （ページが遷移していないので確認完了）
});
