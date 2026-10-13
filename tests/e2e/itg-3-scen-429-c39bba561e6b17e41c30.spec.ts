import { test, expect } from '@playwright/test'

test('SCEN-429: CSV出力操作がコンプライアンス保管期間ポリシーに基づいて監視ログに分類され、保管期間と保管先が決定される', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html')

  // ページ読み込み完了待ちと初期状態確認
  await page.waitForSelector('#discrepancy-tbody')
  const discrepancyCount = await page.textContent('#discrepancy-count')
  expect(parseInt(discrepancyCount || '0')).toBeGreaterThan(0)

  // 差異データ1件を選択
  const firstCheckbox = page.locator('#discrepancy-tbody .row-checkbox').first()
  await firstCheckbox.check()

  // 「CSV出力」ボタンをクリック
  const exportBtn = page.locator('#export-btn')

  // CSV出力処理を通じた外部サービス連携（Amazon S3）呼び出し確認
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportBtn.click()
  ])

  // ダウンロード完認
  const downloadPath = await download.path()
  expect(downloadPath).toBeTruthy()
  expect(download.suggestedFilename()).toMatch(/^discrepancies_.*\.csv$/)

  // ネットワークトレース確認：S3呼び出しログを検証
  // （実装がs3関連APIを呼び出していることを想定）
  const csvContent = await page.evaluate(() => {
    // ブラウザ内でのネットワーク履歴を参照するか、実装の監査ログ記録を確認
    return (window as any).AIVIC_AUDIT_LOG?.slice(-1)?.[0] || null
  })

  // 監査ログテーブルの確認
  // AIVIC API を使って監査ログレコードを取得
  const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL)
  const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID)

  // 監査ログテーブルに新規レコード挿入を確認
  const auditResponse = await page.request.get(
    `${apiUrl}by-name?app=${appId}&table=%E7%9B%A3%E6%9F%BB%E3%83%AD%E3%82%B0`
  )
  const auditData = await auditResponse.json()
  const records = Array.isArray(auditData) ? auditData : auditData.records || []

  // 最新のログレコードを確認
  const latestLog = records[records.length - 1]
  expect(latestLog).toBeDefined()
  expect(latestLog['操作分類']).toBe('CSV_EXPORT')
  expect(latestLog['保管期間']).toBe('2555')
  expect(latestLog['保管先']).toBe('AMAZON_S3')

  // タイムスタンプがCSV出力実行時刻と近い（5秒以内の差）
  const now = new Date()
  const logTimestamp = new Date(latestLog['タイムスタンプ'])
  const timeDiff = Math.abs(now.getTime() - logTimestamp.getTime())
  expect(timeDiff).toBeLessThan(5000)
})
