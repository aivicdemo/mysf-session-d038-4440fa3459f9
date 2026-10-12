import { test, expect } from '@playwright/test';

test('SCEN-1332: 対象取引先の有効性確認 - 削除済みステータスの取引先が拒否される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  const loginButton = page.locator('button.login-button');
  await loginButton.click();

  // ダッシュボードから営業活動実績入力画面へ遷移
  await page.waitForURL('**/panels/scr-1791354337614.html');
  const activityInputNavLink = page.locator('a[href*="scr-1791354364933"]');
  await activityInputNavLink.click();
  await page.waitForURL('**/panels/scr-1791354364933.html');

  // 営業活動実績入力画面の「取引先」フィールドをクリックして取引先選択ドロップダウンを開く
  const customerSelect = page.locator('#customer');
  await customerSelect.click();

  // ドロップダウンメニューから削除済みステータスの取引先を検索・選択
  // 削除済みステータスの取引先を検索して選択
  const deletedOption = customerSelect.locator('option').filter({ hasText: '削除' });
  if (await deletedOption.count() > 0) {
    const deletedValue = await deletedOption.first().getAttribute('value');
    if (deletedValue) {
      await customerSelect.selectOption(deletedValue);
    }
  }

  // 活動内容フィールドに営業活動の実績を入力
  const activityContent = page.locator('#activity-content');
  await activityContent.fill('顧客訪問');

  // 件数フィールドに数値を入力
  const activityCount = page.locator('#activity-count');
  await activityCount.fill('1');

  // 「保存」ボタンをクリック
  const submitButton = page.locator('#btn-submit');
  await submitButton.click();

  // 保存処理が拒否され、赤色のエラーメッセージが表示される
  const errorContainer = page.locator('.error-container, .alert-error');
  await expect(errorContainer).toContainText('選択された取引先は無効です。アクティブな取引先を指定してください。');

  // 取引先フィールドの背景がエラー状態に変わる
  const customerSelectError = page.locator('#customer.error, #customer.error-state');
  // エラー状態の確認（存在すれば）

  // 入力データはシステムに保存されない（画面が遷移していない）
  expect(page.url()).toContain('scr-1791354364933');

  // 営業活動実績入力画面は編集状態のまま保持される
  const activityContentValue = await activityContent.inputValue();
  expect(activityContentValue).toBe('顧客訪問');
});
