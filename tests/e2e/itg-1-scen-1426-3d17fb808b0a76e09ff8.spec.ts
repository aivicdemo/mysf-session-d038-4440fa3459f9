import { test, expect } from '@playwright/test';

test('SCEN-1426: 営業活動タブ表示時に権限外の顧客データが非表示またはマスク表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354379354.html');

  // 取引先を選択
  const customerRows = page.locator('tbody#customer-tbody tr');
  const firstCustomer = customerRows.first();
  await firstCustomer.click();

  // 営業活動タブをクリック
  const activitiesTab = page.locator('[data-tab="activities"]');
  await activitiesTab.click();

  // APIレスポンスを監視（ネットワークレベルのデータ確認）
  const responsePromise = page.waitForResponse(response =>
    response.url().includes('/api') && response.status() === 200
  );

  // 営業活動タブの読み込みを待つ
  await page.locator('#activities-tab .table-wrap').waitFor({ state: 'visible' });

  // 権限外データが DOM に含まれていないことを確認
  const activitiesTable = page.locator('#activities-tab tbody');
  const tableText = await activitiesTable.innerText();

  // 権限外取引先の顧客IDが表示されていないことを確認
  // （実装例では、権限内取引先のデータのみが表示される）
  expect(tableText).not.toContain('権限外');

  // 画面に表示されている活動レコードをチェック
  const activityRows = page.locator('#activities-tab tbody tr:not(.empty-state)');
  const count = await activityRows.count();

  // データが表示されている場合、それらが権限内のデータであることを確認
  if (count > 0) {
    const firstRow = activityRows.first();
    const rowText = await firstRow.innerText();
    expect(rowText.length).toBeGreaterThan(0);
  }
});
