import { test, expect } from '@playwright/test';

test('SCEN-1459: 顧客IDが空またはnullの場合、エラーメッセージが表示され、顧客特定が促される', async ({ page }) => {
  // ダッシュボード画面から商談・請求管理画面へ遷移
  await page.goto('/panels/scr-1791354351333.html');

  // ページが完全に読み込まれるまで待機
  await expect(page.locator('.shell-header')).toBeVisible();

  // 商談・請求管理画面が表示される
  await page.waitForLoadState('networkidle');

  // 「取引先請求タブ」をクリック
  const invoicesTab = page.locator('#invoices-tab, [data-testid="tab-invoices"]');
  await expect(invoicesTab).toBeVisible();
  await invoicesTab.click();

  // 「取引先請求タブ」内の「顧客ID入力フィールド」を特定
  const customerIdField = page.locator('input[id*="customer"], [id*="deal"], input[placeholder*="顧客"]').first();

  // 顧客IDフィールドが存在する場合、空のままにする（何も入力しない）
  if (await customerIdField.isVisible()) {
    await customerIdField.click();
    await customerIdField.clear();
  }

  // 「請求情報表示」ボタンをクリック
  const displayButton = page.locator('button').filter({ hasText: '請求情報表示|表示|検索' }).first();
  await expect(displayButton).toBeVisible();
  await displayButton.click();

  // バリデーションエラーが発生し、エラーメッセージが表示される
  await page.waitForTimeout(500);

  // 赤色のエラーメッセージが表示される
  const errorMessage = page.locator('div').filter({ hasText: '顧客IDが入力されていません。顧客を特定するため、顧客IDを入力してください' });
  await expect(errorMessage).toBeVisible();

  // エラーメッセージが赤色であることを確認
  const errorColor = await errorMessage.evaluate(el => window.getComputedStyle(el).color);
  expect(errorColor).toMatch(/rgba?\(.*\)/);

  // 入力フィールドが赤枠でハイライトされる
  const highlightedField = page.locator('input').filter({ hasText: '' }).first();
  const borderColor = await highlightedField.evaluate(el => window.getComputedStyle(el).borderColor);
  // 赤系の枠線色であることを確認
  expect(borderColor.toLowerCase()).toMatch(/red|#[ef0-9a-f]{6}|rgba?\(22[0-9]/);

  // 「請求情報表示」ボタンがdisabled状態になっている
  const isButtonDisabled = await displayButton.evaluate(el => el.hasAttribute('disabled'));
  expect(isButtonDisabled).toBeTruthy();

  // 請求データの取得・表示が成立しない
  const invoiceTable = page.locator('#invoice-tbody, [data-testid="invoice-list-table"] tbody');
  const emptyState = invoiceTable.locator('tr').filter({ hasText: 'データなし|該当する請求書がありません' });
  await expect(emptyState).toBeVisible();
});
