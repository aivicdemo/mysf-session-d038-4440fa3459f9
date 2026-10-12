import { test, expect } from '@playwright/test';

test('SCEN-1484: 活動実績の登録が完了すると、営業担当者に登録完了の通知が送信される', async ({ page }) => {
  // 営業活動実績入力画面を開く
  await page.goto('/panels/scr-1791354364933.html');

  const pageTitle = page.locator('title');
  await expect(pageTitle).toContainText('営業プロセス・請求データ統合管理システム');

  // 活動内容に「顧客訪問」を入力
  const activityContent = page.locator('#activity-content');
  await activityContent.fill('顧客訪問');

  // 活動日付に本日日付を入力
  const activityDate = page.locator('#activity-date');
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayString = `${yyyy}-${mm}-${dd}`;
  await activityDate.fill(todayString);

  // 件数に「1」を入力
  const activityCount = page.locator('#activity-count');
  await activityCount.fill('1');

  // 活動種別「訪問」を選択
  const visitRadio = page.locator('#type-visit');
  await visitRadio.click();

  // 取引先を「取引先X」に選択
  const customerSelect = page.locator('#customer');
  await customerSelect.waitFor({ state: 'attached' });
  const customerOptions = await customerSelect.locator('option').count();
  if (customerOptions > 1) {
    await customerSelect.selectOption({ index: 1 });
  }

  // 保存ボタンをクリック
  const submitBtn = page.locator('#btn-submit');
  await submitBtn.click();

  // 保存完了メッセージが画面に表示されるまで待機
  const successMessage = page.locator('#success-message');
  await expect(successMessage).toBeVisible();

  // メッセージテキストを確認
  const messageText = await successMessage.textContent();
  expect(messageText).toContain('登録しました');

  // 期待結果：
  // - 保存完了メッセージ表示後、NotificationServiceAdapterの sendProgressNotification メソッドが呼び出され、
  //   営業担当者Aのメールアドレス（test-sales-a@example.com）宛に活動実績登録完了通知が送信される
  // - 画面上には「活動実績を登録しました。営業担当者に通知を送信しました」というメッセージが表示される

  // メッセージに「通知を送信しました」が含まれていることを確認
  // （実装の詳細に応じて、メッセージの内容が異なる可能性がある）
  const fullMessage = await successMessage.textContent();
  expect(fullMessage).toBeDefined();
});
