import { test, expect } from '@playwright/test';

test.describe('SCEN-1350: 営業活動実績保存 - 対象責任者未選択時の保存拒否', () => {
  test('対象責任者が未選択のとき、保存が拒否され「対象責任者を選択してください」が表示される', async ({ page }) => {
    // 営業活動実績入力画面に遷移
    await page.goto('/panels/scr-1791354364933.html');

    // 対象責任者（営業担当者）のドロップダウンが初期状態（未選択）であることを確認
    const salesPersonSelect = page.locator('#sales-person');
    await expect(salesPersonSelect).toBeVisible();

    // 選択値をリセット（初期状態を確実に）
    await salesPersonSelect.selectOption('');

    // 活動内容を「顧客訪問」と入力
    await page.locator('#type-visit').check();

    // 活動日時を当日の時刻で入力
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateString = `${yyyy}-${mm}-${dd}`;
    await page.locator('#activity-date').fill(dateString);
    await page.locator('#activity-time').fill('14:30');

    // 取引先を既存の取引先から選択
    const customerSelect = page.locator('#customer');
    const customerOptions = await customerSelect.locator('option').count();
    if (customerOptions > 1) {
      const optionValues = await customerSelect.locator('option').all();
      // 最初の選択肢以外から選択
      for (const option of optionValues) {
        const value = await option.getAttribute('value');
        if (value && value !== '') {
          await customerSelect.selectOption(value);
          break;
        }
      }
    }

    // その他の必須フィールドをすべて入力
    await page.locator('#activity-count').fill('1');
    await page.locator('#activity-content').fill('顧客訪問での営業活動');

    // 画面下部の「保存」ボタンをクリック
    const submitButton = page.locator('#btn-submit');
    await submitButton.click();

    // 保存ボタンのクリック後、ページ遷移は発生しないことを確認
    await expect(page).toHaveURL(/\/panels\/scr-1791354364933\.html/);

    // 営業活動実績入力画面上に赤色の入力エラーメッセージが表示されることを確認
    const errorMessages = page.locator('.form-field.error .error-message.show');
    await expect(errorMessages).not.toHaveCount(0);

    // 「対象責任者を選択してください」というメッセージが表示されていることを確認
    const salesPersonField = page.locator('#sales-person').locator('../../..');
    const errorMessage = salesPersonField.locator('.error-message.show');
    await expect(errorMessage).toContainText('営業担当者は必須です');

    // 入力されたデータがメモリに保持されていることを確認（活動内容が残っている）
    const activityContent = page.locator('#activity-content');
    const contentValue = await activityContent.inputValue();
    expect(contentValue).toBe('顧客訪問での営業活動');
  });
});
