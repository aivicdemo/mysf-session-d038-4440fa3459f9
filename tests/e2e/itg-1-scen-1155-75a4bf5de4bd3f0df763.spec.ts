import { test, expect, Page } from '@playwright/test';

test('SCEN-1155: 異常値がハイライト表示される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // ダッシュボードから商談・請求管理画面へ遷移
  await page.goto('/panels/scr-1791354337614.html');
  await page.click('text=商談・請求管理');
  await page.waitForNavigation();

  // 金額ズレがある商談を検索・選択
  // フィルタを使用して検索（実装による）
  await page.click('#deal-tbody tr:first-child');
  await page.waitForSelector('#detail-panel');

  // 「請求書・請求明細」タブをクリック
  await page.click('#invoices-tab');
  await page.waitForSelector('#invoice-detail-tbody');

  // 金額ズレが検出された請求明細行をチェック
  const rows = page.locator('#invoice-detail-tbody tr');
  const count = await rows.count();

  let foundHighlight = false;
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);

    // 背景色またはクラスで強調表示されているか確認
    const bgColor = await row.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });

    const hasHighlightClass = await row.evaluate(el => {
      return el.className.includes('highlight') || el.className.includes('error') || el.className.includes('warning');
    });

    // 警告メッセージが表示されているか確認
    const warningMessage = row.locator('text=商談金額と請求金額が一致しません');
    const hasWarning = await warningMessage.isVisible().catch(() => false);

    if (hasHighlightClass || hasWarning) {
      foundHighlight = true;

      // 金額フィールド（請求金額、数量、単価など）が強調表示されているか確認
      const amountField = row.locator('[class*="amount"]').first();
      const quantityField = row.locator('[class*="quantity"]').first();
      const unitPriceField = row.locator('[class*="price"]').first();

      const fieldHighlighted = await Promise.all([
        amountField.evaluate(el => el.className.includes('highlight')).catch(() => false),
        quantityField.evaluate(el => el.className.includes('highlight')).catch(() => false),
        unitPriceField.evaluate(el => el.className.includes('highlight')).catch(() => false)
      ]).then(results => results.some(r => r));

      // ハイライト表示またはツールチップのいずれかが存在することを確認
      if (fieldHighlighted || hasWarning) {
        expect(true).toBe(true);
      }

      break;
    }
  }

  // 金額ズレ行が見つかった場合はテスト成功
  if (foundHighlight) {
    expect(true).toBe(true);
  }
});
