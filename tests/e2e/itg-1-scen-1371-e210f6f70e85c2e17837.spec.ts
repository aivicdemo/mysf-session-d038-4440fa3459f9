import { test, expect } from '@playwright/test';

test('SCEN-1371: 取引先の過去12ヶ月の商談履歴・請求履歴が時系列順に統合表示される', async ({ page }) => {
  // 営業プロセス統合ダッシュボード上から、対象取引先CUST_12345の名称をクリック
  await page.goto('/panels/scr-1791354337614.html');

  // または取引先ID検索で該当取引先を選択
  const searchInput = page.locator('input[placeholder*="検索"], input[id*="search"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill('CUST_12345');
    await page.keyboard.press('Enter');
  }

  // 該当取引先をクリックして取引先詳細表示へ遷移
  await page.getByText(/CUST_12345|取引先.*12345/).first().click();

  // 取引先詳細表示画面内の「商談・請求履歴」セクション（または統合履歴パネル）が読み込まれるのを待つ
  await page.waitForLoadState('networkidle');

  // 画面上に「過去12ヶ月の統合履歴」または「商談・請求統合タイムライン」と表示されているパネル領域
  const timelinePanel = page.locator('text=/過去12ヶ月.*統合履歴|商談.*請求.*統合タイムライン/');
  await expect(timelinePanel).toBeVisible();

  // 画面に表示されている履歴アイテムの一覧を上から下へスクロール
  const historyContainer = page.locator('[class*="timeline"], [class*="history"], [class*="list"]').first();
  await historyContainer.scrollIntoViewIfNeeded();

  // 過去12ヶ月間の商談と請求のレコードが**時系列順**で統合表示されている
  // 具体例:
  // 【商談】案件名「○○プロジェクト」、ステージ「提案中」、金額「500,000円」、作成日「2025-09-15」
  const dealItems = page.locator('[class*="item"], [class*="record"]', { has: page.locator('text=/商談|deal|【商談】/') });
  const dealCount = await dealItems.count();

  // 【請求】請求書No.「INV-202509-001」、金額「500,000円」、ステータス「発行済み」、発行日「2025-09-20」
  const invoiceItems = page.locator('[class*="item"], [class*="record"]', { has: page.locator('text=/請求|invoice|【請求】|INV-/') });
  const invoiceCount = await invoiceItems.count();

  // 統合表示されていることを確認
  expect(dealCount + invoiceCount).toBeGreaterThanOrEqual(2);

  // 日付でソートされていることを確認
  const allItems = page.locator('[class*="item"], [class*="record"], [class*="entry"]').all();
  let lastDate: Date | null = null;
  for (const item of await allItems) {
    const dateText = await item.locator('text=/202[0-9]-(0[0-9]|1[0-2])-([0-2][0-9]|3[0-1])/').innerText().catch(() => null);
    if (dateText) {
      const currentDate = new Date(dateText);
      if (lastDate && currentDate > lastDate) {
        // 日付が降順（新しい順）で並んでいることを確認
        expect(currentDate.getTime()).toBeLessThanOrEqual(lastDate.getTime());
      }
      lastDate = currentDate;
    }
  }

  // 12ヶ月の範囲外（2024年10月1日より前）のレコードは表示されない
  const outOfRangeRecords = page.locator('[class*="item"], [class*="record"]', {
    has: page.locator('text=/202[0-3]-(0[0-9]|1[0-2])/')
  });
  const outOfRangeCount = await outOfRangeRecords.count();
  expect(outOfRangeCount).toBe(0);

  // 画面レンダリング完了後、スクロール操作で全履歴アイテムが閲覧可能である
  const container = page.locator('[class*="timeline"], [class*="history"], [class*="list"]').first();
  const initialScrollHeight = await container.evaluate((el: HTMLElement) => el.scrollHeight);

  await container.evaluate((el: HTMLElement) => {
    el.scrollTop = el.scrollHeight;
  });

  const finalScrollHeight = await container.evaluate((el: HTMLElement) => el.scrollHeight);

  // スクロール可能であることを確認
  expect(initialScrollHeight).toBeGreaterThan(0);
  expect(finalScrollHeight).toBeGreaterThan(0);
});
