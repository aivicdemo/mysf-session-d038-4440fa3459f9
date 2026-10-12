import { test, expect } from '@playwright/test';

test('SCEN-1333: 対象責任者の検証 - 登録済みマスタに存在しない責任者IDが拒否される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  const loginButton = page.locator('button.login-button');
  await loginButton.click();

  // ダッシュボードから営業活動実績入力画面へ遷移
  await page.waitForURL('**/panels/scr-1791354337614.html');
  const activityInputNavLink = page.locator('a[href*="scr-1791354364933"]');
  await activityInputNavLink.click();
  await page.waitForURL('**/panels/scr-1791354364933.html');

  // 営業活動実績入力画面で、対象責任者フィールドのドロップダウンをクリック
  const responsiblePersonField = page.locator('#responsible-person, [data-testid="responsible-person"]');
  await responsiblePersonField.click();

  // 責任者IDの直接入力またはマスタ検索機能を使用して、存在しない責任者ID「RESP-99999」を入力
  await responsiblePersonField.fill('RESP-99999');

  // 入力完了後、画面の「保存」ボタンをクリック
  const submitButton = page.locator('#btn-submit');
  await submitButton.click();

  // システムがバリデーション処理を実行し、保存処理が拒否される
  // 画面上に赤色のエラーメッセージが表示される
  const errorContainer = page.locator('.error-container, .alert-error, [role="alert"]');
  await expect(errorContainer).toContainText(/指定された責任者IDはマスタに存在しません|正しい責任者を選択してください/);

  // フォーム入力値は保持され、対象責任者フィールドには入力した値「RESP-99999」が残っている
  const responsiblePersonValue = await responsiblePersonField.inputValue();
  expect(responsiblePersonValue).toBe('RESP-99999');

  // 営業活動実績はデータベースに保存されない（画面が遷移していない）
  expect(page.url()).toContain('scr-1791354364933');

  // 画面は営業活動実績入力画面のままで、ダッシュボード画面への遷移は発生しない
  expect(page.url()).not.toContain('scr-1791354337614');
});
