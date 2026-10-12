import { test, expect } from '@playwright/test';

test('SCEN-1363: ユーザーの職位が営業担当者で、他者の担当取引先の詳細画面を開こうとすると表示が拒否される', async ({ page }) => {
  // 営業プロセス統合ダッシュボードにログインした状態
  await page.goto('/panels/scr-1791354379354.html');

  // 対象取引先CUST-002の詳細画面URLを直接入力
  await page.goto('/customers/CUST-002/detail');

  // ページ読み込み完了を待つ
  await page.waitForLoadState('networkidle');

  // HTTPステータス 403（Forbidden）エラー画面またはシステム標準のアクセス拒否画面が表示される
  const errorMessage = page.locator('text=/アクセス権限がありません|この取引先の詳細情報を表示する権限がありません/');
  await expect(errorMessage).toBeVisible();

  // 対象取引先CUST-002の詳細情報が一切表示されない
  const customerName = page.locator('text=CUST-002');
  const customerAddress = page.locator('[class*="address"]');
  const dealsList = page.locator('table, [class*="deal"]');
  const invoiceInfo = page.locator('[class*="invoice"]');

  const customerVisible = await customerName.isVisible().catch(() => false);
  const addressVisible = await customerAddress.isVisible().catch(() => false);
  const dealsVisible = await dealsList.isVisible().catch(() => false);
  const invoiceVisible = await invoiceInfo.isVisible().catch(() => false);

  expect(customerVisible || addressVisible || dealsVisible || invoiceVisible).toBeFalsy();
});
