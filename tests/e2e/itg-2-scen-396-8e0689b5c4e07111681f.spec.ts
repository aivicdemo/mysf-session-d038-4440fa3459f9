import { test, expect } from '@playwright/test';

test('SCEN-396: 機能マッピング表生成 - 認証・ロール権限を満たさないユーザーが拒否される', async ({ page }) => {
  // 機能マッピング管理画面にアクセスする
  await page.goto('/panels/scr-1791354749663.html');

  // ページが読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // 画面に表示されている『機能マッピング表を生成』ボタンをクリックする
  const generateButton = page.locator('[data-testid="generate-mapping-button"]');
  await generateButton.click();

  // システムがユーザーの認証情報とロール権限を検証する処理が実行されるまで待機
  await page.waitForTimeout(500);

  // エラーメッセージが表示されることを確認する
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();

  // エラーメッセージが「このアクション実行に必要な権限がありません」または「セッションが無効です。再度ログインしてください」のいずれかであることを確認
  const errorText = await errorMessage.textContent();
  expect(errorText).toMatch(/このアクション実行に必要な権限がありません|セッションが無効です。再度ログインしてください/);

  // 機能マッピング表の生成処理は開始されていないことを確認する
  const mappingResultSection = page.locator('[data-testid="mapping-result-section"]');
  await expect(mappingResultSection).not.toBeVisible();

  // 画面はエラー前の状態を保ち、遷移していないことを確認
  const currentUrl = page.url();
  expect(currentUrl).toContain('scr-1791354749663.html');
});
