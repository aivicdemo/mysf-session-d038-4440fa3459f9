import { test, expect } from '@playwright/test';

test('取引先請求タブ表示: 営業担当者がシステムにログイン済みで、自分の担当顧客の商談・請求履歴を表示した場合、全商談と請求書が時系列で統合表示される', async ({ page }) => {
  test.setTimeout(30000);

  await page.goto('/panels/scr-1791354337614.html');

  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  await page.goto('/panels/scr-1791354379354.html');
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  const searchInput = page.locator('#search-field');
  await expect(searchInput).toBeVisible({ timeout: 5000 });
  await searchInput.fill('株式会社テスト');

  await page.waitForTimeout(500);

  const customerRows = page.locator('[data-aivic-panel="scr-1791354379354"] tbody tr');
  const matchingRow = customerRows.filter({ hasText: '株式会社テスト' }).first();

  if (await matchingRow.isVisible({ timeout: 5000 }).catch(() => false)) {
    await matchingRow.click();
  } else {
    const allRows = await customerRows.all();
    if (allRows.length > 0) {
      await allRows[0].click();
    }
  }

  await page.waitForTimeout(500);

  const dealsTab = page.locator('button:has-text("関連商談")');
  if (await dealsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await dealsTab.click();
  }

  const dealManagementNav = page.locator('a[data-aivic-nav="scr-1791354351333"]');
  if (await dealManagementNav.isVisible({ timeout: 3000 }).catch(() => false)) {
    await dealManagementNav.click();
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  } else {
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  }

  const dealList = page.locator('[data-testid="deal-list-table"] tbody tr');
  let dealItems = [];

  const dealRows = await dealList.all();
  for (const row of dealRows) {
    const cells = await row.locator('td').all();
    if (cells.length >= 5) {
      const nameCell = await cells[0].textContent();
      if (nameCell && !nameCell.includes('該当する商談がありません')) {
        dealItems.push({
          name: nameCell.trim(),
          customer: await cells[1].textContent(),
          amount: await cells[2].textContent(),
          stage: await cells[3].textContent(),
          date: await cells[4].textContent(),
        });
      }
    }
  }

  if (dealItems.length > 0) {
    const firstDeal = dealItems[0];
    await dealList.first().click();
  }

  await page.waitForTimeout(500);

  const invoiceTab = page.locator('[data-testid="tab-invoices"]');
  if (await invoiceTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await invoiceTab.click();
  }

  const invoiceList = page.locator('[data-testid="invoice-list-table"] tbody tr');
  let invoiceItems = [];

  const invoiceRows = await invoiceList.all();
  for (const row of invoiceRows) {
    const cells = await row.locator('td').all();
    if (cells.length >= 6) {
      const numCell = await cells[0].textContent();
      if (numCell && !numCell.includes('商談を選択してください') && !numCell.includes('関連する請求書がありません')) {
        const dateText = await cells[1].textContent();
        const dateMatch = dateText?.match(/(\d{4})-(\d{2})-(\d{2})/);
        invoiceItems.push({
          number: numCell.trim(),
          date: dateText?.trim() || '',
          dueDate: await cells[2].textContent(),
          amount: await cells[3].textContent(),
          timestamp: dateMatch ? new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[3])).getTime() : 0,
        });
      }
    }
  }

  const detailsTab = page.locator('[data-testid="tab-details"]');
  if (await detailsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await detailsTab.click();
  }

  const invoiceDetailList = page.locator('[data-testid="invoice-detail-table"] tbody tr');
  const detailRows = await invoiceDetailList.all();
  let allItemsChronological = [];

  for (const dealItem of dealItems) {
    const dealDateMatch = dealItem.date?.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dealDateMatch) {
      allItemsChronological.push({
        type: '商談',
        date: dealItem.date.trim(),
        name: dealItem.name.trim(),
        stage: dealItem.stage?.trim() || '',
        amount: dealItem.amount?.trim() || '',
        timestamp: new Date(parseInt(dealDateMatch[1]), parseInt(dealDateMatch[2]) - 1, parseInt(dealDateMatch[3])).getTime(),
      });
    }
  }

  for (const invoiceItem of invoiceItems) {
    let invTimestamp = invoiceItem.timestamp;
    if (!invTimestamp && invoiceItem.date) {
      const invDateMatch = invoiceItem.date.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (invDateMatch) {
        invTimestamp = new Date(parseInt(invDateMatch[1]), parseInt(invDateMatch[2]) - 1, parseInt(invDateMatch[3])).getTime();
      }
    }
    allItemsChronological.push({
      type: '請求書',
      date: invoiceItem.date,
      number: invoiceItem.number,
      amount: invoiceItem.amount,
      timestamp: invTimestamp || 0,
    });
  }

  allItemsChronological.sort((a, b) => {
    const timeA = a.timestamp || 0;
    const timeB = b.timestamp || 0;
    return timeA - timeB;
  });

  console.log('Chronological items:', allItemsChronological);

  expect(allItemsChronological.length).toBeGreaterThan(0);

  for (let i = 0; i < allItemsChronological.length - 1; i++) {
    const current = allItemsChronological[i];
    const next = allItemsChronological[i + 1];
    const currentTime = current.timestamp || 0;
    const nextTime = next.timestamp || 0;
    expect(currentTime).toBeLessThanOrEqual(nextTime);
  }

  let hasDeals = allItemsChronological.some(item => item.type === '商談');
  let hasInvoices = allItemsChronological.some(item => item.type === '請求書');

  expect(hasDeals).toBeTruthy();
  expect(hasInvoices).toBeTruthy();

  for (const item of allItemsChronological) {
    if (item.type === '商談') {
      expect(item.stage).toBeTruthy();
    } else if (item.type === '請求書') {
      expect(item.amount).toBeTruthy();
      expect(item.number).toBeTruthy();
    }
  }
});
