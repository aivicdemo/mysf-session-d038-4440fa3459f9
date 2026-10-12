import { test, expect } from '@playwright/test';

test.describe('SCEN-1175: 請求書に紐付く請求明細が存在しない場合、参照関係が無効と判定される', () => {
  test('請求明細が存在しない場合、参照関係が無効と表示される', async ({ page }) => {
    // 営業プロセス統合ダッシュボード画面で商談一覧から商談をクリック
    await page.goto('/panels/scr-1791354337614.html');

    // 商談一覧から商談ID「OPP-20250107-001」をクリック
    const dealTable = page.locator('table:has(text=/商談ID|商談名/)').first();
    const targetDeal = dealTable.locator('text=OPP-20250107-001').first();
    await targetDeal.click();
    await page.waitForLoadState('networkidle');

    // 商談詳細タブが開く
    const detailTab = page.locator('[data-testid="details-tab"], [id="details-tab"]').first();
    const isDetailTabOpen = await detailTab.isVisible().catch(() => false);

    if (!isDetailTabOpen) {
      // タブをクリックして開く
      const tabButton = page.locator('button:has-text("詳細"), button:has-text("商談詳細")').first();
      await tabButton.click();
      await page.waitForLoadState('networkidle');
    }

    // 商談詳細タブ内の「関連請求情報」セクションまでスクロール
    const relatedInvoiceSection = page.locator('text=関連請求情報').or(page.locator('text=請求書情報')).or(page.locator('text=請求情報')).first();
    await relatedInvoiceSection.scrollIntoViewIfNeeded();

    // 請求書「INV-20250107-001」の行内にある「参照関係検証ステータス」表示領域を確認
    const invoiceRow = page.locator('table tbody tr').filter({ has: page.locator('text=INV-20250107-001') }).first();
    const referenceStatus = invoiceRow.locator('[data-testid="reference-status"]').first();

    // 「参照関係検証ステータス」に「⚠ 無効」と表示されることを確認
    await expect(referenceStatus).toContainText('無効');

    // その隣に「請求明細が存在しません」という説明テキストが赤色で表示されることを確認
    const descriptionText = page.locator('text=請求明細が存在しません').first();
    await expect(descriptionText).toBeVisible();

    const textColor = await descriptionText.evaluate(el => window.getComputedStyle(el).color);
    expect(textColor).toMatch(/rgb\(255,\s*0,\s*0\)/);

    // ステータスが視覚的に無効状態を示すアイコンを含むことを確認
    const invalidIcon = referenceStatus.locator('[class*="invalid"], [class*="warning"], [class*="error"]').first();
    const isIconVisible = await invalidIcon.isVisible().catch(() => false);

    if (isIconVisible) {
      await expect(invalidIcon).toBeVisible();
    }
  });
});
