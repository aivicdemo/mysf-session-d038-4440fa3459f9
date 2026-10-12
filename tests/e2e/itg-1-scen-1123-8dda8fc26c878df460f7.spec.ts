import { test, expect } from '@playwright/test';

test.describe('SCEN-1123: 請求書・請求明細タブ表示：ユーザーに権限がない場合、表示対象データが制限される', () => {
  test('権限なしユーザーの請求データ制限表示を検証', async ({ page }) => {
    // ログイン画面を開く
    await page.goto('/login.html');

    // 権限なしユーザーでログイン
    await page.fill('[data-testid="username"]', 'no-permission-user');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');

    // ダッシュボード画面に遷移するのを待つ
    await page.waitForNavigation();
    await page.waitForURL(/\/panels\/scr-.*\.html/);

    // 商談・請求管理画面へ遷移
    const dealLink = page.locator('[data-aivic-nav="scr-1791354351333"]');
    if (await dealLink.isVisible()) {
      await dealLink.click();
    } else {
      await page.goto('/panels/scr-1791354351333.html');
    }

    await page.waitForLoadState('networkidle');

    // 「請求書・請求明細」タブをクリック
    const invoiceDetailTab = page.locator('[data-testid="tab-invoice-detail"], button:has-text("請求書・請求明細")');
    await invoiceDetailTab.click();

    // タブ内で表示される請求書一覧をチェック
    // (1) 請求書一覧には、テストユーザーが営業担当であり、かつ権限ロールで閲覧許可されている請求書のみが2件表示されることを確認
    const invoiceRows = page.locator('table tbody tr');
    const invoiceCount = await invoiceRows.count();
    expect(invoiceCount).toBe(2);

    // (2) 請求明細一覧には、上記2件の請求書に紐付く請求明細のみが表示される（計5件）
    const detailRows = page.locator('table tbody tr', { hasText: /商品名|数量|単価/ });
    const detailCount = await detailRows.count();
    expect(detailCount).toBe(5);

    // (3) タブ下部に「表示権限がないため、一部のデータが除外されています」というメッセージまたはバナーが表示される
    const restrictionMessage = page.locator('text=表示権限がないため、一部のデータが除外されています');
    await expect(restrictionMessage).toBeVisible();

    // (4) 各請求書・請求明細の行に対して、編集・削除・PDF出力などの操作ボタンが表示されない、またはグレイアウトされている
    const editButtons = page.locator('button:has-text("編集")');
    const deleteButtons = page.locator('button:has-text("削除")');
    const pdfButtons = page.locator('button:has-text("PDF")');

    // 編集ボタンが非表示またはグレイアウトされていることを確認
    if (await editButtons.count() > 0) {
      for (let i = 0; i < await editButtons.count(); i++) {
        const button = editButtons.nth(i);
        await expect(button).toHaveAttribute('disabled', /.*/);
      }
    }

    // 削除ボタンが非表示またはグレイアウトされていることを確認
    if (await deleteButtons.count() > 0) {
      for (let i = 0; i < await deleteButtons.count(); i++) {
        const button = deleteButtons.nth(i);
        await expect(button).toHaveAttribute('disabled', /.*/);
      }
    }

    // PDFボタンが非表示またはグレイアウトされていることを確認
    if (await pdfButtons.count() > 0) {
      for (let i = 0; i < await pdfButtons.count(); i++) {
        const button = pdfButtons.nth(i);
        await expect(button).toHaveAttribute('disabled', /.*/);
      }
    }
  });
});
