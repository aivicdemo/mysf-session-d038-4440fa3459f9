import { test, expect } from '@playwright/test';

test('SCEN-1365: 商談ステータスが受注で請求書ステータスが未発行の場合、ステータス不整合がハイライト表示される', async ({ page }) => {
  // 営業プロセス統合ダッシュボード画面を開く
  await page.goto('/panels/scr-1791354337614.html');

  // 取引先一覧から取引先ID「CUST-001」のレコードをクリック
  await page.getByText('CUST-001').click();

  // 取引先詳細パネルが展開され、関連情報が読み込まれるまで待機
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[class*="detail"], [class*="panel"]')).toBeVisible();

  // 商談セクションで商談ID「DEAL-2024-0365」の行を確認
  const dealRow = page.locator('tr, [role="row"]', { has: page.locator('text=DEAL-2024-0365') });
  await expect(dealRow).toBeVisible();

  // 同一行または隣接行に表示されている請求書ステータス「未発行」の表示を確認
  await expect(dealRow.locator('text=未発行')).toBeVisible();

  // 商談ステータス「受注」が同じ行に表示されることを確認
  await expect(dealRow.locator('text=受注')).toBeVisible();

  // ステータス組み合わせが強調表示されていることを確認
  // 背景色の濃い強調表示（黄色、オレンジ、赤など）またはボーダー・枠線による視覚的ハイライト
  const highlightedRow = dealRow.evaluate((el: HTMLElement) => {
    const styles = window.getComputedStyle(el);
    const bgColor = styles.backgroundColor;
    const borderColor = styles.borderColor;
    const borderWidth = styles.borderWidth;

    // ハイライトされた行かどうかを判定
    // 背景が通常と異なるか、またはボーダーが有効か
    const hasHighlight = bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent' ||
                        borderWidth !== '0px';
    return hasHighlight;
  });

  expect(await highlightedRow).toBeTruthy();
});
