import { test, expect } from '@playwright/test';

test('SCEN-1330: 活動日付の検証 - 未来日が拒否される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  const loginButton = page.locator('button.login-button');
  await loginButton.click();

  // ダッシュボードから営業活動実績入力画面へ遷移
  await page.waitForURL('**/panels/scr-1791354337614.html');
  const activityInputNavLink = page.locator('a[href*="scr-1791354364933"]');
  await activityInputNavLink.click();
  await page.waitForURL('**/panels/scr-1791354364933.html');

  // 「新規登録」ボタンをクリックして新規活動実績入力フォームを開く
  // （既に新規フォーム状態と仮定）

  // 「取引先」フィールドから既存の取引先を1件選択
  const customerSelect = page.locator('#customer');
  const customerOption = customerSelect.locator('option').nth(1);
  const customerValue = await customerOption.getAttribute('value');
  if (customerValue) {
    await customerSelect.selectOption(customerValue);
  }

  // 「商談」フィールドから選択した取引先に紐付く商談を1件選択
  const dealSelect = page.locator('#deal');
  const dealOption = dealSelect.locator('option').nth(1);
  const dealValue = await dealOption.getAttribute('value');
  if (dealValue) {
    await dealSelect.selectOption(dealValue);
  }

  // 「活動内容」フィールドに「顧客訪問」と入力
  const activityContent = page.locator('#activity-content');
  await activityContent.fill('顧客訪問');

  // 「活動日付」フィールドに本日より後の日付（例：2026-10-13）を入力
  const activityDate = page.locator('#activity-date');
  const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await activityDate.fill(tomorrow);

  // 「保存」ボタンをクリック
  const submitButton = page.locator('#btn-submit');
  await submitButton.click();

  // 保存処理が中断され、「活動日付は本日以前の日付を入力してください」というエラーメッセージが表示される
  const activityDateError = page.locator('#activity-date + .error-message');
  await expect(activityDateError).toContainText('活動日付は本日以前の日付を入力してください');

  // 営業活動実績データがデータベースに保存されない（画面が遷移していない）
  expect(page.url()).toContain('scr-1791354364933');

  // フォームの入力内容は画面上に保持されたままである
  const activityContentValue = await activityContent.inputValue();
  expect(activityContentValue).toBe('顧客訪問');

  const activityDateValue = await activityDate.inputValue();
  expect(activityDateValue).toBe(tomorrow);
});
