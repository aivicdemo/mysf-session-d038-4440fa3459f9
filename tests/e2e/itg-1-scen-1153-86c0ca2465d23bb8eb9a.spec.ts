import { test, expect, Page } from '@playwright/test';

test('SCEN-1153: 未請求案件が集計結果に含まれる', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // ダッシュボード画面にアクセス
  await page.goto('/panels/scr-1791354337614.html');

  // 左側ナビゲーションメニューから「商談・請求管理画面」を選択
  await page.click('text=商談・請求管理');
  await page.waitForNavigation();

  // 「請求書・請求明細」タブをクリック
  await page.click('#invoices-tab');

  // 集計結果エリアが表示されるまで待機
  await page.waitForSelector('[class*="aggregation"]', { timeout: 5000 }).catch(() => null);

  // 集計件数に「未請求：2件」と表示されていることを確認
  await expect(page.locator('text=未請求')).toBeVisible();
  await expect(page.locator('text=2件')).toBeVisible();

  // 集計金額合計に「未請求合計：150万円」と表示されていることを確認
  await expect(page.locator('text=未請求合計')).toBeVisible();
  await expect(page.locator('text=150万円')).toBeVisible();

  // 一覧内で商談(1)と商談(2)に対応する行が「未請求」ステータスで表示されていることを確認
  const rows = page.locator('#invoice-tbody tr');
  const count = await rows.count();
  let unbilledCount = 0;

  for (let i = 0; i < count; i++) {
    const status = await rows.nth(i).locator('text=未請求').isVisible().catch(() => false);
    if (status) {
      unbilledCount++;
    }
  }

  expect(unbilledCount).toBeGreaterThanOrEqual(2);

  // 請求済み案件（商談(3)）とは区別されて表示されていることを確認
  await expect(page.locator('text=請求済')).toBeVisible();
});
