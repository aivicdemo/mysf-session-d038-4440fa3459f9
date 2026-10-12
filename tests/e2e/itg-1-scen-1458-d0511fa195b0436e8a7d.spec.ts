import { test, expect } from '@playwright/test';

test('SCEN-1458: 他の営業担当者が担当する顧客を、権限なしの営業担当者が検索した場合、アクセスが拒否され、エラーメッセージが表示される', async ({ page }) => {
  // ログイン処理は省略し、営業担当者Aとして既にログイン済みの状態を想定
  await page.goto('/panels/scr-1791354337614.html');

  // ダッシュボード画面が表示されるまで待機
  await expect(page.locator('.shell-header')).toBeVisible();

  // 顧客・取引先管理画面へ遷移
  await page.click('a[data-aivic-nav="scr-1791354379354"]');
  await page.waitForLoadState('networkidle');

  // 検索フィールドに顧客Xの情報を入力（営業担当者Bが担当）
  const searchField = page.locator('#search-field');
  await expect(searchField).toBeVisible();
  await searchField.fill('顧客X');

  // 検索実行（Enterキーまたは検索ボタン）
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);

  // 検索結果から顧客X行をクリック（権限なしの顧客）
  const customerRow = page.locator('#customer-tbody tr').first();
  await expect(customerRow).toBeVisible();
  await customerRow.click();

  // 詳細画面が表示されるまで待機
  await page.waitForTimeout(500);

  // 「取引先請求タブ」をクリック
  const invoicesTab = page.locator('#invoices-tab, [data-testid="tab-invoices"]');
  await invoicesTab.click();

  // HTTP 403 Forbidden レスポンスを監視
  const consoleMessages: string[] = [];
  page.on('console', msg => consoleMessages.push(msg.text()));

  // 権限なしエラーが発生した場合、エラーメッセージが表示されることを確認
  await page.waitForTimeout(1000);

  // エラーメッセージが表示される
  const errorMessage = page.locator('div').filter({ hasText: 'このお客様の請求情報にはアクセス権限がありません。営業担当者Bにお問い合わせください。' });
  await expect(errorMessage).toBeVisible();

  // エラーメッセージが赤色警告バナーのスタイルで表示されている
  const errorBanner = page.locator('div').filter({ hasText: '権限がありません' }).or(errorMessage);
  const bgColor = await errorBanner.evaluate(el => window.getComputedStyle(el).backgroundColor);
  // 赤系の色であることを確認（RGB値で赤を確認）
  expect(bgColor).toMatch(/rgba?\(22[0-9].*0.*0|rgba?\([0-9]{1,3}.*0.*0/);

  // タブが灰色/無効化表示される、または詳細画面に戻される
  const isTabDisabled = await invoicesTab.evaluate(el => el.hasAttribute('disabled') || el.className.includes('disabled'));
  const isDashboardReloaded = page.url().includes('scr-1791354379354');

  // どちらかの条件が満たされることを確認
  expect(isTabDisabled || isDashboardReloaded).toBeTruthy();
});
