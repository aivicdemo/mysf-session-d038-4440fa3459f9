import { test, expect } from '@playwright/test';

test('SCEN-424: 認可ユーザーが参照関係可視化ボタンを操作すると、ユーザー認証・ロール検証を経て次の処理へ進む', async ({ page }) => {
  await page.goto('/panels/scr-1791354749663.html');

  // ユーザーが『参照関係可視化』ボタンをクリック
  const vizButton = page.locator('[data-role="reference-visualization-btn"]');
  await expect(vizButton).toBeVisible();
  await vizButton.click();

  // ボタン押下直後、ユーザー認証が実行されることを確認（認証メッセージ・プログレス表示）
  const authProgress = page.locator('[data-role="auth-progress"]');
  await expect(authProgress).toBeVisible();

  // 認証完了後、ロール検証の実行を確認
  const roleCheckProgress = page.locator('[data-role="role-check-progress"]');
  await roleCheckProgress.waitFor({ state: 'visible', timeout: 5000 });

  // ロール検証完了後、参照関係データ取得処理が呼び出される（ローディング表示）
  const dataLoadingIndicator = page.locator('[data-role="loading-indicator"]');
  await expect(dataLoadingIndicator).toBeVisible();

  // 最終的に参照関係可視化ダイアログが開く
  const visualizationDialog = page.locator('[data-role="visualization-dialog"]');
  await visualizationDialog.waitFor({ state: 'visible', timeout: 10000 });

  // ダイアログに参照関係データが表示されることを確認
  const invoiceNode = page.locator('[data-entity="Invoice"]');
  const invoiceLineNode = page.locator('[data-entity="InvoiceLine"]');

  await expect(invoiceNode).toBeVisible();
  await expect(invoiceLineNode).toBeVisible();

  // 関連線（マスター詳細関係）の表示を確認
  const relationshipLine = page.locator('[data-relationship-type="master-detail"]');
  await expect(relationshipLine).toBeVisible();
});
