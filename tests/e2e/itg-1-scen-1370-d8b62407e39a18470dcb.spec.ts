import { test, expect } from '@playwright/test';

test('SCEN-1370: 複数の請求書が1つの商談に紐付く場合、請求明細が正しく統合されて合計金額が表示される', async ({ page }) => {
  // 顧客・取引先管理画面で取引先A（CUST-001）を検索
  await page.goto('/panels/scr-1791354379354.html');

  await page.locator('input[placeholder*="検索"], input[id*="search"]').fill('CUST-001');
  await page.keyboard.press('Enter');

  // 取引先Aの詳細表示をクリック
  await page.getByText('CUST-001').first().click();

  // 詳細表示画面内の「関連する商談」セクションで商談1（OPP-001）を特定
  await page.waitForLoadState('networkidle');

  const dealTab = page.locator('[class*="tab"], button, a', { hasText: /関連する商談|商談|deals/ });
  await dealTab.first().click();

  // 商談1 の行をクリックして商談詳細を開く
  const dealRow = page.locator('[class*="row"], tr', { has: page.locator('text=OPP-001') });
  await expect(dealRow).toBeVisible();
  await dealRow.click();

  // 商談詳細内の「関連する請求書」セクションが表示されるまで下にスクロール
  const invoiceSection = page.locator('[class*="invoice"], [class*="bill"], text=/関連する請求書/');
  await invoiceSection.scrollIntoViewIfNeeded();

  // 「関連する請求書」セクションに請求書1（INV-001）と請求書2（INV-002）が一覧表示されていることを確認
  await expect(page.locator('text=INV-001')).toBeVisible();
  await expect(page.locator('text=INV-002')).toBeVisible();

  // 「関連する請求書」セクション内に表示されている「請求明細統合表示」または「合計金額」の領域を目視
  const integrationDisplay = page.locator('[class*="integration"], [class*="total"], [class*="summary"], text=/請求明細統合|合計金額/');

  // 紐付く2つの請求書（INV-001、INV-002）の請求明細が統合されて表示
  const detailRows = page.locator('[class*="detail"], [class*="row"], tr', {
    has: page.locator('text=/INV-001|INV-002/')
  });
  const detailCount = await detailRows.count();
  expect(detailCount).toBeGreaterThanOrEqual(2);

  // 以下の合計金額が画面上に表示される：請求明細の統合合計 = 150,000円
  await expect(page.locator('text=/合計.*150,000|150,000円|15万/')).toBeVisible();

  // 商談の合計金額150,000円と請求明細統合合計150,000円が一致して表示される
  const dealAmount = await page.locator('[class*="deal"], text=/商談.*金額.*150,000|150,000円/').innerText().catch(() => '');
  const invoiceAmount = await page.locator('[class*="invoice"], [class*="total"], text=/150,000|15万/').innerText().catch(() => '');

  expect(dealAmount).toContain('150,000');
  expect(invoiceAmount).toContain('150,000');
});
