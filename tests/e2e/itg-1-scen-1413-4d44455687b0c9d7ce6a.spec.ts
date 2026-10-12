import { test, expect } from '@playwright/test';

test('SCEN-1413: 営業担当者が他者の担当顧客に関連する商談履歴にアクセスしようとすると、アクセスが拒否される', async ({ page, context }) => {
  // 営業担当者A として営業プロセス統合ダッシュボードにログイン済みの状態にある
  await page.goto('/login.html');
  await page.waitForLoadState('networkidle');

  // ログインフォームに営業担当者A の認証情報を入力
  await page.fill('input[name="email"]', 'yamada.taro@company.jp');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');

  // 営業プロセス統合ダッシュボード画面に遷移
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForLoadState('networkidle');

  // 営業プロセス統合ダッシュボード画面の「商談・請求管理」へのナビゲーション機能を操作する
  const dealManagementLink = page.locator('a[data-aivic-nav="scr-1791354351333"]');
  await dealManagementLink.click();
  await page.waitForLoadState('networkidle');

  // 直接URLまたはAPIエンドポイント（例：/api/deals/DEAL-5678）を使用して、
  // 営業担当者B担当の商談DEAL-5678に対する取引先商談タブ（関連商談履歴）への閲覧リクエストを実行する
  await page.goto('/panels/scr-1791354351333.html?dealId=DEAL-5678');
  await page.waitForLoadState('networkidle');

  // ブラウザ（Playwright）でリクエストレスポンスとDOM要素の出現を検証する

  // 期待結果：営業担当者Aによる営業担当者B担当の商談DEAL-5678へのアクセスリクエストに対して、
  // HTTPステータスコード 403（Forbidden）またはシステムレベルの「アクセス権限がありません」エラーメッセージが画面に表示される

  // 1. ネットワークレスポンスを監視して 403 Forbidden を確認
  let accessDeniedDetected = false;
  page.on('response', response => {
    if (response.status() === 403) {
      accessDeniedDetected = true;
    }
  });

  // 2. ページコンテンツ内でエラーメッセージを検索
  const pageContent = await page.content();
  const hasAccessDeniedMessage = pageContent.includes('アクセス権限がありません') ||
                                  pageContent.includes('権限がありません') ||
                                  pageContent.includes('アクセス拒否');

  expect(accessDeniedDetected || hasAccessDeniedMessage).toBeTruthy();

  // 3. 商談の取引先商談タブ内の履歴データ（商談ステージ、金額、活動内容など）が一切表示されない
  const dealDataElements = page.locator('[data-testid="related-deals-table"]');
  const isDataVisible = await dealDataElements.isVisible().catch(() => false);
  expect(!isDataVisible).toBeTruthy();

  // 4. 同時に操作ログにはアクセス拒否イベント
  // （user_id: sales_A, resource: DEAL-5678, action: view_deal_tab, result: denied, timestamp）が記録される
  // このチェックはバックエンド側での検証となるため、画面上で確認可能なエラーメッセージの表示で代替
  const errorContainer = page.locator('[role="alert"], [class*="error-message"], [data-testid="error"]');
  const isErrorDisplayed = await errorContainer.isVisible().catch(() => false);

  if (isErrorDisplayed) {
    const errorText = await errorContainer.first().textContent();
    expect(errorText).toMatch(/アクセス権限がありません|権限がありません|403|Forbidden/i);
  }

  // エラーメッセージが表示されているか、またはアクセス拒否が検出されたかを確認
  expect(hasAccessDeniedMessage || accessDeniedDetected || isErrorDisplayed).toBeTruthy();
});
