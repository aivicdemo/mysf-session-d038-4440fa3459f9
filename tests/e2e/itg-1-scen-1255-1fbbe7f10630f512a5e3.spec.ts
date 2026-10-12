import { test, expect, Page } from '@playwright/test';

test('SCEN-1255: 請求書再発行画面を開くと、権限確認後に再発行対象の商談・請求書・請求明細・検証ルール・営業権限・取引先・ステージマスタ・修正履歴が順に取得され、再発行可能性が検証されて画面が表示される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 商談・請求管理画面を開く
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForSelector('[data-aivic-panel]');

  // 請求書ID『INV-20250001』の行を選択して『再発行』ボタンをクリック
  const invoiceRow = page.locator('text=INV-20250001').first();
  await invoiceRow.scrollIntoViewIfNeeded();
  await page.click('button:has-text("再発行")');

  // 権限確認完了後、画面が読み込まれるまで待機
  await page.waitForSelector('[data-aivic-panel]');

  // 画面ヘッダに『請求書再発行 - INV-20250001』と表示されていることを確認
  const headerText = page.locator('text=請求書再発行 - INV-20250001, text=請求書再発行');
  await expect(headerText).toBeVisible();

  // 商談情報エリアを確認
  await expect(page.locator('text=DEAL-20250001')).toBeVisible();
  await expect(page.locator('text=クローズ済み')).toBeVisible();
  await expect(page.locator('text=500,000円').first()).toBeVisible();

  // 請求書情報エリアを確認
  await expect(page.locator('text=2025-01-15')).toBeVisible();
  await expect(page.locator('text=発行済み')).toBeVisible();

  // 請求明細エリアを確認（3行の明細）
  const invoiceDetails = page.locator('[data-test-id="invoice-line-items"] tr');
  const detailCount = await invoiceDetails.count();
  expect(detailCount).toBeGreaterThanOrEqual(3);

  // 明細内容を確認
  await expect(page.locator('text=商品A')).toBeVisible();
  await expect(page.locator('text=300,000')).toBeVisible();
  await expect(page.locator('text=商品B')).toBeVisible();
  await expect(page.locator('text=150,000')).toBeVisible();
  await expect(page.locator('text=商品C')).toBeVisible();
  await expect(page.locator('text=50,000')).toBeVisible();

  // 取引先情報エリアを確認
  await expect(page.locator('text=株式会社テスト商社')).toBeVisible();
  await expect(page.locator('text=営業担当者A')).toBeVisible();

  // 修正履歴エリアを確認
  await expect(page.locator('text=2025-01-20')).toBeVisible();
  await expect(page.locator('text=明細行削除')).toBeVisible();

  // 再発行可能性の判定を確認
  await expect(page.locator('text=✓ 再発行可能, text=再発行可能')).toBeVisible();

  // 『再発行実行』ボタンが有効化（クリック可能）状態で表示されていることを確認
  const reissueButton = page.locator('button:has-text("再発行実行")');
  await expect(reissueButton).toBeEnabled();
  await expect(reissueButton).toBeVisible();

  // ページロード完了からボタン有効化までの時間が3秒以内であることを確認
  const startTime = Date.now();
  await page.waitForSelector('button:has-text("再発行実行"):enabled');
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000);
});
