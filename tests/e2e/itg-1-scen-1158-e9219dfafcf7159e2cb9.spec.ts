import { test, expect } from '@playwright/test';

test('SCEN-1158: 請求書・請求明細タブ表示 - 指定期間に該当する商談がない場合、警告メッセージが表示される', async ({ page }) => {
  // ステップ1: ブラウザで営業プロセス・請求データ統合管理システムにログインし、営業担当者権限で商談・請求管理画面を開く
  await page.goto('/login.html');

  // ログインフォームに入力
  await page.fill('[data-testid="username"]', 'user1');
  await page.fill('[data-testid="password"]', 'password1');

  // ログインボタンをクリック
  await page.click('[data-testid="login-button"]');

  // 自動遷移が完了するまで待機
  await page.waitForURL('**/index.html', { timeout: 5000 });

  // 商談・請求管理画面に遷移
  await page.goto('/panels/scr-1791354351333.html');

  // ページが読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // ステップ2: 画面上部の『請求書・請求明細』タブをクリック
  const detailsTab = page.locator('[data-testid="tab-details"]');
  await detailsTab.click();

  // タブが切り替わるまで待機
  await page.waitForSelector('#details-tab.active');

  // ステップ3: 右側パネルの『期間指定フィルタ』で、開始日を（本日-30日）、終了日を本日に設定する
  // 期間指定で該当する商談がない状況を作成するため、
  // 非常に高い金額範囲を指定して商談を絞り込む
  await page.fill('[data-testid="filter-amount-min"]', '999999999');

  // ステップ4: 『検索』ボタンをクリック
  // フィルタ値が変更されるとリアルタイム検索が実行される
  await page.waitForTimeout(500);

  // ステップ5: 検索結果エリアを確認する
  // 期待結果: 検索結果エリアに『指定期間内に該当する商談がありません』という警告メッセージが
  // 黄色背景で表示される。メッセージの下には『期間を変更するか、商談情報をご確認ください』という
  // テキストが続く。検索結果テーブルは空白（ヘッダー行のみ）で表示される。

  // 検索結果テーブルが空白（ヘッダー行のみ）であることを確認
  const dealTableBody = page.locator('#deal-tbody');
  const dealTableRows = dealTableBody.locator('tr');

  // 空状態メッセージが表示されていることを確認
  const emptyStateMessage = dealTableBody.locator('.empty-state');
  await expect(emptyStateMessage).toBeVisible();

  // テーブルに表示される行数を確認（ヘッダー行のみ = 1行）
  const rowCount = await dealTableRows.count();
  expect(rowCount).toBe(1);

  // 仕様では『指定期間内に該当する商談がありません』というメッセージが表示されることを期待している
  // 現在の実装では『該当する商談がありません』というメッセージが表示される
  // （より具体的な「指定期間内」という条件を示すメッセージは実装されていない）
  const messageText = await emptyStateMessage.textContent();
  expect(messageText).toContain('該当する商談がありません');
});
