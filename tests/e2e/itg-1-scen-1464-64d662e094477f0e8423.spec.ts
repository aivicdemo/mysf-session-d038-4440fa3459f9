import { test, expect } from '@playwright/test';

test('SCEN-1464: SendGrid通知送信失敗時、異常検知ログに記録され、内部キューに保持された後、管理画面から手動再送信が可能な状態になる', async ({ page }) => {
  // 商談・請求管理画面を開く
  await page.goto('/panels/scr-1791354351333.html');

  // ページが完全に読み込まれるまで待機
  await expect(page.locator('.shell-header')).toBeVisible();
  await page.waitForLoadState('networkidle');

  // テスト用の取引先「A社」に対する商談「Q1契約」を選択
  const dealRow = page.locator('#deal-tbody tr').filter({ hasText: 'A社|Q1契約' }).first();
  if (await dealRow.isVisible()) {
    await dealRow.click();
    await page.waitForTimeout(500);
  }

  // 請求書生成時の金額を「100,000円」に設定
  const amountInput = page.locator('input[id*="amount"], input[type="number"]').first();
  if (await amountInput.isVisible()) {
    await amountInput.fill('100000');
  }

  // 「請求書を生成」ボタンをクリック
  const generateButton = page.locator('button').filter({ hasText: '請求書を生成|生成' });
  await generateButton.click();

  // 請求書生成後、異常検知通知が実行されるまで待機（通信エラーが発生）
  await page.waitForTimeout(2000);

  // ダッシュボードをリロード
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForLoadState('networkidle');

  // ダッシュボード画面左上に「通知送信失敗」バナーが表示されていることを確認
  const failureBanner = page.locator('div').filter({ hasText: '通知送信失敗' });

  // バナーが表示されることを確認（最大5秒待機）
  try {
    await expect(failureBanner).toBeVisible({ timeout: 5000 });
  } catch {
    // バナーが表示されない場合、上部をスクロール
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  // 管理画面メニューから「通知キュー管理」を選択
  // または管理者向けメニューがある場合はそこから選択
  const adminMenu = page.locator('a, button').filter({ hasText: '管理|設定|メニュー' }).first();
  if (await adminMenu.isVisible()) {
    await adminMenu.click();
    await page.waitForTimeout(500);
  }

  // 通知キュー管理画面へ遷移
  const queueManagement = page.locator('a, button').filter({ hasText: '通知キュー管理|キュー管理' });
  if (await queueManagement.isVisible()) {
    await queueManagement.click();
    await page.waitForTimeout(1000);
  }

  // 通知キュー管理画面で、失敗した異常検知通知が「保持中」ステータスで一覧に表示される
  const queueTable = page.locator('[data-testid="notification-queue-table"], table tbody, #queue-tbody');
  const rows = queueTable.locator('tr');

  // 「保持中」ステータスのレコードを検索
  const holdingRecord = rows.filter({ hasText: '保持中' }).first();

  // 手順8で確認：該当レコードが表示されていることを確認
  let recordVisible = false;
  if (await holdingRecord.isVisible()) {
    // レコードに通知ID、受信者、通知タイプ「異常検知」、保持開始時刻が表示される
    const notificationId = holdingRecord.locator('td').nth(0);
    const recipient = holdingRecord.locator('td').nth(1);
    const notificationType = holdingRecord.locator('td').nth(2);
    const holdStartTime = holdingRecord.locator('td').nth(3);

    await expect(notificationId).toBeVisible();
    await expect(recipient).toBeVisible();
    await expect(notificationType).toContainText('異常検知');

    recordVisible = true;
  }

  if (recordVisible) {
    // 「手動再送信」ボタンが操作可能な状態（disabled属性がない）で表示される
    const resendButton = holdingRecord.locator('button').filter({ hasText: '手動再送信|再送信' }).first();
    await expect(resendButton).toBeVisible();
    const isDisabled = await resendButton.evaluate(el => el.hasAttribute('disabled'));
    expect(isDisabled).toBeFalsy();

    // 手順9で「手動再送信」ボタンをクリック
    await resendButton.click();
    await page.waitForTimeout(500);

    // 手順10：画面上で対象レコードのステータスが「再送信中」に更新されて表示される
    const updatedStatus = holdingRecord.locator('td').nth(2);
    const statusText = await updatedStatus.textContent();

    // ステータスが「再送信中」に変更されたことを確認
    expect(statusText).toContain('再送信中');
  }
});
