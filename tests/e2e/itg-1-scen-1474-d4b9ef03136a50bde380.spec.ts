import { test, expect } from '@playwright/test';

test('SCEN-1474: 対象取引先責任者が登録済みマスタに存在しない、または指定取引先に所属していない状態で保存しようとすると、検証エラーとなり保存が拒否される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 営業活動実績入力画面へ移動
  await page.goto('/panels/scr-1791354364933.html');
  await page.waitForLoadState('domcontentloaded');

  // 取引先欄に「取引先A」を選択
  const customerSelect = page.locator('select#customer');
  await customerSelect.selectOption({ label: '取引先A' });

  // 対象取引先責任者欄に「責任者X」（取引先A に所属していない登録済み責任者）を入力
  // ドロップダウンから選択を試みる
  const responsiblePersonInput = page.locator('#responsible-person');
  await responsiblePersonInput.click();

  // 責任者X を検索
  const responsiblePersonOptions = page.locator('select#responsible-person option');
  const responsiblePersonXOption = responsiblePersonOptions.filter({ has: page.locator('text=責任者X') });

  // 選択肢があればそれを選択、なければ入力
  if ((await responsiblePersonXOption.count()) > 0) {
    await page.locator('select#responsible-person').selectOption({ label: '責任者X' });
  } else {
    await responsiblePersonInput.fill('責任者X');
  }

  // 保存ボタンをクリック
  await page.click('button:has-text("保存")');

  // 検証エラーメッセージが表示されることを確認
  const errorMessage = page.locator('text=この取引先責任者は選択された取引先に所属していません');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toHaveCSS('color', /red|rgb\(255,\s*0,\s*0\)/);

  // 保存処理が実行されず、画面は営業活動実績入力画面のままで遷移しない
  const currentUrl = page.url();
  expect(currentUrl).toContain('scr-1791354364933.html');

  // 同じ画面が表示されていることを確認
  const formTitle = page.locator('h1, [role="heading"]');
  const titleText = await formTitle.first().textContent();
  expect(titleText).toContain('営業活動実績');
});
