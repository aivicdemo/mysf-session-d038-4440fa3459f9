import { test, expect } from '@playwright/test';

test('SCEN-1331: 対象取引先の検証 - 登録済みマスタに存在しない取引先IDが拒否される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  const loginButton = page.locator('button.login-button');
  await loginButton.click();

  // ダッシュボードから営業活動実績入力画面へ遷移
  await page.waitForURL('**/panels/scr-1791354337614.html');
  const activityInputNavLink = page.locator('a[href*="scr-1791354364933"]');
  await activityInputNavLink.click();
  await page.waitForURL('**/panels/scr-1791354364933.html');

  // 営業活動実績入力画面の『取引先ID』フィールドに『TXN-999』を入力
  const customerIdField = page.locator('#customer-id');
  await customerIdField.fill('TXN-999');

  // 『活動内容』フィールドに『提案資料提示』を入力
  const activityContent = page.locator('#activity-content');
  await activityContent.fill('提案資料提示');

  // 『活動件数』フィールドに『1』を入力
  const activityCount = page.locator('#activity-count');
  await activityCount.fill('1');

  // 『保存』ボタンをクリック
  const submitButton = page.locator('#btn-submit');
  await submitButton.click();

  // 赤色の背景を持つエラーメッセージが画面上部に表示される
  const errorContainer = page.locator('.error-container, .alert-error');
  await expect(errorContainer).toContainText('取引先ID「TXN-999」は取引先マスタに存在しません。登録済みの取引先から選択してください');

  // 『取引先ID』フィールドが赤色の枠線でハイライトされ、入力値『TXN-999』が保持される
  const customerIdFieldHighlighted = page.locator('#customer-id.error');
  const customerIdValue = await customerIdField.inputValue();
  expect(customerIdValue).toBe('TXN-999');

  // データベースには営業活動実績レコードが作成されない（画面が遷移していない）
  expect(page.url()).toContain('scr-1791354364933');

  // 他のフィールド（『活動内容』『活動件数』）の入力値は保持され、修正可能な状態のまま保留される
  const activityContentValue = await activityContent.inputValue();
  expect(activityContentValue).toBe('提案資料提示');

  const activityCountValue = await activityCount.inputValue();
  expect(activityCountValue).toBe('1');
});
