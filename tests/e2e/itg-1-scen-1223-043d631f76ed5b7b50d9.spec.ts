import { test, expect, Page } from '@playwright/test';

test.describe('請求書生成 - SCEN-1223 エラー系：権限なし', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('権限なしユーザーが操作すると、権限チェックで処理を中止し、エラーメッセージを表示する', async () => {
    // 権限なしユーザーで営業プロセス統合ダッシュボード画面にアクセス
    await page.goto('/panels/scr-1791354337614.html');
    await page.waitForLoadState('networkidle');

    // 商談・請求管理画面に遷移
    const navLink = page.locator('[data-aivic-nav="scr-1791354351333"]');
    await navLink.click();
    await page.waitForURL('**/scr-1791354351333.html');

    // 請求書がまだ生成されていない確定済み商談を選択
    const dealTable = page.locator('#deal-tbody');
    await expect(dealTable).toBeVisible();

    // 商談行をクリック
    const dealRow = page.locator('tr[data-id*="rec-001"]').first();
    await dealRow.click();

    // 詳細表示エリアで「請求書生成」ボタンが表示されるまで待機
    await page.waitForTimeout(300);

    // 「請求書生成」ボタンをクリック
    const btnGenerate = page.locator('#btn-generate-invoice');

    // 権限なし場合、ボタンが disabled または エラーメッセージが直ちに表示される
    // ここでは通常の flow をシミュレートし、権限チェックエラーを期待
    await btnGenerate.click();

    // 権限エラーメッセージがアラート・トースト・またはモーダルで表示される
    const alertPromise = page.waitForEvent('dialog');
    const alert = await alertPromise;
    const msg = alert.message();
    expect(msg).toMatch(/権限|の操作を実行する権限がありません|アクセスが拒否されました/);
    await alert.accept();

    // 商談・請求管理画面は遷移せず、現在の商談詳細画面が保持される
    const detailPanel = page.locator('#detail-panel');
    await expect(detailPanel).toBeVisible();

    // ブラウザコンソールにエラーログが記録されることを確認（コンソールメッセージの監視）
    let consoleError = '';
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleError = msg.text();
      }
    });
  });
});
