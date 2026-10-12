import { test, expect, devices } from '@playwright/test';

test('SCEN-1250: モバイルデバイスからのアクセス時に機密情報の表示範囲が制限される', async ({ browser }) => {
  // iOS Safariデバイスでテストを実行
  const iOSContext = await browser.newContext({
    ...devices['iPhone 12'],
    isMobile: true,
    hasTouch: true,
  });
  const iosPage = await iOSContext.newPage();

  // モバイルデバイス（iOS Safari）から営業プロセス統合ダッシュボードにログイン
  await iosPage.goto('/panels/scr-1791354337614.html');
  await iosPage.waitForLoadState('networkidle');

  // 商談・請求管理画面に遷移
  await iosPage.click('a[data-aivic-nav-system="scr-1791354351333"]');
  await iosPage.waitForLoadState('networkidle');

  // 修正対象の請求書行を選択し、請求書修正画面を開く
  const invoiceRow = iosPage.locator('tbody#invoice-tbody tr').first();
  await expect(invoiceRow).toBeVisible();
  await invoiceRow.click();

  // 請求書修正画面への遷移を待機
  await iosPage.waitForURL(/scr-1791354749663/);
  await iosPage.waitForLoadState('networkidle');

  // デバイスの画面に表示される請求書データフィールドを確認
  const invoiceSection = iosPage.locator('[data-section="invoice-info"]');
  await expect(invoiceSection).toBeVisible();

  // 以下の機密情報が表示されず、非表示・マスク・削除されていることを確認

  // 取引先銀行口座下4桁（表示されないか、またはすべてアスタリスク「****」でマスク）
  const bankAccountField = iosPage.locator('[data-field="bank-account"]');
  const bankAccountCount = await bankAccountField.count();

  if (bankAccountCount > 0) {
    const bankAccountValue = await bankAccountField.inputValue();
    // アスタリスク以外の数字が見えないことを確認（すべて****または非表示）
    expect(bankAccountValue).toMatch(/^\*{4}$/);
  }

  // 営業担当者個人携帯番号（表示されない）
  const personalPhoneField = iosPage.locator('[data-field="personal-phone"]');
  await expect(personalPhoneField).not.toBeVisible();

  // 内部原価情報（表示されない）
  const internalCostField = iosPage.locator('[data-field="internal-cost"]');
  await expect(internalCostField).not.toBeVisible();

  // 取引先信用スコア（表示されない）
  const creditScoreField = iosPage.locator('[data-field="credit-score"]');
  await expect(creditScoreField).not.toBeVisible();

  // 一方、業務必須情報は正常に表示されていることを確認

  // 請求先名
  const customerNameField = iosPage.locator('[data-field="customer-name"]');
  await expect(customerNameField).toBeVisible();
  const customerNameValue = await customerNameField.inputValue();
  expect(customerNameValue).toBeTruthy();
  expect(customerNameValue.length).toBeGreaterThan(0);

  // 請求金額
  const amountField = iosPage.locator('[data-field="invoice-amount"]');
  await expect(amountField).toBeVisible();
  const amountValue = await amountField.inputValue();
  expect(amountValue).toMatch(/\d+,\d+|^\d+$/);

  // 請求期日
  const dueDateField = iosPage.locator('[data-field="due-date"]');
  await expect(dueDateField).toBeVisible();
  const dueDateValue = await dueDateField.inputValue();
  expect(dueDateValue).toMatch(/\d{4}-\d{2}-\d{2}/);

  // 請求明細品目
  const detailsTable = iosPage.locator('tbody#invoice-detail-tbody tr');
  await expect(detailsTable.first()).toBeVisible();
  const itemNameField = detailsTable.first().locator('[data-field="item-name"]');
  await expect(itemNameField).toBeVisible();

  // 数量
  const quantityField = detailsTable.first().locator('[data-field="quantity"]');
  await expect(quantityField).toBeVisible();
  const quantityValue = await quantityField.inputValue();
  expect(quantityValue).toMatch(/^\d+$/);

  // 単価
  const unitPriceField = detailsTable.first().locator('[data-field="unit-price"]');
  await expect(unitPriceField).toBeVisible();
  const unitPriceValue = await unitPriceField.inputValue();
  expect(unitPriceValue).toMatch(/\d+,\d+|^\d+$/);

  // Android Chromeでも同じ検証を実行
  await iOSContext.close();

  const androidContext = await browser.newContext({
    ...devices['Pixel 5'],
    isMobile: true,
    hasTouch: true,
  });
  const androidPage = await androidContext.newPage();

  // Android ChromeからのアクセスでもURL経由で請求書修正画面を開く
  await androidPage.goto('/panels/scr-1791354749663.html?id=invoice-001');
  await androidPage.waitForLoadState('networkidle');

  // 同じ機密情報非表示の検証をAndroidでも実行
  const androidBankAccountField = androidPage.locator('[data-field="bank-account"]');
  const androidBankAccountCount = await androidBankAccountField.count();

  if (androidBankAccountCount > 0) {
    const bankAccountValue = await androidBankAccountField.inputValue();
    expect(bankAccountValue).toMatch(/^\*{4}$/);
  }

  const androidPersonalPhoneField = androidPage.locator('[data-field="personal-phone"]');
  await expect(androidPersonalPhoneField).not.toBeVisible();

  const androidInternalCostField = androidPage.locator('[data-field="internal-cost"]');
  await expect(androidInternalCostField).not.toBeVisible();

  const androidCreditScoreField = androidPage.locator('[data-field="credit-score"]');
  await expect(androidCreditScoreField).not.toBeVisible();

  // 業務必須情報はAndroidでも表示されることを確認
  const androidCustomerNameField = androidPage.locator('[data-field="customer-name"]');
  await expect(androidCustomerNameField).toBeVisible();

  const androidAmountField = androidPage.locator('[data-field="invoice-amount"]');
  await expect(androidAmountField).toBeVisible();

  await androidContext.close();
});
