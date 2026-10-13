import { test, expect } from '@playwright/test';

test('SCEN-401: 機能マッピング表生成 - Salesforceオブジェクト間の参照関係が整合していれば検証に合格する', async ({ page }) => {
  // 機能マッピング管理画面を開く
  await page.goto('/panels/scr-1791354749663.html');
  await page.waitForLoadState('networkidle');

  // ページ上部の「参照関係検証」ボタンをクリックする
  const referenceValidateButton = page.locator('[data-testid="reference-relationship-validate-button"]');
  await referenceValidateButton.click();

  // バックエンドが参照関係の対応関係を確認する処理を待つ（検証処理の完了まで最大10秒）
  const validationResult = page.locator('[data-testid="reference-relationship-validation-result"]');
  await expect(validationResult).toBeVisible({ timeout: 10000 });

  // 検証結果が画面に表示されるまで待機する
  const statusMessage = page.locator('[data-testid="validation-status-message"]');
  await expect(statusMessage).toBeVisible();

  // 画面上に「参照関係検証: 合格」というステータスメッセージが表示される
  const statusText = await statusMessage.textContent();
  expect(statusText).toContain('参照関係検証');
  expect(statusText).toContain('合格');

  // Salesforce側: 請求書→商談、請求明細→請求書、請求明細→商談商品の3つの参照関係が列挙
  const sfReferences = page.locator('[data-testid="sf-reference-list"]');
  await expect(sfReferences).toBeVisible();

  const sfReferenceItems = page.locator('[data-testid="sf-reference-item"]');
  const sfReferenceCount = await sfReferenceItems.count();
  expect(sfReferenceCount).toBeGreaterThanOrEqual(3);

  // 移行対象システム側: 請求→発注、請求明細→請求、請求明細→発注明細の3つの参照関係が列挙
  const targetReferences = page.locator('[data-testid="target-reference-list"]');
  await expect(targetReferences).toBeVisible();

  const targetReferenceItems = page.locator('[data-testid="target-reference-item"]');
  const targetReferenceCount = await targetReferenceItems.count();
  expect(targetReferenceCount).toBeGreaterThanOrEqual(3);

  // 対応関係: 各参照関係ペアに対して「✓ マッピング済み」と表示
  const mappedIndicators = page.locator('[data-testid="mapped-indicator"]');
  const mappedCount = await mappedIndicators.count();
  expect(mappedCount).toBeGreaterThan(0);

  // 「次工程へ進む」ボタンが有効（クリック可能）状態に変わる
  const nextPhaseButton = page.locator('[data-testid="next-phase-button"]');
  await expect(nextPhaseButton).toBeVisible();
  await expect(nextPhaseButton).toBeEnabled();

  // ユーザーが当該ボタンをクリックすると機能マッピング表生成画面へ画面遷移が成立する
  const currentUrl = page.url();
  await nextPhaseButton.click();
  await page.waitForNavigation();
  const newUrl = page.url();
  expect(newUrl).not.toEqual(currentUrl);
});
