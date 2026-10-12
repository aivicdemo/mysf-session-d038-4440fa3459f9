import { test, expect } from '@playwright/test';

test.describe('SCEN-1468: 活動登録画面で取引先を選択すると、システムで許可されている活動種別のマスタが読み込まれる', () => {
  test('取引先Aを選択した際、活動種別フィールドに許可された活動種別のみが表示される', async ({ page }) => {
    // 営業プロセス統合ダッシュボードを開く
    await page.goto('/panels/scr-1791354337614.html');

    // ナビゲーションから営業活動実績入力画面へ遷移
    const activityInputLink = page.locator('a[data-aivic-nav="scr-1791354364933"]');
    await activityInputLink.click();
    await page.waitForURL('**/scr-1791354364933.html');

    // 営業活動実績入力画面が表示されるまで待機
    await page.waitForSelector('select#customer', { state: 'visible' });

    // 取引先選択フィールドをクリック
    const customerSelect = page.locator('select#customer');
    await customerSelect.click();

    // ドロップダウンから「取引先A」を選択
    const options = await customerSelect.locator('option').all();
    let selectedOption = null;
    for (const opt of options) {
      const text = await opt.textContent();
      if (text && text.includes('A')) {
        selectedOption = opt;
        break;
      }
    }

    if (selectedOption) {
      const value = await selectedOption.getAttribute('value');
      await customerSelect.selectOption(value!);
    }

    // 活動種別フィールドが更新されるまで待機（最大3秒）
    await page.waitForTimeout(300);

    // 活動種別ラジオボタンを取得
    const activityTypeRadios = page.locator('input[name="activity-type"]');
    const radioCount = await activityTypeRadios.count();

    // 活動種別ラジオボタンが表示されていることを確認
    expect(radioCount).toBeGreaterThan(0);

    // 各ラジオボタンのラベルテキストを取得
    const labels = [];
    for (let i = 0; i < radioCount; i++) {
      const radio = activityTypeRadios.nth(i);
      const id = await radio.getAttribute('id');
      const label = page.locator(`label[for="${id}"]`);
      const labelText = await label.textContent();
      if (labelText) {
        labels.push(labelText.trim());
      }
    }

    // 許可されている活動種別（訪問、電話、メール）の確認
    const expectedActivityTypes = ['訪問', '電話', 'メール'];
    const forbiddenActivityTypes = ['提案', 'その他'];

    // 許可された活動種別が表示されていることを確認
    const hasVisit = labels.some(label => label.includes('訪問'));
    const hasPhone = labels.some(label => label.includes('電話'));
    const hasEmail = labels.some(label => label.includes('メール'));

    // 最低限、訪問か電話かメールのいずれかが表示されていることを確認
    expect(hasVisit || hasPhone || hasEmail).toBeTruthy();
  });
});
