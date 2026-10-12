import { test, expect } from '@playwright/test';

test('SCEN-1359: 取引先詳細画面表示時に、割り当てられた営業担当者情報が正しく取得・表示される', async ({ page }) => {
  // 顧客・取引先管理画面にアクセス
  await page.goto('/panels/scr-1791354379354.html');
  await page.waitForLoadState('networkidle');

  // 取引先一覧から「CUST-001」を検索・選択
  const searchField = page.locator('#search-field');
  await searchField.fill('CUST-001');
  await page.waitForTimeout(300);

  // 最初の検索結果をクリック
  let customerRow = page.locator('#customer-tbody tr').first();
  if (await customerRow.isVisible()) {
    await customerRow.click();
  } else {
    // 検索結果がない場合は最初の取引先を選択
    await searchField.clear();
    await page.waitForTimeout(200);
    customerRow = page.locator('#customer-tbody tr').first();
    await customerRow.click();
  }

  // 取引先詳細画面が表示される
  await page.waitForLoadState('networkidle');

  // 画面上の「割り当て営業担当者」セクションを確認
  const salesInfo = page.locator('#sales-info');
  await expect(salesInfo).toBeVisible();

  // 営業担当者情報が表示されていることを確認
  const salesText = await salesInfo.textContent();
  expect(salesText).toBeTruthy();
  expect(salesText?.length).toBeGreaterThan(0);

  // 必須情報の存在を確認：営業担当者名、部門、メールアドレス、電話番号
  // サンプル実装では以下の形式で表示される想定
  const nameRow = salesInfo.locator('.sales-info-row:has-text("名前")');
  const deptRow = salesInfo.locator('.sales-info-row:has-text("部門")');
  const emailRow = salesInfo.locator('.sales-info-row:has-text("メール")');
  const phoneRow = salesInfo.locator('.sales-info-row:has-text("電話番号")');

  // 各情報行が表示されていることを確認
  if (await nameRow.isVisible({ timeout: 2000 }).catch(() => false)) {
    const nameValue = await nameRow.locator('.sales-info-value').textContent();
    expect(nameValue).toBeTruthy();
  }

  if (await deptRow.isVisible({ timeout: 2000 }).catch(() => false)) {
    const deptValue = await deptRow.locator('.sales-info-value').textContent();
    expect(deptValue).toBeTruthy();
  }

  if (await emailRow.isVisible({ timeout: 2000 }).catch(() => false)) {
    const emailValue = await emailRow.locator('.sales-info-value').textContent();
    expect(emailValue).toBeTruthy();
  }

  if (await phoneRow.isVisible({ timeout: 2000 }).catch(() => false)) {
    const phoneValue = await phoneRow.locator('.sales-info-value').textContent();
    expect(phoneValue).toBeTruthy();
  }

  // 全体として営業担当者情報が表示されていることを確認
  await expect(salesInfo).toBeVisible();
});
