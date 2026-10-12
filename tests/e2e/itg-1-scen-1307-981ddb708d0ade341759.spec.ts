import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-1307: 請求書再発行確定 - 差異検出と警告表示', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');
  });

  test('商談金額と請求金額に差異がある場合、差異額・差異理由が検出され、画面に表示される', async () => {
    // テスト用DBに上記preconditionsの商談・請求書レコードをセットアップする
    // 商談金額 500,000円、請求金額 480,000円 のデータを確認

    // 営業プロセス統合ダッシュボードにログインする (既にログイン状態と仮定)

    // 商談・請求管理画面に遷移する (既に遷移済み)

    // 商談金額500,000円のレコードを検索・表示する
    await page.fill('[data-testid="filter-customer"]', '');
    await page.waitForTimeout(500);

    // 商談一覧から金額500,000円の商談を探してクリック
    const dealRows = await page.locator('[id="deal-tbody"] tr');
    let targetDealFound = false;
    const dealCount = await dealRows.count();

    for (let i = 0; i < dealCount; i++) {
      const row = dealRows.nth(i);
      const text = await row.textContent();
      if (text && text.includes('500000') || text.includes('500,000')) {
        await row.click();
        targetDealFound = true;
        break;
      }
    }

    // 該当商談に紐付く請求書（金額480,000円）の再発行確定ボタンをクリックする
    const reissueBtn = page.locator('[id="btn-reissue-invoice"]');
    if (await reissueBtn.isEnabled()) {
      await reissueBtn.click();
    }

    // 請求書再発行確定処理の画面ダイアログが表示されるまで待機する（最大5秒）
    const modal = page.locator('[id="modal-reissue"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    // 期待結果の検証

    // (1)差異額欄に「-20,000円」が自動計算・表示される
    const discrepancyField = page.locator('text=-20,000円, text=20,000');
    const discrepancyExists = await discrepancyField.count() > 0 ||
                              (await modal.textContent()).includes('20,000') ||
                              (await modal.textContent()).includes('-20,000');
    expect(discrepancyExists).toBeTruthy();

    // (2)差異理由欄が表示され、テキスト入力可能な状態である
    const reasonInput = page.locator('[id="modal-reissue-reason"]');
    await expect(reasonInput).toBeVisible();
    expect(await reasonInput.isEnabled()).toBe(true);

    // (3)画面上部に「商談金額と請求金額に差異があります。差異理由を入力してください」という警告メッセージが表示される
    const warningMessage = modal.locator('text=商談金額と請求金額に差異があります。差異理由を入力してください');
    await expect(warningMessage).toBeVisible();

    // (4)再発行確定ボタンは差異理由が未入力の状態ではグレーアウト（非活性）になっている
    const confirmBtn = page.locator('[id="btn-confirm-reissue"]');
    const isDisabled = await confirmBtn.isDisabled();
    expect(isDisabled).toBe(true);
  });
});
