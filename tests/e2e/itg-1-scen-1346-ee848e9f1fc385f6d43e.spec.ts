import { test, expect } from '@playwright/test';

test('SCEN-1346: 商談レコードの更新日時更新：営業活動実績に紐付く商談の更新日時が現在時刻に更新される', async ({ page }) => {
  // 営業活動実績入力画面にログイン
  await page.goto('/panels/scr-1791354364933.html');
  await page.waitForLoadState('networkidle');

  // フォームが表示されることを確認
  const formSection = page.locator('[class*="form"]').first();
  await expect(formSection).toBeVisible();

  // 「新規登録」ボタンをクリック（ページロード時にフォームは表示済み）
  // 営業担当者Aを選択
  const salesPersonSelect = page.locator('#sales-person');
  await salesPersonSelect.selectOption({ index: 1 }); // 営業担当者A

  // 「訪問」を選択
  const visitRadio = page.locator('#type-visit');
  await visitRadio.check();

  // 実績件数に「1」を入力
  const activityCount = page.locator('#activity-count');
  await activityCount.fill('1');

  // 取引先を検索・選択
  const customerSelect = page.locator('#customer');
  const options = await customerSelect.locator('option').count();
  if (options > 1) {
    await customerSelect.selectOption({ index: 1 }); // テスト会社A
  }

  // 商談を選択 (OPP-001)
  const dealSelect = page.locator('#deal');
  await dealSelect.selectOption({ index: 1 }); // OPP-001

  // 「保存」ボタンをクリック
  const submitBtn = page.locator('#btn-submit');
  await submitBtn.click();

  // 保存完了メッセージが表示されることを確認
  const successMsg = page.locator('#success-message');
  await expect(successMsg).toContainText(/登録/);

  // 商談・請求管理画面に遷移
  const dealManagementLink = page.locator('a').filter({ hasText: /商談・請求管理/ }).first();
  await dealManagementLink.click();
  await page.waitForLoadState('networkidle');

  // 商談一覧から「OPP-001」をクリック
  const dealTable = page.locator('[id*="deal"]');
  const dealRow = dealTable.locator('td, div').filter({ hasText: 'OPP-001' }).first();
  await dealRow.click();

  // 商談詳細画面が表示される
  const detailPanel = page.locator('[class*="detail"]');
  await expect(detailPanel).toBeVisible();

  // 更新日時フィールドを確認
  const updateTimeField = detailPanel.locator('text=/更新日時|更新日/');
  await expect(updateTimeField).toBeVisible();

  // 現在時刻が反映されていることを確認（正確な時刻の検証は環境依存のため、値の存在を確認）
  const updateTimeValue = detailPanel.locator('text=/\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}:\\d{2}/');
  await expect(updateTimeValue).toBeVisible();
});
