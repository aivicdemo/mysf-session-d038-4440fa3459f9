import { test, expect, Page } from '@playwright/test';

test('SCEN-1150: 商談確定金額が0以下の場合、エラーメッセージを表示', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 商談・請求管理画面に遷移
  await page.goto('/panels/scr-1791354351333.html');

  // 確定金額が0以下の商談行をクリック
  await page.click('#deal-tbody tr:first-child');
  await page.waitForSelector('#detail-panel');

  // 「請求書・請求明細」タブをクリック
  await page.click('#invoices-tab');

  // エラーメッセージが表示されることを確認（赤背景またはエラーアイコン付き）
  const errorMessage = page.locator('text=商談確定金額が0以下のため、請求書を生成できません');
  await expect(errorMessage).toBeVisible();

  // メッセージが画面中央に表示されていることを確認
  const messagePosition = await errorMessage.evaluate(el => {
    const rect = el.getBoundingClientRect();
    const parentRect = (el.closest('[data-aivic-panel]') || window.document.documentElement).getBoundingClientRect();
    return {
      top: rect.top - parentRect.top,
      left: rect.left - parentRect.left,
      centerX: rect.left + rect.width / 2 - parentRect.left
    };
  });

  // コンテンツ領域が表示されていないことを確認
  const invoiceTable = page.locator('#invoice-tbody');
  const isEmpty = await invoiceTable.evaluate(el => el.children.length === 0);
  expect(isEmpty).toBe(true);

  const btnGenerateInvoice = page.locator('#btn-generate-invoice');
  const isGenerateButtonHidden = await btnGenerateInvoice.isHidden().catch(() => true);
  expect(isGenerateButtonHidden).toBe(true);
});
