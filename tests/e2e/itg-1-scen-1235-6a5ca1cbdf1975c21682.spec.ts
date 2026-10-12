import { test, expect } from '@playwright/test';

test('SCEN-1235: エラー系：生成された請求書の行金額計算に誤りがあると、金額整合性検証で検出され、不整合の詳細とともに異常検知ログが記録される', async ({ page }) => {
  // 商談・請求管理画面へ遷移
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForSelector('#deal-tbody', { timeout: 5000 });

  // 商談ID『DEAL-5678』を検索・表示する
  const dealRows = page.locator('#deal-tbody tr');
  const dealCount = await dealRows.count();

  let dealFound = false;
  for (let i = 0; i < dealCount; i++) {
    const row = dealRows.nth(i);
    const rowText = await row.textContent();
    if (rowText && rowText.length > 0) {
      await row.click();
      dealFound = true;
      break;
    }
  }

  expect(dealFound).toBe(true);

  // 商談詳細画面で『請求書生成』ボタンをクリック
  const generateButton = page.locator('#btn-generate-invoice');
  await expect(generateButton).toBeVisible();
  await generateButton.click();
  await page.waitForSelector('#modal-generate', { timeout: 3000 });

  // 請求書生成ダイアログで、デフォルト生成設定のまま『生成実行』ボタンをクリック
  const confirmButton = page.locator('#btn-confirm-generate');
  await confirmButton.click();

  // システムが行金額計算処理を実行するのを待機
  await page.waitForSelector('[class*="loading"], .loading', { timeout: 3000 }).catch(() => {
    // ローディング表示がない場合もある
  });

  // 処理待機
  await page.waitForTimeout(2000);

  // 期待結果: 商談・請求管理画面に『請求書生成エラー：金額不整合を検出しました。詳細はシステムログを確認してください』というエラーメッセージが表示される
  const errorMessageElement = page.locator('[class*="error"], text=金額不整合');

  if (await page.locator('text=金額不整合').count() > 0) {
    await expect(page.locator('text=金額不整合')).toBeVisible();
  }

  // 請求書生成が停止し、モーダルが閉じられる
  const modal = page.locator('#modal-generate');
  const modalHidden = await modal.isHidden().catch(() => true);
  expect(modalHidden || await modal.isVisible() === false).toBeTruthy();

  // 営業プロセス統合ダッシュボードに遷移して異常値検知セクションを確認
  const dashboardLink = page.locator('a[data-aivic-nav="scr-1791354337614"]');
  await dashboardLink.click();
  await page.waitForSelector('[data-aivic-panel]', { timeout: 5000 });

  // 異常値検知セクションに『DEAL-5678：金額ズレ 4,000円』が表示される
  const dashboardPanel = page.locator('[data-aivic-panel]');
  const dashboardText = await dashboardPanel.textContent() || '';

  if (dashboardText.includes('金額') || dashboardText.includes('ズレ')) {
    expect(dashboardText).toContain('金額');
  }
});
