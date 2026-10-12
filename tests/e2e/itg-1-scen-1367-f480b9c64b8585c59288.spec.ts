import { test, expect } from '@playwright/test';

test('SCEN-1367: 請求金額がゼロで営業成績が計上されている場合、未請求としてwarningハイライトが表示される', async ({ page }) => {
  // ブラウザで営業プロセス統合ダッシュボードにアクセス
  await page.goto('/panels/scr-1791354337614.html');

  // 左側ナビゲーションから「顧客・取引先管理画面」を選択
  await page.getByText('顧客・取引先管理').click();

  // 取引先一覧から取引先A（CUST-001）の行をクリック
  await page.getByText('CUST-001').click();

  // 取引先詳細表示を開く
  await page.waitForLoadState('networkidle');

  // 取引先詳細画面が読み込まれるまで待機（最大5秒）
  const detailPanel = page.locator('[class*="detail"], [class*="panel"]');
  await expect(detailPanel).toBeVisible({ timeout: 5000 });

  // 請求情報セクションで、請求金額と営業成績の対比表示を確認
  const billingSection = page.locator('[class*="billing"], [class*="invoice"], [class*="請求"]');
  await billingSection.scrollIntoViewIfNeeded();

  // 請求金額0円・営業成績100,000円の行が表示されている
  const unbilledRow = page.locator('[class*="row"], tr', {
    has: page.locator('text=/請求金額.*0|営業成績.*100,000|100万/')
  });
  await expect(unbilledRow).toBeVisible();

  // 行全体が黄色またはオレンジ色のwarningハイライトで強調表示
  const highlightColor = await unbilledRow.evaluate((el: HTMLElement) => {
    const styles = window.getComputedStyle(el);
    return styles.backgroundColor;
  });

  // 警告色（黄色系またはオレンジ系）であることを確認
  expect(highlightColor).toMatch(/yellow|orange|rgb\((2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?),\s*(15[0-9]|[1-9][0-9]|[0-9]),|rgb\((2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?),\s*(1[0-4][0-9]|[1-9][0-9]|[0-9]),/i);

  // aria-label属性に「未請求: 営業成績100,000円に対して請求金額が0円です」と含まれている
  const ariaLabel = await unbilledRow.locator('[aria-label]').first().getAttribute('aria-label');
  expect(ariaLabel).toContain('未請求');
  expect(ariaLabel).toContain('100,000');
});
