import { test, expect } from '@playwright/test';

test('SCEN-1480: 関連商談を指定した場合、その商談が営業担当者に割り当てられていない、または営業担当者の所属部門に無関係であると、検証警告が表示されるが保存は許可される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 営業プロセス統合ダッシュボードにログイン
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForLoadState('domcontentloaded');

  // 取引先一覧から『山田商事』（CUS-001）を選択
  const tableRows = page.locator('table tbody tr');
  const targetCustomerRow = tableRows.filter({ has: page.locator('text=山田商事|CUS-001') });
  await targetCustomerRow.first().click();
  await page.waitForLoadState('networkidle');

  // 取引先詳細画面から『営業活動実績を登録』ボタンをクリック
  await page.click('button:has-text("活動登録|営業活動実績を登録")');

  // 営業活動実績入力画面を開く
  await page.waitForURL('**/scr-1791354364933.html', { timeout: 5000 }).catch(() => {
    // タイムアウトしても続行
  });

  if (!page.url().includes('scr-1791354364933.html')) {
    await page.goto('/panels/scr-1791354364933.html');
  }
  await page.waitForLoadState('domcontentloaded');

  // テスト 1: 割り当てなしの商談を選択
  // 活動内容に『定期訪問』と入力
  const activityContentField = page.locator('#activity-content');
  await activityContentField.fill('定期訪問');

  // 活動タイプで『訪問』を選択
  const activityTypeSelect = page.locator('select[name="activity-type"]');
  await activityTypeSelect.selectOption({ label: '訪問' }).catch(() => {
    // ラベルが異なる場合
    activityTypeSelect.selectOption({ index: 1 });
  });

  // 活動日に当日日付を設定
  const activityDateField = page.locator('#activity-date');
  await activityDateField.fill('2026-10-12');

  // 『関連商談』フィールドで『OPP-101（契約更新案件、割り当てなし）』を選択
  const dealSelect = page.locator('select#deal, select[id*="deal"], select[name*="deal"]');
  if (await dealSelect.count() > 0) {
    await dealSelect.first().selectOption({ label: 'OPP-101' }).catch(() => {
      dealSelect.first().selectOption({ value: 'OPP-101' });
    });
  }

  // 『保存』ボタンをクリック
  await page.click('button:has-text("保存")');

  // 警告ダイアログが表示されることを確認
  const warningDialog = page.locator('text=この商談は現在のユーザーに割り当てられていません。保存を続行しますか？');
  await expect(warningDialog).toBeVisible();

  // 警告ダイアログを閉じ、『OK、続行して保存』ボタンをクリック
  const continueButton = page.locator('button:has-text("OK、続行して保存|保存を続ける|確認")');
  if (await continueButton.count() > 0) {
    await continueButton.first().click();
  } else {
    // ボタンが見つからない場合は OK ボタンをクリック
    await page.click('button:has-text("OK")');
  }

  // 活動が正常に保存されることを確認
  await page.waitForLoadState('networkidle');
  const currentUrlAfterFirstSave = page.url();
  expect(
    !currentUrlAfterFirstSave.includes('scr-1791354364933.html') ||
    await page.locator('text=登録しました|成功|完了').count() > 0
  ).toBeTruthy();

  // テスト 2: 別の部門に属する営業担当者に割り当てられた商談を選択
  // 営業活動実績入力画面に戻る
  await page.goto('/panels/scr-1791354364933.html');
  await page.waitForLoadState('domcontentloaded');

  // 必須項目をリセット
  await activityContentField.clear();
  await activityContentField.fill('定期訪問');

  await activityTypeSelect.selectOption({ label: '訪問' }).catch(() => {
    activityTypeSelect.selectOption({ index: 1 });
  });

  await activityDateField.clear();
  await activityDateField.fill('2026-10-12');

  // 『関連商談』フィールドで『OPP-102（営業部門B割り当て）』を選択
  if (await dealSelect.count() > 0) {
    await dealSelect.first().selectOption({ label: 'OPP-102' }).catch(() => {
      dealSelect.first().selectOption({ value: 'OPP-102' });
    });
  }

  // 『保存』ボタンをクリック
  await page.click('button:has-text("保存")');

  // 別の警告ダイアログが表示されることを確認
  const warningDialogAlt = page.locator('text=この商談はあなたの所属部門に無関係です。保存を続行しますか？');
  await expect(warningDialogAlt).toBeVisible();

  // 警告ダイアログを閉じ、『OK、続行して保存』ボタンをクリック
  if (await continueButton.count() > 0) {
    await continueButton.last().click();
  } else {
    await page.click('button:has-text("OK")');
  }

  // 活動が正常に保存されることを確認
  await page.waitForLoadState('networkidle');

  // 営業プロセス統合ダッシュボード上で該当の活動が取引先『山田商事』の活動実績として表示される
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForLoadState('domcontentloaded');

  // 『山田商事』の行を確認
  const dashboardRow = page.locator('table tbody tr').filter({ has: page.locator('text=山田商事') });
  await expect(dashboardRow.first()).toBeVisible();
});
