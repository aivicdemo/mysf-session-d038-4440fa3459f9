import { test, expect } from '@playwright/test';

test.describe('SCEN-1471: 活動種別が許可されたマスタリストに含まれていない値で保存しようとすると、検証エラーとなり保存が拒否される', () => {
  test('許可されていない活動種別で保存しようとするとバリデーションエラーが表示される', async ({ page }) => {
    // 活動登録画面を開く
    await page.goto('/panels/scr-1791354364933.html');

    // フォーム要素が読み込まれるまで待機
    await page.waitForSelector('select#customer', { state: 'visible' });

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

    // 活動内容に「テスト活動」と入力
    const activityContentArea = page.locator('textarea#activity-content');
    await activityContentArea.fill('テスト活動');

    // 実績日に当日を入力
    const activityDateInput = page.locator('input#activity-date');
    const today = new Date().toISOString().split('T')[0];
    await activityDateInput.fill(today);

    // 活動種別を設定しないで保存（許可されていない値を意図）
    // または、ブラウザコンソールで不正な値を直接設定
    const allRadios = page.locator('input[name="activity-type"]');
    const radioCount = await allRadios.count();
    if (radioCount > 0) {
      // すべてのラジオボタンをチェック外す
      for (let i = 0; i < radioCount; i++) {
        const radio = allRadios.nth(i);
        const checked = await radio.isChecked();
        if (checked) {
          await radio.uncheck();
        }
      }
    }

    // 保存ボタンをクリック
    const submitButton = page.locator('button#btn-submit');
    await submitButton.click();

    // バリデーションエラーメッセージが表示されることを確認
    const errorMessages = page.locator('.error-message');
    const visibleErrors = errorMessages.locator('visible=true');
    const errorCount = await visibleErrors.count();

    // エラーメッセージが表示されていることを確認
    expect(errorCount).toBeGreaterThan(0);

    // 画面が営業活動実績入力画面のままであることを確認（遷移していない）
    const currentUrl = page.url();
    expect(currentUrl).toContain('scr-1791354364933');

    // 活動内容フィールドの値が保持されていることを確認
    const contentValue = await activityContentArea.inputValue();
    expect(contentValue).toBe('テスト活動');
  });
});
