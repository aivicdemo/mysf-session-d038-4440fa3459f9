import { test, expect } from '@playwright/test';

test('SCEN-1329: 活動種別の検証 - 許可されていない活動種別が拒否される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  const loginButton = page.locator('button.login-button');
  await loginButton.click();

  // ダッシュボードから営業活動実績入力画面へ遷移
  await page.waitForURL('**/panels/scr-1791354337614.html');
  const activityInputNavLink = page.locator('a[href*="scr-1791354364933"]');
  await activityInputNavLink.click();
  await page.waitForURL('**/panels/scr-1791354364933.html');

  // 活動種別フィールドに直接入力 - 許可されていない「セミナー参加」
  const activityTypeField = page.locator('#activity-type');
  await activityTypeField.fill('セミナー参加');

  // 取引先フィールドに有効な取引先を選択
  const customerSelect = page.locator('#customer');
  const firstOption = customerSelect.locator('option').nth(1); // 最初の有効な選択肢（デフォルト選択肢をスキップ）
  const optionValue = await firstOption.getAttribute('value');
  if (optionValue) {
    await customerSelect.selectOption(optionValue);
  }

  // 活動内容フィールドに「セミナーで商品説明を受けた」と入力
  const activityContent = page.locator('#activity-content');
  await activityContent.fill('セミナーで商品説明を受けた');

  // 件数フィールドに「1」と入力
  const activityCount = page.locator('#activity-count');
  await activityCount.fill('1');

  // 保存ボタンをクリック
  const submitButton = page.locator('#btn-submit');
  await submitButton.click();

  // 活動種別フィールドの下部に赤色でエラーメッセージが表示される
  const activityTypeError = page.locator('#activity-type + .error-message');
  await expect(activityTypeError).toContainText('許可されていない活動種別です。「訪問」「電話」「メール」「提案」のいずれかを選択してください。');

  // フォーム内容は保存されず、画面遷移が発生しない
  expect(page.url()).toContain('scr-1791354364933');

  // 活動種別フィールドには入力値のまま「セミナー参加」が残る
  const activityTypeValue = await activityTypeField.inputValue();
  expect(activityTypeValue).toBe('セミナー参加');

  // 他のフィールド（取引先・活動内容・件数）の入力値も維持されている
  const activityContentValue = await activityContent.inputValue();
  expect(activityContentValue).toBe('セミナーで商品説明を受けた');

  const activityCountValue = await activityCount.inputValue();
  expect(activityCountValue).toBe('1');
});
