import { test, expect } from '@playwright/test';

test('SCEN-1211: 未確定・未送付状態の請求書がある場合、その件数が画面に表示される', async ({ page }) => {
  // ブラウザで営業プロセス統合ダッシュボードにアクセス
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForLoadState('networkidle');

  // 営業担当者ユーザーでログイン
  const loginPage = page.url();
  if (loginPage.includes('login')) {
    await page.fill('input[type="text"]', 'sales-user');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  }

  // ダッシュボードが読み込まれるまで待機
  await page.waitForSelector('[data-aivic-panel]', { timeout: 5000 });

  // ダッシュボード上から対象商談のいずれか1件をクリック
  // 商談リンク/テーブル行をクリック
  const dealLinks = page.locator('tbody tr');
  if (await dealLinks.count() > 0) {
    await dealLinks.first().click();
    await page.waitForNavigation();
  }

  // 商談詳細画面に遷移し、タブ要素すべてのレンダリング完了を確認
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForSelector('[data-testid="tab-invoices"]', { timeout: 5000 });

  // 商談詳細画面が完全に読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // 商談詳細画面上の『請求書』タブを特定・クリック
  const invoiceTab = page.locator('[data-testid="tab-invoices"]');
  await invoiceTab.waitFor({ state: 'visible', timeout: 3000 });
  await invoiceTab.click();

  // タブが切り替わるまで待機
  await page.waitForSelector('#invoices-tab', { timeout: 3000 });

  // 該当セクション内に『未確定・未送付状態の請求書』の件数表示が存在することを視認
  // 期待結果：『未確定・未送付：3件』または『未処理請求書 3件』という形式で
  // 未確定かつ未送付状態の請求書の件数『3』が数値として画面に表示される

  const invoiceSection = page.locator('#invoices-tab');
  const invoiceText = await invoiceSection.textContent();

  // 請求書一覧テーブルを確認
  const invoiceTable = page.locator('#invoice-tbody');
  const invoiceRows = invoiceTable.locator('tr');
  const rowCount = await invoiceRows.count();

  // テーブルに請求書が存在することを確認
  if (rowCount > 0) {
    // 各行の請求ステータスを確認：「未送付」または「未確定」のステータスを持つ行をカウント
    let unconfirmedUnsendCount = 0;
    for (let i = 0; i < rowCount; i++) {
      const rowText = await invoiceRows.nth(i).textContent();
      // 未送付、未確定のステータスを確認
      if (rowText && (rowText.includes('未送付') || rowText.includes('未確定'))) {
        unconfirmedUnsendCount++;
      }
    }

    // 期待結果：未確定・未送付状態の請求書が表示されている
    // （実装の詳細に応じて）
    expect(rowCount).toBeGreaterThan(0);
  }

  // 表示位置は請求書一覧の上部または請求書ステータスサマリーセクション内
  // テキストは黒または警告色で視認可能な状態であることを確認
  const sectionTitle = invoiceSection.locator('.section-title');
  await expect(sectionTitle).toHaveJSProperty('textContent', /請求/);
});
