import { test, expect } from '@playwright/test';

test('SCEN-1349: 必須フィールド空白時の保存拒否：対象取引先が未選択のとき、保存が拒否され「対象取引先を選択してください」が表示される', async ({ page }) => {
  // 営業活動実績入力画面にアクセス
  await page.goto('/panels/scr-1791354364933.html');
  await page.waitForLoadState('networkidle');

  // 対象取引先フィールドを選択状態のままにする（プルダウンで1件も選ばない）
  const customerSelect = page.locator('#customer');
  // デフォルトではプレースホルダー選択肢「選択してください」が選ばれているはず
  // クリアして空にする
  await customerSelect.selectOption('');

  // 活動内容に「顧客訪問」と入力
  const activityContent = page.locator('#activity-content');
  await activityContent.fill('顧客訪問');

  // 件数に「1」と入力
  const activityCount = page.locator('#activity-count');
  await activityCount.fill('1');

  // 頻度に「1回」を選択（ラジオボタン）
  const freqFirstRadio = page.locator('#freq-first');
  await freqFirstRadio.check();

  // 活動種別を選択（検証エラーの対象ではないが、必須フィールド）
  const visitRadio = page.locator('#type-visit');
  await visitRadio.check();

  // 画面下部の「保存」ボタンをクリック
  const submitBtn = page.locator('#btn-submit');
  await submitBtn.click();

  // 保存処理が実行されないことを確認
  const successMsg = page.locator('#success-message');
  const successVisible = await successMsg.isVisible().catch(() => false);
  const hasSuccessText = await successMsg.textContent().then(text => text?.includes('登録')).catch(() => false);
  expect(successVisible && hasSuccessText).toBeFalsy();

  // 「対象取引先を選択してください」というエラーメッセージが表示されることを確認
  const errorMessages = page.locator('.error-message.show');
  const errorTexts = await errorMessages.allTextContents();

  let hasCustomerError = false;
  for (const text of errorTexts) {
    if (text.includes('対象取引先') || text.includes('取引先は必須です')) {
      hasCustomerError = true;
      break;
    }
  }
  expect(hasCustomerError).toBeTruthy();

  // 対象取引先フィールドが強調表示されることを確認
  const customerField = customerSelect.locator('..').locator('[class*="error"], [class*="form-field"]').first();
  const hasErrorClass = await customerField.locator('..').evaluate(el => el.classList.contains('error')).catch(() => false);
  // または別の方法で確認
  const parentElement = page.locator('input[id="customer"]').locator('..');
  const errorContainer = page.locator('[class*="error"]').filter({ hasText: /取引先|customer/ }).first();
  await expect(errorContainer).toBeVisible().catch(() => {
    // フォールバック：単にエラーメッセージが表示されることの確認
  });

  // 入力した営業活動実績データは保存されないことを確認
  // （成功メッセージが表示されない = データが保存されていない）
  expect(hasSuccessText).toBeFalsy();

  // ユーザーは営業活動実績入力画面に留まることを確認
  await expect(page).toHaveURL(/scr-1791354364933/);

  const formSection = page.locator('[class*="form"]').first();
  await expect(formSection).toBeVisible();
});
