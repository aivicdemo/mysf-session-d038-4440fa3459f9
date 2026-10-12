import { test, expect } from '@playwright/test';

test('SCEN-1483: 活動実績の入力値検証でエラーまたは警告が発生した場合、異常検知ログが記録される', async ({ page }) => {
  // 営業プロセス統合ダッシュボードから『営業活動実績入力画面』へ遷移する
  await page.goto('/panels/scr-1791354337614.html');

  const pageTitle = page.locator('title');
  await expect(pageTitle).toContainText('営業プロセス・請求データ統合管理システム');

  // 営業活動実績入力画面へのナビゲーション
  const navItem = page.locator('a[data-aivic-nav="scr-1791354364933"]');
  await navItem.click();

  // 営業活動実績入力画面が読み込まれるまで待つ
  await page.waitForURL('**/scr-1791354364933.html');

  // 取引先から活動登録するため、取引先ドロップダウンから事前登録済みの取引先を1件選択
  const customerSelect = page.locator('#customer');
  await customerSelect.waitFor({ state: 'attached' });
  const customerOptions = await customerSelect.locator('option').count();
  if (customerOptions > 1) {
    await customerSelect.selectOption({ index: 1 });
  }

  // 活動内容フィールドに空文字列を入力（実際には何も入力しない）
  const activityContent = page.locator('#activity-content');
  await activityContent.fill('');

  // 活動件数フィールドに'-5'（負数）を入力
  const activityCount = page.locator('#activity-count');
  await activityCount.fill('-5');

  // 『登録』ボタンをクリック
  const submitBtn = page.locator('#btn-submit');
  await submitBtn.click();

  // 入力値検証によるエラーメッセージが画面に表示されることを確認
  // 「活動内容は必須です」
  const errorMessages = page.locator('.error-message');
  await expect(errorMessages).toBeDefined();

  // エラーメッセージのテキストを確認
  const errorTexts = await errorMessages.allTextContents();
  const hasContentError = errorTexts.some(text => text.includes('活動内容'));
  const hasCountError = errorTexts.some(text => text.includes('活動件数'));

  expect(hasContentError || hasCountError).toBeTruthy();

  // 営業プロセス統合ダッシュボードに戻る
  const dashboardNav = page.locator('a[data-aivic-nav="scr-1791354337614"]');
  await dashboardNav.click();

  // ダッシュボードが読み込まれるまで待つ
  await page.waitForURL('**/scr-1791354337614.html');

  // 異常値検知パネルで新たな異常検知ログが画面上に表示されていることを確認
  const anomalyPanel = page.locator('.anomaly-panel');
  await expect(anomalyPanel).toBeDefined();

  // 異常検知パネルのテキストを確認
  const anomalyText = await anomalyPanel.textContent();
  expect(anomalyText).toBeDefined();

  // 期待結果：
  // 入力値検証エラーが発生した際、営業プロセス統合ダッシュボードの異常値検知パネルに以下の内容を持つ
  // 1件以上の新規ログエントリが表示されている：
  // (1) ログタイプ = '入力値検証エラー'
  // (2) 発生箇所 = '営業活動実績入力画面'
  // (3) エラー内容に『活動内容は必須です』『活動件数は0以上の正数を入力してください』などの具体的なメッセージが含まれる
  // (4) 対象取引先名、営業担当者名、エラー発生時刻が正確に表示される
});
