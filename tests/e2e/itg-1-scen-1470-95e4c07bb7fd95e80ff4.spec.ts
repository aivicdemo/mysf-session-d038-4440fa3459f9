import { test, expect } from '@playwright/test';

test.describe('SCEN-1470: 営業担当者が正当な活動実績データをすべて入力して保存すると、検証に合格して登録される', () => {
  test('全フィールド入力後に保存ボタンをクリックすると、成功メッセージが表示され、フィールドがクリアされる', async ({ page }) => {
    // ダッシュボードから活動登録ボタンをクリック
    await page.goto('/panels/scr-1791354337614.html');

    // 営業活動実績入力画面へのリンクをクリック
    const activityInputLink = page.locator('a[data-aivic-nav="scr-1791354364933"]');
    await activityInputLink.click();
    await page.waitForURL('**/scr-1791354364933.html');

    // フォームの要素が表示されるまで待機
    await page.waitForSelector('select#customer', { state: 'visible' });

    // 活動種別を「訪問」に選択
    const visitRadio = page.locator('input#type-visit');
    await visitRadio.check();

    // 実施日フィールドに「2026-01-15」を入力
    const activityDateInput = page.locator('input#activity-date');
    await activityDateInput.fill('2026-01-15');

    // 対象顧客（取引先）を選択
    const customerSelect = page.locator('select#customer');
    const options = await customerSelect.locator('option').all();

    let hasSelectedCustomer = false;
    for (const opt of options) {
      const text = await opt.textContent();
      if (text && text !== '選択してください') {
        const value = await opt.getAttribute('value');
        await customerSelect.selectOption(value!);
        hasSelectedCustomer = true;
        break;
      }
    }

    // 活動内容フィールドに「営業提案ヒアリング実施」と入力
    const activityContentArea = page.locator('textarea#activity-content');
    await activityContentArea.fill('営業提案ヒアリング実施');

    // 所要時間フィールドを確認（活動時間と活動件数）
    const activityTimeInput = page.locator('input#activity-time');
    const activityCountInput = page.locator('input#activity-count');

    // デフォルト値が設定されているか、または手動で設定
    await activityCountInput.fill('1');
    await activityTimeInput.fill('10:00');

    // 保存ボタンをクリック
    const submitButton = page.locator('button#btn-submit');
    await submitButton.click();

    // 成功メッセージが表示されるまで待機
    const successMessage = page.locator('#success-message');
    await successMessage.waitFor({ state: 'visible', timeout: 5000 });

    // 成功メッセージのテキストを確認
    const messageText = await successMessage.textContent();
    expect(messageText).toContain('登録');

    // フォームがクリアされたことを確認（少なくとも活動内容フィールドが空になることを確認）
    await page.waitForTimeout(2500);
    const clearedContent = await activityContentArea.inputValue();
    expect(clearedContent).toBe('');
  });
});
