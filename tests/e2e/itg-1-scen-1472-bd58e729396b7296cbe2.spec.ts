import { test, expect } from '@playwright/test';

test.describe('SCEN-1472: 活動日付に未来日を入力して保存しようとすると、検証エラーとなり保存が拒否される', () => {
  test('活動日付に未来日を入力して保存すると、バリデーションエラーが表示される', async ({ page }) => {
    // ダッシュボードを開く
    await page.goto('/panels/scr-1791354337614.html');

    // 顧客・取引先管理画面への遷移（テスト太郎商社を探す）
    const customerManagementLink = page.locator('a[data-aivic-nav="scr-1791354379354"]');
    await customerManagementLink.click();
    await page.waitForURL('**/scr-1791354379354.html');

    // ナビゲーションから営業活動実績入力へ遷移
    const activityInputLink = page.locator('a[data-aivic-nav="scr-1791354364933"]');
    await activityInputLink.click();
    await page.waitForURL('**/scr-1791354364933.html');

    // フォームが表示されるまで待機
    await page.waitForSelector('select#customer', { state: 'visible' });

    // 活動内容入力欄に「訪問」と入力
    const activityContentArea = page.locator('textarea#activity-content');
    await activityContentArea.fill('訪問');

    // 活動日付入力欄に、本日より30日後の日付を入力
    const activityDateInput = page.locator('input#activity-date');
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 30);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    await activityDateInput.fill(futureDateStr);

    // 取引先を選択
    const customerSelect = page.locator('select#customer');
    const options = await customerSelect.locator('option').all();

    for (const opt of options) {
      const text = await opt.textContent();
      if (text && text !== '選択してください') {
        const value = await opt.getAttribute('value');
        await customerSelect.selectOption(value!);
        break;
      }
    }

    // 活動種別を選択
    const visitRadio = page.locator('input#type-visit');
    await visitRadio.check();

    // 保存ボタンをクリック
    const submitButton = page.locator('button#btn-submit');
    await submitButton.click();

    // バリデーションエラーメッセージが表示されることを確認
    await page.waitForTimeout(500);

    // バリデーションエラーメッセージが表示されていることを確認
    const errorMessages = page.locator('.error-message.show');
    await errorMessages.first().waitFor({ state: 'visible', timeout: 3000 });

    const errorCount = await errorMessages.count();
    expect(errorCount).toBeGreaterThan(0);

    // 画面が営業活動実績入力画面のままであることを確認
    const currentUrl = page.url();
    expect(currentUrl).toContain('scr-1791354364933');

    // フォーム内の入力値が保持されていることを確認
    const contentValue = await activityContentArea.inputValue();
    expect(contentValue).toBe('訪問');

    const dateValue = await activityDateInput.inputValue();
    expect(dateValue).toBe(futureDateStr);
  });
});
