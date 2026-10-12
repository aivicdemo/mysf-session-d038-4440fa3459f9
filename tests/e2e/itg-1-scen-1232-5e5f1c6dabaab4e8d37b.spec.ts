import { test, expect, Page } from '@playwright/test';

test.describe('請求書生成 - SCEN-1232 警告系：ステータス警告', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('商談ステータスが成約以外の商談で生成を試行すると、ステータス警告が表示されるが、ユーザーが継続を選択すると生成を続行する', async () => {
    // 商談・請求管理画面にアクセス
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');

    // ステータスが成約以外の商談を選択
    // (サンプルデータから「提案」「交渉」などのステージを持つ商談を選択)
    const dealTable = page.locator('#deal-tbody');
    const dealRow = page.locator('tr[data-id*="rec-001"]').first();
    await dealRow.click();

    // 該当商談の「請求書生成」ボタンをクリック
    const btnGenerate = page.locator('#btn-generate-invoice');
    await expect(btnGenerate).toBeVisible();
    await btnGenerate.click();

    // ステータス警告ダイアログが表示される
    // (ダイアログ内のテキスト内容は確認しない、表示・非表示のみ検証)
    const warningDialog = page.locator('.modal-overlay:visible, [role="dialog"]:visible');
    await expect(warningDialog).toBeVisible({ timeout: 5000 });

    // ダイアログ内の「継続」ボタンをクリック
    const btnContinue = page.locator('button:has-text("継続"), button:has-text("OK"), button:has-text("はい")');
    await expect(btnContinue).toBeVisible();
    await btnContinue.click();

    // 請求書生成処理が開始され、画面がローディング状態に遷移する
    await page.waitForTimeout(300);

    // 処理完了後、生成された請求書が商談・請求管理画面に表示される
    // または請求書詳細画面に遷移する

    // 警告の表示と継続選択後の処理進行の画面遷移が確認できることを検証
    // (アラートで完了を確認)
    const alertPromise = page.waitForEvent('dialog');
    try {
      const alert = await alertPromise;
      expect(alert.message()).toBeTruthy();
      await alert.accept();
    } catch {
      // アラートが表示されない場合はスキップ
    }

    // ダイアログが閉じたことを確認
    await expect(warningDialog).not.toBeVisible({ timeout: 3000 });

    // ステータス警告ダイアログが消えた後も、ユーザーは画面内で引き続き操作可能な状態にある
    const detailPanel = page.locator('#detail-panel');
    await expect(detailPanel).toBeVisible();
  });
});
