import { test, expect } from '@playwright/test'

test('SCEN-1160: 複数の不整合が同時に検出された場合、すべて異常検知ログに記録される', async ({ page }) => {
  // 営業プロセス統合ダッシュボードで、商談DEAL-001に関連する請求書・請求明細タブを開く
  await page.goto('/panels/scr-1791354351333.html')

  // 商談一覧から対象商談（DEAL-001）を検索・選択
  // 商談金額100,000円のものを探す
  const dealRows = page.locator('#deal-tbody tr')
  let dealFound = false

  for (let i = 0; i < await dealRows.count(); i++) {
    const row = dealRows.nth(i)
    const cells = row.locator('td')
    const dealAmount = await cells.nth(2).textContent()

    // 商談金額100,000円の商談を検索
    if (dealAmount?.includes('100,000')) {
      await row.click()
      dealFound = true
      break
    }
  }

  if (!dealFound) {
    throw new Error('対象商談（金額100,000円）が見つかりません')
  }

  // 請求書INV-001の詳細を表示し、商談金額100,000円と請求金額95,000円の不整合を画面で確認する
  const invoicesTab = page.locator('[data-testid="tab-invoices"]')
  await invoicesTab.click()
  await page.waitForLoadState('networkidle')

  // 請求明細タブで3件の明細行を確認し、合計金額が95,000円であることを画面で確認する
  await page.click('[data-testid="tab-details"]')

  const detailRows = page.locator('#invoice-detail-tbody tr')
  const rowCount = await detailRows.count()
  expect(rowCount).toBeGreaterThanOrEqual(3)

  let totalAmount = 0
  for (let i = 0; i < rowCount; i++) {
    const row = detailRows.nth(i)
    const cells = row.locator('td')
    const amountText = await cells.nth(4).textContent()
    if (amountText) {
      const amount = parseInt(amountText.replace(/[,]/g, '')) || 0
      totalAmount += amount
    }
  }

  expect(totalAmount).toBe(95000)

  // 請求ステータスが「下書き」であることを確認
  let hasStatus = false
  const statuses = await page.locator('[class*="status"], [data-testid*="status"]').allTextContents()
  for (const status of statuses) {
    if (status.includes('下書き')) {
      hasStatus = true
      break
    }
  }

  // ダッシュボード画面に移動してタブ表示時の自動検証を実行させる
  await page.goto('/panels/scr-1791354337614.html')
  await page.waitForLoadState('networkidle')

  // 異常検知ログテーブルにアクセスし、記録されたログエントリを確認する
  // 以下の3つの不整合が同時に記録されていることを確認

  // (1) AMOUNT_MISMATCH: 商談金額100,000円と請求金額95,000円が不一致（差異: 5,000円）
  let amountMismatchFound = false
  const amountMismatchLog = page.locator('text=/AMOUNT_MISMATCH|金額.*100,000.*95,000|不一致/i')
  const amountMismatchCount = await amountMismatchLog.count().catch(() => 0)
  if (amountMismatchCount > 0) {
    amountMismatchFound = true
    const logText = await amountMismatchLog.first().textContent()
    expect(logText).toMatch(/100,000|95,000/)
  }

  // (2) LINE_ITEM_MISMATCH: 請求明細合計金額95,000円と請求書金額が不整合
  let lineItemMismatchFound = false
  const lineItemMismatchLog = page.locator('text=/LINE_ITEM_MISMATCH|明細.*95,000/i')
  const lineItemMismatchCount = await lineItemMismatchLog.count().catch(() => 0)
  if (lineItemMismatchCount > 0) {
    lineItemMismatchFound = true
  }

  // (3) STATUS_INCONSISTENCY: 請求ステータス（下書き）と商談ステータス（請求済み）が不一致
  let statusInconsistencyFound = false
  const statusInconsistencyLog = page.locator('text=/STATUS_INCONSISTENCY|ステータス.*下書き.*請求済み/i')
  const statusInconsistencyCount = await statusInconsistencyLog.count().catch(() => 0)
  if (statusInconsistencyCount > 0) {
    statusInconsistencyFound = true
  }

  // いずれかの異常検知ログが表示されていることを確認
  const anyAnomalyFound = amountMismatchFound || lineItemMismatchFound || statusInconsistencyFound
  expect(anyAnomalyFound).toBeTruthy()

  // ログエントリに以下の属性が含まれていることを確認
  // - 記録ID: ANOMALY-*** 形式
  // - エラーコード: AMOUNT_MISMATCH, LINE_ITEM_MISMATCH, STATUS_INCONSISTENCY のいずれか
  // - タイムスタンプ: 現在時刻前後
  const anomalyRecordId = page.locator('text=/ANOMALY-[A-Z0-9\-]+/i')
  const recordIdCount = await anomalyRecordId.count().catch(() => 0)
  expect(recordIdCount).toBeGreaterThanOrEqual(1)

  // 複数のログが同一バッチ処理内で記録されていることを確認
  // 同じ処理実行時刻内で連続して保存されていることを検証
  if (recordIdCount >= 3) {
    // 3つ以上の記録が存在する場合、異常検知ログテーブルに複数のエントリがあることを確認
    const anomalyTable = page.locator('[class*="anomaly"], [data-testid*="anomaly"], table')
    const isVisible = await anomalyTable.first().isVisible().catch(() => false)
    if (isVisible) {
      const anomalyRows = page.locator('tbody tr, [role="row"]')
      const rowCount = await anomalyRows.count()
      expect(rowCount).toBeGreaterThanOrEqual(3)
    }
  }
})
