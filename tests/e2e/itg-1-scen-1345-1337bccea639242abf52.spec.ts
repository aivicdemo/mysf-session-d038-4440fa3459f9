import { test, expect } from '@playwright/test';

test('SCEN-1345: 営業担当者情報の確認・更新：営業活動実績保存時に、営業担当者の基本情報が確認され、必要に応じて更新される', async ({ page }) => {
  // 営業プロセス統合ダッシュボードにアクセス
  await page.goto('/panels/scr-1791354337614.html');

  // ページが読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // ダッシュボードが表示されることを確認
  const dashboardTitle = page.locator('h1, [class*="title"]').first();
  await expect(dashboardTitle).toBeVisible();

  // 営業活動実績入力画面へ遷移
  const activityInputLink = page.locator('a').filter({ hasText: /営業活動実績入力/ }).first();
  await activityInputLink.click();
  await page.waitForLoadState('networkidle');

  // 営業活動実績入力画面が表示されることを確認
  const formSection = page.locator('[class*="form"]').first();
  await expect(formSection).toBeVisible();

  // 取引先を選択
  const customerSelect = page.locator('#customer');
  await customerSelect.selectOption('ACC001');

  // 活動内容を入力
  const activityTypeVisit = page.locator('#type-visit');
  await activityTypeVisit.check();

  // 件数を入力
  const activityCount = page.locator('#activity-count');
  await activityCount.fill('1');

  // 実施日を設定（本日）
  const activityDate = page.locator('#activity-date');
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayString = `${yyyy}-${mm}-${dd}`;
  await activityDate.fill(todayString);

  // 保存ボタンをクリック
  const submitBtn = page.locator('#btn-submit');
  await submitBtn.click();

  // 成功メッセージが表示されることを確認
  const successMsg = page.locator('#success-message');
  await expect(successMsg).toContainText(/登録/);

  // ダッシュボードに遷移
  const dashboardLink = page.locator('a').filter({ hasText: /ダッシュボード/ }).first();
  await dashboardLink.click();
  await page.waitForLoadState('networkidle');

  // 営業担当者SALES001の基本情報が表示されることを確認
  // 名前：山田太郎、部門：東京営業部、メール：yamada.taro@company.com、ステータス：有効
  const dashboardContent = page.locator('[data-aivic-panel]');
  await expect(dashboardContent).toContainText('山田太郎');
  await expect(dashboardContent).toContainText('東京営業部');
  await expect(dashboardContent).toContainText('yamada.taro@company.com');
  await expect(dashboardContent).toContainText('有効');

  // 営業活動実績がダッシュボードの活動実績一覧に表示されることを確認
  const activityTable = page.locator('[id*="activity"]');
  await expect(activityTable).toContainText('顧客訪問');

  // 顧客・取引先管理画面に遷移
  const customerLink = page.locator('a').filter({ hasText: /顧客・取引先管理/ }).first();
  await customerLink.click();
  await page.waitForLoadState('networkidle');

  // テスト商事株式会社と営業担当者の関連付けが確認できることを確認
  const customerContent = page.locator('[data-aivic-panel]');
  await expect(customerContent).toContainText('テスト商事株式会社');
});
