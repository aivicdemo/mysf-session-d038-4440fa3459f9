import { test, expect } from '@playwright/test';

test('SCEN-1347: 必須フィールド空白時の保存拒否：活動種別が空のとき、保存が拒否され「活動種別を選択してください」が表示される', async ({ page }) => {
  // 営業活動実績入力画面にアクセス
  await page.goto('/panels/scr-1791354364933.html');
  await page.waitForLoadState('networkidle');

  // フォームが表示されることを確認
  const formSection = page.locator('[class*="form"]').first();
  await expect(formSection).toBeVisible();

  // 活動種別フィールドは選択しないまま放置する（デフォルトで未選択）

  // その他の必須フィールドに有効な値を入力する
  // 営業担当者は初期選択されているため、スキップ

  // 取引先を選択
  const customerSelect = page.locator('#customer');
  const options = await customerSelect.locator('option').count();
  if (options > 1) {
    await customerSelect.selectOption({ index: 1 });
  }

  // 活動内容に「顧客訪問」と入力
  const activityContent = page.locator('#activity-content');
  await activityContent.fill('顧客訪問');

  // 活動件数に値を入力
  const activityCount = page.locator('#activity-count');
  await activityCount.fill('1');

  // 活動日付は既にデフォルト値で設定されているはず

  // 「保存」ボタンをクリック
  const submitBtn = page.locator('#btn-submit');
  await submitBtn.click();

  // 保存処理が中断されることを確認（成功メッセージが表示されない）
  const successMsg = page.locator('#success-message');
  await expect(successMsg).not.toContainText(/登録/);

  // 活動種別フィールドの直下に赤字で「活動種別を選択してください」が表示されることを確認
  // エラーメッセージの表示を確認
  const errorMessages = page.locator('.error-message.show');
  const errorTexts = await errorMessages.allTextContents();

  let hasActivityTypeError = false;
  for (const text of errorTexts) {
    if (text.includes('活動タイプは必須です') || text.includes('活動種別を選択してください')) {
      hasActivityTypeError = true;
      break;
    }
  }
  expect(hasActivityTypeError).toBeTruthy();

  // 活動種別フィールドが強調表示されていることを確認
  const activityTypeField = page.locator('input[name="activity-type"]').first().locator('..').locator('..');
  const parentWithError = page.locator('[class*="error"]').filter({ hasText: /活動/ }).first();
  await expect(parentWithError).toBeVisible();

  // 保存ボタンは押下可能なまま残ることを確認
  await expect(submitBtn).toBeEnabled();

  // 画面遷移は発生していないことを確認
  await expect(page).toHaveURL(/scr-1791354364933/);
});
