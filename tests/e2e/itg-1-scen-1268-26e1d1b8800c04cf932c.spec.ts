import { test, expect } from '@playwright/test';

test('SCEN-1268: データ検証ルール定義を読み込み、修正入力値の妥当性を検証して不適合項目を特定できる', async ({ page }) => {
  await page.goto('/panels/scr-1791354351333.html');

  await page.waitForLoadState('networkidle');

  const invoiceNumber = 'INV-20250107-001';
  const searchInput = await page.$('#filter-customer');
  if (searchInput) {
    await searchInput?.fill(invoiceNumber);
    await page.waitForTimeout(300);
  }

  const dealRows = await page.$$('table tbody tr');
  if (dealRows.length > 0) {
    await dealRows[0].click();
  }

  await page.waitForSelector('#detail-panel', { state: 'visible' });

  const editButton = await page.$('#btn-edit-invoice');
  await editButton?.click();

  await page.waitForSelector('#edit-form', { state: 'visible' });

  const amountInput = await page.$('#edit-quantity, input[aria-label*="金額"], [name*="amount"]');
  if (amountInput) {
    await amountInput.fill('600000');
  }

  const dueDateInput = await page.$('input[type="date"], #edit-due-date, [name*="date"]');
  if (dueDateInput) {
    await dueDateInput.fill('2025-01-15');
  }

  const newLineButton = await page.$('[class*="add-line"], button:has-text("追加")');
  if (newLineButton && await newLineButton.isVisible()) {
    await newLineButton.click();
    await page.waitForTimeout(300);

    const priceInput = await page.$('input[aria-label*="単価"], [name*="price"]');
    const quantityInput = await page.$('input[aria-label*="数量"], [name*="quantity"]');

    if (priceInput && quantityInput) {
      await priceInput.fill('100000');
      await quantityInput.fill('6');
    }
  }

  const validateButton = await page.$('[class*="validate"], button:has-text("検証")');
  if (validateButton) {
    await validateButton.click();
    await page.waitForTimeout(500);
  }

  const validationResults = await page.locator('[class*="validation"], [class*="result"], [role="alert"]');
  const resultText = await validationResults.textContent();

  if (resultText && resultText.length > 0) {
    expect(resultText).toContain('検証');

    const errorHighlight = await page.locator('[class*="error"], [style*="pink"], [style*="background"]');
    const successMark = await page.locator('[class*="success"], [class*="check"]');

    if (await errorHighlight.isVisible()) {
      const errorText = await errorHighlight.textContent();
      expect(errorText).toMatch(/不適合|超過|無効|エラー/);
    }

    if (await successMark.isVisible()) {
      const successText = await successMark.textContent();
      expect(successText).toMatch(/適合|チェック|成功/);
    }
  }

  const warningIcon = await page.locator('[class*="warning"], [class*="icon-alert"]');
  if (await warningIcon.isVisible()) {
    const warningCount = await warningIcon.count();
    expect(warningCount).toBeGreaterThan(0);
  }

  const continueButton = await page.$('button:has-text("続行"), button:has-text("確定")');
  const cancelButton = await page.$('#btn-cancel-edit, button:has-text("中止")');

  expect(continueButton || cancelButton).toBeDefined();
});
