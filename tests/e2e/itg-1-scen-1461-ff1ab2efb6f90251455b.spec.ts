import { test, expect } from '@playwright/test';

test('SCEN-1461: 請求書合計が商談金額を超える場合（過剰請求）、エラーメッセージが表示され、経理部門への報告が促される', async ({ page }) => {
  // ダッシュボードにアクセス
  await page.goto('/panels/scr-1791354337614.html');

  // ページが完全に読み込まれるまで待機
  await expect(page.locator('.shell-header')).toBeVisible();

  // 取引先一覧から取引先A（CUST-001）を検索・選択
  const searchField = page.locator('#search-field, input[placeholder*="取引先"]');
  await searchField.fill('取引先A');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);

  // 顧客・取引先管理画面へ遷移
  await page.goto('/panels/scr-1791354379354.html');
  await page.waitForLoadState('networkidle');

  // 取引先Aをクリック
  const customerRow = page.locator('#customer-tbody tr').filter({ hasText: 'CUST-001' }).first();
  await customerRow.click();
  await page.waitForTimeout(500);

  // 詳細画面の「商談・請求管理」タブを開く（存在する場合）
  const dealsTab = page.locator('[data-testid="tab-deals"], #deals-tab');
  if (await dealsTab.isVisible()) {
    await dealsTab.click();
    await page.waitForTimeout(300);
  }

  // 商談B（OPP-001）の行をクリック
  const dealRow = page.locator('tbody tr').filter({ hasText: 'OPP-001' }).first();
  if (await dealRow.isVisible()) {
    await dealRow.click();
    await page.waitForTimeout(500);
  }

  // 「取引先請求タブ」を選択
  const invoicesTab = page.locator('#invoices-tab, [data-testid="tab-invoices"]');
  await invoicesTab.click();
  await page.waitForTimeout(500);

  // 過剰請求検知ロジックが実行されるまで待機
  await page.waitForTimeout(1000);

  // 過剰請求エラーメッセージが赤背景で表示される
  const errorBanner = page.locator('div').filter({ hasText: '過剰請求エラー' });
  await expect(errorBanner).toBeVisible();

  // エラーメッセージに詳細が含まれている
  const errorDetail = page.locator('div').filter({ hasText: '請求書合計（110万円）が商談金額（100万円）を超過しています。経理部門への報告が必要です' });
  await expect(errorDetail).toBeVisible();

  // 赤背景であることを確認
  const bgColor = await errorBanner.evaluate(el => window.getComputedStyle(el).backgroundColor);
  expect(bgColor.toLowerCase()).toMatch(/rgba?\(22[0-9].*0.*0|red/);

  // 「経理部門に報告」ボタンが有効状態で表示される
  const reportButton = page.locator('button').filter({ hasText: '経理部門に報告' });
  await expect(reportButton).toBeVisible();
  const isDisabled = await reportButton.evaluate(el => el.hasAttribute('disabled'));
  expect(isDisabled).toBeFalsy();

  // システムログに異常検知通知が記録されている（コンソールで確認）
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(msg.text());
  });

  // 異常検知情報がログに含まれていることを確認
  expect(consoleLogs.some(log => log.includes('過剰請求') || log.includes('CUST-001') || log.includes('OPP-001'))).toBeTruthy();
});
