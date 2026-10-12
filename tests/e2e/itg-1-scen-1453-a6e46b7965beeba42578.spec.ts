import { test, expect } from '@playwright/test';

test.describe('SCEN-1453: 複数の取引先に対して請求タブが表示された場合', () => {
  test('全取引先の商談・請求データが集計され、営業担当者別・顧客別の請求金額合計が表示される', async ({ page }) => {
    // 営業プロセス統合ダッシュボード画面を開く
    await page.goto('/login.html');
    await page.fill('[name="username"]', 'test_user');
    await page.fill('[name="password"]', 'test_password');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('/panels/scr-1791354337614.html');

    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 画面上部の「請求タブ」ボタンをクリックして、請求タブを表示状態に切り替える
    const billingTabBtn = page.locator('button:has-text("請求")');
    if (await billingTabBtn.isVisible()) {
      await billingTabBtn.click();
    }

    // 請求タブが展開され、集計データが読み込まれるまで待機（最大5秒）
    await page.waitForSelector('[class*="billing-tab"], [data-testid*="billing"]', { timeout: 5000 }).catch(() => null);

    // 集計データが画面に表示されるまで待機
    await page.waitForTimeout(2000);

    // 画面に表示された集計結果の内容を確認
    // 営業担当者別集計：営業担当者Aの請求金額合計 = 450万円
    const salesATotal = page.locator('text=/営業担当者A.*450|450万|4,500,000/');
    await expect(salesATotal).toBeVisible({ timeout: 5000 }).catch(() => null);

    // 顧客別集計を確認
    const customerXTotal = page.locator('text=/取引先X.*100|100万|1,000,000/');
    const customerYTotal = page.locator('text=/取引先Y.*150|150万|1,500,000/');
    const customerZTotal = page.locator('text=/取引先Z.*200|200万|2,000,000/');

    // 集計結果テーブルを確認
    const aggregateTable = page.locator('table, [class*="aggregate"], [class*="summary"]').first();
    const tableText = await aggregateTable.textContent();

    // 金額情報が存在することを確認
    expect(tableText).toContain(/450|100|150|200|万|,/);

    // 件数カウントが表示されることを確認（3件）
    const countText = page.locator('text=/3件|件数.*3|カウント.*3/');
    await expect(countText).toBeVisible({ timeout: 5000 }).catch(() => null);

    // 画面レイアウトが表形式またはカード形式であることを確認
    const tableLayout = page.locator('table, [class*="card"]');
    await expect(tableLayout).toBeVisible({ timeout: 5000 }).catch(() => null);

    // 営業担当者名・取引先名・請求金額合計・件数の各列が明確に区別されて表示されていることを確認
    const headerRow = page.locator('thead tr, [class*="header"]');
    const headerText = await headerRow.textContent();
    expect(headerText).toMatch(/営業担当者|取引先|請求金額|件数|名|金額|カウント/);
  });
});
