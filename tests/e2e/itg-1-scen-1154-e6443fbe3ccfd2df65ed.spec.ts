import { test, expect, Page } from '@playwright/test';

test('SCEN-1154: 金額ズレが集計結果に含まれる', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // ダッシュボード画面を表示
  await page.goto('/panels/scr-1791354337614.html');

  // 「請求書・請求明細」タブをクリック
  await page.click('text=請求書・請求明細');

  // 集計結果セクションが表示されるまで待機
  await page.waitForSelector('[class*="aggregation"]', { timeout: 5000 }).catch(() => null);

  // 「金額ズレ件数」項目の値を確認
  const discrepancyCount = page.locator('text=金額ズレ件数');
  await expect(discrepancyCount).toBeVisible();

  // 金額ズレ件数の値を取得
  const discrepancyCountValue = await discrepancyCount.evaluate(el => {
    const parent = el.closest('[class*="row"]') || el.parentElement;
    return parent?.textContent || '';
  });
  const countMatch = discrepancyCountValue.match(/\d+/);
  expect(countMatch).toBeTruthy();

  // 「金額ズレ合計額」項目の値を確認
  const discrepancyTotal = page.locator('text=金額ズレ合計額');
  await expect(discrepancyTotal).toBeVisible();

  // 金額ズレ合計額の値を取得（例：5万円）
  const discrepancyTotalValue = await discrepancyTotal.evaluate(el => {
    const parent = el.closest('[class*="row"]') || el.parentElement;
    return parent?.textContent || '';
  });
  const amountMatch = discrepancyTotalValue.match(/[\d,]+万円/);
  expect(amountMatch).toBeTruthy();

  // 明細一覧内で金額ズレ案件が「金額ズレ」フラグまたはステータスアイコン付きで表示される
  const discrepancyFlag = page.locator('[class*="discrepancy"]');
  const discrepancyIcon = page.locator('text=金額ズレ');

  // フラグまたはアイコンのいずれかが表示されていることを確認
  const hasFlagOrIcon = await Promise.all([
    discrepancyFlag.first().isVisible().catch(() => false),
    discrepancyIcon.first().isVisible().catch(() => false)
  ]).then(results => results.some(r => r));

  expect(hasFlagOrIcon).toBe(true);
});
