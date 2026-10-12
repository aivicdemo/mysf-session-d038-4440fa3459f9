import { test, expect } from '@playwright/test';

test.describe('SCEN-1351: 営業活動実績保存 - 活動内容空白時の保存拒否', () => {
  test('活動内容が空のとき、保存が拒否され「活動内容を入力してください」が表示される', async ({ page }) => {
    // 営業活動実績入力画面に遷移
    await page.goto('/panels/scr-1791354364933.html');

    // 営業担当者を選択
    const salesPersonSelect = page.locator('#sales-person');
    const salesPersonOptions = await salesPersonSelect.locator('option').count();
    if (salesPersonOptions > 1) {
      const optionValues = await salesPersonSelect.locator('option').all();
      for (const option of optionValues) {
        const value = await option.getAttribute('value');
        if (value && value !== '') {
          await salesPersonSelect.selectOption(value);
          break;
        }
      }
    }

    // 取引先を選択
    const customerSelect = page.locator('#customer');
    const customerOptions = await customerSelect.locator('option').count();
    if (customerOptions > 1) {
      const optionValues = await customerSelect.locator('option').all();
      for (const option of optionValues) {
        const value = await option.getAttribute('value');
        if (value && value !== '') {
          await customerSelect.selectOption(value);
          break;
        }
      }
    }

    // 活動タイプを選択
    await page.locator('#type-visit').check();

    // 活動日付を入力
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateString = `${yyyy}-${mm}-${dd}`;
    await page.locator('#activity-date').fill(dateString);

    // 活動件数を入力
    await page.locator('#activity-count').fill('1');

    // 「活動内容」テキストエリアが空白のままであることを確認
    const activityContentField = page.locator('#activity-content');
    const contentValue = await activityContentField.inputValue();
    expect(contentValue).toBe('');

    // 画面下部の「保存」ボタンをクリック
    const submitButton = page.locator('#btn-submit');
    await submitButton.click();

    // 画面は「保存」状態から遷移せず、営業活動実績入力画面に留まることを確認
    await expect(page).toHaveURL(/\/panels\/scr-1791354364933\.html/);

    // 赤色の警告メッセージが表示されることを確認
    const errorMessages = page.locator('.form-field.error .error-message.show');
    await expect(errorMessages).not.toHaveCount(0);

    // 「活動内容を入力してください」というメッセージが表示されることを確認
    // または類似のメッセージを確認（実装に応じて "活動内容は必須です" など）
    const allErrorMessages = page.locator('.error-message.show');
    let foundMessage = false;
    const errorCount = await allErrorMessages.count();
    for (let i = 0; i < errorCount; i++) {
      const text = await allErrorMessages.nth(i).textContent();
      if (text && (text.includes('活動内容') || text.includes('必須'))) {
        foundMessage = true;
        break;
      }
    }
    expect(foundMessage).toBeTruthy();
  });
});
