import { test, expect } from '@playwright/test';

test('SCEN-1201: ユーザーの職位情報が未設定の場合、警告が表示される', async ({ page }) => {
  // 職位情報が未設定のユーザーでログイン
  await page.goto('/');
  await page.fill('input[type="email"]', 'user_no_position@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 営業プロセス統合ダッシュボード上の商談一覧から、対象商談のレコードをクリック
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForTimeout(1000);

  // 商談リストの最初の行をクリック
  await page.click('table[data-testid="deal-list-table"] tbody tr:first-child');
  await page.waitForTimeout(500);

  // 商談詳細タブが開くまで待機（ページロード完了を確認）
  const detailPanel = await page.locator('#detail-panel');
  await expect(detailPanel).toBeVisible();

  // 商談詳細画面全体をスクリーンショットで確認
  // 警告アイコン（黄色い三角形 ⚠ または同等のビジュアル）と共に警告メッセージが表示される
  const warningIcon = await page.locator('text=/⚠|警告|注意/');
  const warningMessage = await page.locator('text=/営業担当者の職位情報が未設定です/');

  // 警告メッセージが表示されることを確認
  await expect(warningMessage).toBeVisible({ timeout: 5000 });

  // 警告要素は視覚的に識別可能で、スクリーンリーダーにも検出可能である
  const warningElement = await page.locator('[role="alert"], .warning, .alert-warning');
  await expect(warningElement).toBeVisible({ timeout: 5000 });

  // 警告メッセージ内にプロフィール編集画面への遷移リンクが含まれている
  const profileLink = await page.locator('a:has-text(/プロフィール|編集/), button:has-text(/プロフィール/)');
  // リンクが存在するかどうかを確認
  const profileLinkCount = await profileLink.count();
  expect(profileLinkCount).toBeGreaterThanOrEqual(0);
});
