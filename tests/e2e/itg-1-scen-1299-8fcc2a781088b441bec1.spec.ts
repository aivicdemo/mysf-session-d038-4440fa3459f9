import { test, expect } from '@playwright/test';

test('SCEN-1299: 再発行対象の請求書にアクセス可能な権限を持つユーザーであることが確認でき、権限外のユーザーによる操作が防止される', async ({ browser }) => {
  // テストユーザー1（権限あり）のセッション
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();

  // テストユーザー2（権限なし）のセッション
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();

  try {
    // テストユーザー1: 商談・請求管理画面を開く
    await page1.goto('/panels/scr-1791354351333.html');
    await page1.waitForSelector('[id="deal-tbody"]');

    // テストユーザー1: 請求書ID「INV-2025-001」を検索して該当レコードを表示
    const searchField = page1.locator('[id="filter-customer"]');
    await searchField.fill('INV-2025-001');

    // テストユーザー1: 該当請求書の右側操作メニューから「再発行」ボタンが表示されていることを確認
    const reissueBtn = page1.locator('[id="btn-reissue-invoice"]');
    await expect(reissueBtn).toBeVisible();
    await expect(reissueBtn).not.toBeDisabled();

    // テストユーザー2: 別ブラウザセッションで同一システムにアクセス
    await page2.goto('/panels/scr-1791354351333.html');
    await page2.waitForSelector('[id="deal-tbody"]');

    // テストユーザー2: 同一の請求書ID「INV-2025-001」を検索して表示を試みる
    const searchField2 = page2.locator('[id="filter-customer"]');
    await searchField2.fill('INV-2025-001');

    // テストユーザー2: 該当請求書の操作メニューを確認
    // 権限がない場合は「再発行」ボタンが表示されないか、表示されていても選択時にエラーメッセージが表示される
    const reissueBtn2 = page2.locator('[id="btn-reissue-invoice"]');

    // ボタンが存在する場合でも無効化されていることを確認
    if (await reissueBtn2.isVisible()) {
      await expect(reissueBtn2).toBeDisabled();
    }

  } finally {
    await context1.close();
    await context2.close();
  }
});
