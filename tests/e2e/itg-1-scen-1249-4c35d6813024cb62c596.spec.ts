import { test, expect } from '@playwright/test';

test('SCEN-1249: 営業担当者の権限に応じて表示対象データの範囲が制限される', async ({ page, context }) => {
  // 営業担当者Aがログイン状態で営業プロセス統合ダッシュボードにアクセスする
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForLoadState('networkidle');

  // ダッシュボード内の「商談・請求管理画面」リンクをクリックして遷移する
  await page.click('a[data-aivic-nav-system="scr-1791354351333"]');
  await page.waitForLoadState('networkidle');

  // 商談・請求管理画面の請求書一覧セクションを確認する
  await expect(page.locator('[data-aivic-nav-system="scr-1791354351333"]')).toBeVisible();

  // 営業担当者Aが担当する請求書-001をリストから選択してクリックする
  const invoiceRow001 = page.locator('tbody#invoice-tbody').locator('text=請求書-001').first();
  await expect(invoiceRow001).toBeVisible();
  await invoiceRow001.click();

  // 請求書修正画面が表示されるまで待機する
  await page.waitForURL(/scr-1791354749663/);
  await page.waitForLoadState('networkidle');

  // 修正画面に表示されている請求書データ（取引先名・金額・品目など）を確認する
  const invoiceInfo = page.locator('[data-section="invoice-info"]');
  await expect(invoiceInfo).toBeVisible();
  const customerNameField = invoiceInfo.locator('[data-field="customer-name"]');
  const amountField = invoiceInfo.locator('[data-field="amount"]');
  await expect(customerNameField).toHaveValue(/./);
  await expect(amountField).toHaveValue(/./);

  // 同じセッション内で「戻る」または別タブで営業プロセス統合ダッシュボードに戻る
  await page.goBack();
  await page.waitForLoadState('networkidle');

  // 再度「商談・請求管理画面」に遷移して、同じ請求書一覧を表示する
  await page.click('a[data-aivic-nav-system="scr-1791354351333"]');
  await page.waitForLoadState('networkidle');

  // 営業担当者Bが担当する請求書-003が一覧に表示されているか確認する
  const invoiceRow003Elements = page.locator('tbody#invoice-tbody').locator('text=請求書-003');
  const count003 = await invoiceRow003Elements.count();

  if (count003 > 0) {
    // 請求書-003がリスト内に表示されている場合、そのをクリックして開こうとする
    await invoiceRow003Elements.first().click();

    // 「アクセス権限がありません」というエラーメッセージが表示されることを確認
    const errorMessage = page.locator('[role="alert"]').filter({ hasText: 'アクセス権限' });
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('アクセス権限がありません');

    // 修正画面は表示されないことを確認
    const modificationForm = page.locator('[data-section="modification-form"]');
    await expect(modificationForm).not.toBeVisible();
  } else {
    // 請求書-003が一覧に表示されていない場合、表示されていないことを確認
    const invoiceList = page.locator('tbody#invoice-tbody');
    await expect(invoiceList.locator('text=請求書-003')).not.toBeVisible();
  }

  // URLを直接操作して請求書-003へのアクセスを試みる
  const currentUrl = page.url();
  const invoiceDetailsUrl = currentUrl.replace(/invoice-id=[^&]*/, 'invoice-id=invoice-003');

  // 別タブで試行
  const newPage = await context.newPage();
  await newPage.goto(invoiceDetailsUrl);
  await newPage.waitForLoadState('networkidle');

  // 「アクセス権限がありません」というエラーメッセージが表示されることを確認
  const errorAlert = newPage.locator('[role="alert"]').filter({ hasText: 'アクセス権限' });
  await expect(errorAlert).toBeVisible();
  await expect(errorAlert).toContainText('アクセス権限がありません');

  // 修正画面は表示されていないことを確認
  const modForm = newPage.locator('[data-section="modification-form"]');
  await expect(modForm).not.toBeVisible();

  // 営業担当者Aが表示できるのは、自身の営業活動に関連する請求書データのみに限定されていることを確認
  await page.goto('scr-1791354351333.html');
  await page.waitForLoadState('networkidle');

  // 表示されている請求書一覧が営業担当者Aの請求書のみであることを確認
  const invoiceList = page.locator('tbody#invoice-tbody tr');
  const visibleInvoices = await invoiceList.locator('[data-invoice-owner]').evaluateAll((elements) =>
    elements.map(el => el.getAttribute('data-invoice-owner'))
  );

  // すべての請求書が営業担当者Aに属していることを確認
  const allOwnedByA = visibleInvoices.every(owner => owner === 'salesperson-A' || owner === null);
  expect(allOwnedByA).toBe(true);

  await newPage.close();
});
