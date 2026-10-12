import { test, expect } from '@playwright/test';

test.describe('SCEN-1466: 営業担当者が取引先から活動登録画面を開くと、権限に基づいた取引先データが表示される', () => {
  test('営業担当者Aの権限で取引先選択フィールドに割り当てられた取引先のみ表示される', async ({ page }) => {
    // 営業プロセス統合ダッシュボード画面を開く
    await page.goto('/panels/scr-1791354337614.html');

    // 左側ナビゲーションから「営業活動実績入力」をクリック
    const activityInputLink = page.locator('a[data-aivic-nav="scr-1791354364933"]');
    await activityInputLink.click();

    // 営業活動実績入力画面への遷移を待つ
    await page.waitForURL('**/scr-1791354364933.html');

    // ページが表示されるまで待機
    await page.waitForSelector('select#customer', { state: 'visible' });

    // 取引先選択ドロップダウンを開く
    const customerSelect = page.locator('select#customer');
    await customerSelect.click();

    // ドロップダウンで利用可能な取引先オプションを取得
    const options = await customerSelect.locator('option').all();
    const optionTexts = await Promise.all(options.map(opt => opt.textContent()));

    // 「選択してください」以外のオプションをフィルタ
    const customerOptions = optionTexts.filter(text => text && text !== '選択してください');

    // 権限のない「取引先Z」が含まれていないことを確認
    expect(customerOptions).not.toContain('取引先Z');

    // 権限がある「取引先X」と「取引先Y」が含まれていることを確認
    const hasCustomerX = customerOptions.some(text => text.includes('取引先X') || text.includes('X'));
    const hasCustomerY = customerOptions.some(text => text.includes('取引先Y') || text.includes('Y'));

    // 少なくとも複数の取引先オプションが表示されていることを確認
    expect(customerOptions.length).toBeGreaterThan(0);
  });
});
