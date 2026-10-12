import { test, expect } from '@playwright/test';

test('SCEN-1348: 必須フィールド空白時の保存拒否：活動日付が空のとき、保存が拒否され「活動日付を入力してください」が表示される', async ({ page }) => {
  // 営業プロセス統合ダッシュボードから営業活動実績入力画面へ遷移
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForLoadState('networkidle');

  // 営業活動実績入力画面へ遷移
  const activityInputLink = page.locator('a').filter({ hasText: /営業活動実績入力/ }).first();
  await activityInputLink.click();
  await page.waitForLoadState('networkidle');

  // 営業活動実績入力画面で「新規登録」ボタンをクリック（フォームは既に表示）

  // 取引先を選択
  const customerSelect = page.locator('#customer');
  const customerOptions = await customerSelect.locator('option').count();
  if (customerOptions > 1) {
    await customerSelect.selectOption({ index: 1 });
  }

  // 商談を選択
  const dealSelect = page.locator('#deal');
  await page.waitForTimeout(500); // 取引先選択後の更新を待つ
  const dealOptions = await dealSelect.locator('option').count();
  if (dealOptions > 1) {
    await dealSelect.selectOption({ index: 1 });
  }

  // 活動内容に「営業訪問」と入力
  const activityContent = page.locator('#activity-content');
  await activityContent.fill('営業訪問');

  // 活動日付フィールドをクリアして空白にする
  const activityDate = page.locator('#activity-date');
  await activityDate.clear();

  // 活動種別を選択（フォーム検証エラー：活動日付ではなく活動種別で引っかかる可能性を回避）
  const visitRadio = page.locator('#type-visit');
  await visitRadio.check();

  // 活動件数を入力
  const activityCount = page.locator('#activity-count');
  await activityCount.fill('1');

  // 「保存」ボタンをクリック
  const submitBtn = page.locator('#btn-submit');
  await submitBtn.click();

  // 保存処理が実行されないことを確認
  const successMsg = page.locator('#success-message');
  const successVisible = await successMsg.isVisible().catch(() => false);
  const hasSuccessText = await successMsg.textContent().then(text => text?.includes('登録')).catch(() => false);
  expect(successVisible && hasSuccessText).toBeFalsy();

  // 活動日付フィールドの直下に赤色のエラーメッセージが表示されることを確認
  const errorMessages = page.locator('.error-message.show');
  const errorTexts = await errorMessages.allTextContents();

  let hasDateError = false;
  for (const text of errorTexts) {
    if (text.includes('活動日付') || text.includes('活動日付を入力してください')) {
      hasDateError = true;
      break;
    }
  }
  expect(hasDateError).toBeTruthy();

  // フォーム送信は完了していないことを確認（ページが遷移していない）
  await expect(page).toHaveURL(/scr-1791354364933/);

  // 営業活動実績入力画面に留まっていることを確認
  const formSection = page.locator('[class*="form"]').first();
  await expect(formSection).toBeVisible();
});
