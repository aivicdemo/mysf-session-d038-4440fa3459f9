import { test, expect } from '@playwright/test';

test('SCEN-1460: 商談から請求書へのリンクが無効な場合、参照関係が破損していることが検出され、警告メッセージが表示される', async ({ page }) => {
  // ダッシュボード画面を開く
  await page.goto('/panels/scr-1791354337614.html');

  // ページが完全に読み込まれるまで待機
  await expect(page.locator('.shell-header')).toBeVisible();

  // 取引先一覧から「取引先A」を検索・選択
  const searchField = page.locator('#search-field, input[placeholder*="取引先"]');
  await searchField.fill('取引先A');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);

  // 取引先A行をクリック
  const customerRow = page.locator('#customer-tbody tr').first();
  await customerRow.click();
  await page.waitForTimeout(500);

  // 顧客・取引先管理画面に遷移して詳細画面を表示
  await page.goto('/panels/scr-1791354379354.html');
  await page.waitForLoadState('networkidle');

  // 取引先Aをクリック
  const customerLink = page.locator('#customer-tbody tr').first();
  await customerLink.click();
  await page.waitForTimeout(500);

  // 詳細画面から「取引先請求タブ」をクリック
  const invoicesTab = page.locator('#invoices-tab, [data-testid="tab-invoices"]');
  await invoicesTab.click();
  await page.waitForTimeout(500);

  // 請求書一覧に INV-001 が表示されるまで待機
  const invoiceRow = page.locator('tbody tr').filter({ hasText: 'INV-001' });
  await expect(invoiceRow).toBeVisible({ timeout: 5000 });

  // INV-001 行の「詳細表示」または「リンク」ボタンをクリック
  const detailButton = invoiceRow.locator('button, a').filter({ hasText: '詳細|リンク|表示' }).first();
  if (await detailButton.isVisible()) {
    await detailButton.click();
  } else {
    // ボタンがなければ行全体をクリック
    await invoiceRow.click();
  }

  // 参照関係の検証を実行
  await page.waitForTimeout(1000);

  // 警告メッセージが表示されることを確認
  const warningMessage = page.locator('div').filter({ hasText: '参照関係が破損しています。商談 DEAL-999_INVALID が見つかりません。管理者に連絡してください。' });
  await expect(warningMessage).toBeVisible();

  // 警告メッセージスタイルが黄色背景であることを確認
  const bgColor = await warningMessage.evaluate(el => window.getComputedStyle(el).backgroundColor);
  expect(bgColor.toLowerCase()).toMatch(/yellow|#ffff|rgba?\(255.*255.*0/);

  // INV-001 行背景が黄色で強調表示される
  const highlightedRow = page.locator('tbody tr').filter({ hasText: 'INV-001' }).first();
  const rowBgColor = await highlightedRow.evaluate(el => window.getComputedStyle(el).backgroundColor);
  expect(rowBgColor.toLowerCase()).toMatch(/yellow|#ffff|rgba?\(255.*255|highlight/);
});
