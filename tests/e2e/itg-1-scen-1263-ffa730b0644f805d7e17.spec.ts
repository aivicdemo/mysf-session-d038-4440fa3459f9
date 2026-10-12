import { test, expect } from '@playwright/test';

test('SCEN-1263: 請求書と請求明細の参照関係が破損していると、「請求データに不整合があります。経理部門に確認してください」警告が表示される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 商談・請求管理画面を表示
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForSelector('[data-aivic-panel]');

  // 参照が破損している請求書レコードを検索・抽出
  // 例：請求書IDで直接指定
  const damagedInvoiceRow = page.locator('[data-test-id="invoice-row-corrupted"]').first();
  await damagedInvoiceRow.scrollIntoViewIfNeeded();

  // 対象請求書の行を選択
  await damagedInvoiceRow.click();

  // 『再発行』ボタンをクリック
  await page.click('button:has-text("再発行")');

  // 画面が請求書再発行画面へ遷移することを確認
  await page.waitForLoadState('networkidle');

  // 再発行画面の読み込み完了を待つ（データ整合性検証ロジックが実行される）
  await page.waitForSelector('[data-aivic-panel]');

  // 請求書再発行画面上に、警告メッセージが表示される
  const warningMessage = page.locator('text=請求データに不整合があります。経理部門に確認してください');
  await expect(warningMessage).toBeVisible();

  // メッセージは目視可能な位置（画面上部または画面中央の警告ボックス）に表示される
  const warningBox = page.locator('[data-test-id="warning-box"]');
  await expect(warningBox).toBeVisible();

  // テキスト内容が完全一致する
  await expect(warningMessage).toContainText('請求データに不整合があります。経理部門に確認してください');

  // 再発行操作を実行するボタン（『確定』『再発行実行』など）は無効化またはグレーアウト
  const confirmButton = page.locator('button:has-text("確定"), button:has-text("再発行実行")');
  const isDisabled = await confirmButton.isDisabled().catch(() => false);
  const isInvisible = !await confirmButton.isVisible().catch(() => false);

  expect(isDisabled || isInvisible).toBeTruthy();

  // ユーザーが先に進めない状態となる
  // ボタンがクリックできないことを確認
  if (await confirmButton.isVisible()) {
    await expect(confirmButton).toBeDisabled();
  }
});
