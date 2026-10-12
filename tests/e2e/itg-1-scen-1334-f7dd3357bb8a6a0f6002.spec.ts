import { test, expect } from '@playwright/test';

test('SCEN-1334: 対象責任者の所属確認 - 指定取引先に所属していない責任者が拒否される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  const loginButton = page.locator('button.login-button');
  await loginButton.click();

  // ダッシュボードから営業活動実績入力画面へ遷移
  await page.waitForURL('**/panels/scr-1791354337614.html');
  const activityInputNavLink = page.locator('a[href*="scr-1791354364933"]');
  await activityInputNavLink.click();
  await page.waitForURL('**/panels/scr-1791354364933.html');

  // 営業活動実績入力画面で「取引先」フィールドに「株式会社A（CUST-001）」が選択された状態を確認
  const customerSelect = page.locator('#customer');
  const companyAOption = customerSelect.locator('option').filter({ hasText: '株式会社A' });
  if (await companyAOption.count() > 0) {
    const companyAValue = await companyAOption.first().getAttribute('value');
    if (companyAValue) {
      await customerSelect.selectOption(companyAValue);
    }
  }

  // 「対象責任者」フィールドをクリックしてドロップダウンを開く
  const responsiblePersonField = page.locator('#responsible-person, [data-testid="responsible-person"]');
  await responsiblePersonField.click();

  // ドロップダウン内から「責任者C（EMP-003）」（株式会社Bの担当責任者）を選択
  // この責任者は CUST-001 に所属していない
  const respCOption = responsiblePersonField.locator('option').filter({ hasText: '責任者C' });
  if (await respCOption.count() > 0) {
    const respCValue = await respCOption.first().getAttribute('value');
    if (respCValue) {
      await responsiblePersonField.selectOption(respCValue);
    }
  }

  // 活動内容「訪問」を入力
  const activityContent = page.locator('#activity-content');
  await activityContent.fill('訪問');

  // 件数「1」を入力
  const activityCount = page.locator('#activity-count');
  await activityCount.fill('1');

  // 頻度「単発」を入力
  const activityFrequency = page.locator('input[name="activity-frequency"][value="single"], #freq-first');
  await activityFrequency.check();

  // 「保存」ボタンをクリック
  const submitButton = page.locator('#btn-submit');
  await submitButton.click();

  // 保存ボタンクリック後、営業活動実績入力画面が遷移せず、エラーメッセージが表示される
  expect(page.url()).toContain('scr-1791354364933');

  const errorContainer = page.locator('.error-container, .alert-error, [role="alert"]');
  await expect(errorContainer).toContainText('選択された責任者は指定取引先に所属していません。該当取引先の責任者を選択してください。');

  // 入力内容は保存されず、フォームの状態は変わらない
  const activityContentValue = await activityContent.inputValue();
  expect(activityContentValue).toBe('訪問');

  const activityCountValue = await activityCount.inputValue();
  expect(activityCountValue).toBe('1');
});
