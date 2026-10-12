import { test, expect } from '@playwright/test';

test('SCEN-1475: 活動内容が空のまま保存しようとすると、検証エラーとなり保存が拒否される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 営業活動実績入力画面へ移動
  await page.goto('/panels/scr-1791354364933.html');
  await page.waitForLoadState('domcontentloaded');

  // 「活動内容」フィールドを空のまま放置する
  const activityContentField = page.locator('#activity-content');
  await activityContentField.clear();

  // その他の必須項目に有効な値を入力
  const activityDateField = page.locator('#activity-date');
  await activityDateField.fill('2026-10-12');

  const activityTypeSelect = page.locator('select[name="activity-type"]');
  await activityTypeSelect.selectOption({ index: 1 });

  // 画面下部の「保存」ボタンをクリック
  await page.click('button:has-text("保存")');

  // 検証エラーメッセージが「活動内容」フィールドの直下に表示されることを確認
  const errorMessage = page.locator('text=活動内容は必須項目です');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toHaveCSS('color', /red|rgb\(255,\s*0,\s*0\)/);

  // 「保存」ボタンが無効（グレーアウト）状態であることを確認
  const saveButton = page.locator('button:has-text("保存")');
  const isDisabled = await saveButton.isDisabled();
  if (!isDisabled) {
    // ボタンが無効でない場合、灰色状態を確認
    const opacity = await saveButton.evaluate(el => window.getComputedStyle(el).opacity);
    const color = await saveButton.evaluate(el => window.getComputedStyle(el).color);
    expect(opacity === '0.5' || color.includes('gray')).toBeTruthy();
  }

  // データベースへの登録が発生していないことを確認（ページが遷移していない）
  const currentUrl = page.url();
  expect(currentUrl).toContain('scr-1791354364933.html');

  // 画面が営業活動実績入力画面のままであることを確認
  const formTitle = page.locator('h1, [role="heading"]');
  const titleText = await formTitle.first().textContent();
  expect(titleText).toContain('営業活動実績');
});
