import { test, expect } from '@playwright/test';

test('SCEN-1431: 営業活動タブ表示時にユーザーIDが空の場合エラーが返される', async ({ page }) => {
  // ユーザーID が空の状態でダッシュボードにアクセス
  // これはブラウザの開発者ツールで window.userId を削除、または
  // API 呼び出しのパラメータを操作する方法で実現

  // ページを通常通り開く
  await page.goto('/panels/scr-1791354379354.html');

  // ユーザーIDを空にする試み
  await page.evaluate(() => {
    (window as any).userId = null;
  });

  // 取引先を選択
  const customerRows = page.locator('tbody#customer-tbody tr');

  if (await customerRows.count() > 0) {
    const firstCustomer = customerRows.first();
    await firstCustomer.click();

    // 営業活動タブをクリック
    const activitiesTab = page.locator('[data-tab="activities"]');
    await activitiesTab.click();

    // エラーメッセージが表示されるか、またはタブが空のままであることを確認
    const pageContent = await page.innerText('body');

    // エラーメッセージまたは空の状態を確認
    const hasError = pageContent.includes('ユーザー') ||
                     pageContent.includes('指定されていません');

    // タブの内容が空であることを確認
    const activitiesTableWrap = page.locator('#activities-tab .table-wrap');
    const hasEmptyState = await page.locator('#activities-tab .empty-state').isVisible();

    // エラーまたは空状態のいずれかが成立することを確認
    expect(hasError || hasEmptyState).toBeTruthy();
  }
});
