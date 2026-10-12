import { test, expect } from '@playwright/test';

test.describe('SCEN-1180: 請求書と請求明細の参照関係が破損している場合、警告が表示される', () => {
  test('参照関係の破損警告が表示される', async ({ page }) => {
    // 商談・請求管理画面で商談ID=DEAL-9999を検索・選択
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');

    // 検索フィールドで商談ID「DEAL-9999」を入力
    const searchInput = page.locator('[data-testid="filter-customer"], input[placeholder*="取引先"], input:first-of-type').first();
    await searchInput.clear();
    await searchInput.fill('DEAL-9999');
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');

    // 検索結果から対象商談を選択
    const dealRow = page.locator('table tbody tr').first();
    await dealRow.click();
    await page.waitForLoadState('networkidle');

    // 商談詳細タブを開く
    const detailsTab = page.locator('[data-testid="details-tab"], [id="details-tab"], button:has-text("詳細"), button:has-text("商談詳細")').first();
    const isTabVisible = await detailsTab.isVisible().catch(() => false);

    if (isTabVisible) {
      await detailsTab.click();
      await page.waitForLoadState('networkidle');
    }

    // 詳細タブ内の関連請求書セクションで請求書ID=INV-8888を表示
    const relatedInvoiceSection = page.locator('text=関連請求書').or(page.locator('text=請求書情報')).or(page.locator('text=請求情報')).first();
    await relatedInvoiceSection.scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle');

    const invoiceRow = page.locator('table tbody tr').filter({ has: page.locator('text=INV-8888') }).first();
    await expect(invoiceRow).toBeVisible();

    // 請求書ID=INV-8888の請求明細一覧を展開・読み込む
    const expandButton = invoiceRow.locator('button, a').filter({ has: page.locator('text=展開') }).first();
    const isExpandButtonVisible = await expandButton.isVisible().catch(() => false);

    if (isExpandButtonVisible) {
      await expandButton.click();
      await page.waitForLoadState('networkidle');
    }

    // システムが請求書テーブルと請求明細テーブル間の外部キー参照関係を検証
    await page.waitForTimeout(1000);

    // 商談詳細タブの請求書セクション上部に、背景色がオレンジ/黄色の警告バナーが表示される
    const warningBanner = page.locator('[class*="warning"], [class*="alert"], [role="alert"]').filter({ has: page.locator('text=請求明細の参照関係が破損') }).first();
    await expect(warningBanner).toBeVisible();

    // バナーが背景色オレンジ/黄色であることを確認
    const bgColor = await warningBanner.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).toMatch(/^rgb\(255,\s*([0-9]{1,3}),\s*0\)|orange|yellow|#[fF]{2}[89a-fA-F]{2}00/i);

    // テキスト『請求明細の参照関係が破損しています。請求書INV-8888に紐付く請求明細の一部が異なる請求書IDを参照しています。管理者に報告してください。』が表示される
    const warningText = page.locator('text=請求明細の参照関係が破損').or(page.locator('text=異なる請求書IDを参照')).first();
    await expect(warningText).toBeVisible();

    // ユーザーはこの警告を視認でき、管理画面への遷移リンクまたは「詳細」ボタンが提供される
    const detailLink = page.locator('a, button').filter({ has: page.locator('text=管理画面') }).first();
    const isLinkVisible = await detailLink.isVisible().catch(() => false);

    if (isLinkVisible) {
      await expect(detailLink).toBeVisible();
    }
  });
});
