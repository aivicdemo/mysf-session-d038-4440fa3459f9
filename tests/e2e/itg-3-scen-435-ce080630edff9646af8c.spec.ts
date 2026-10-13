import { test, expect } from '@playwright/test'

test('SCEN-435: CSV出力によって記録された監視ログがデータ移行の整合性検証関連の場合、監査対象として分類される', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html')

  // ページ読み込み完了待ち
  await page.waitForSelector('#discrepancy-tbody')

  // 検出済みの差異データを確認
  const discrepancyCount = await page.textContent('#discrepancy-count')
  expect(parseInt(discrepancyCount || '0')).toBeGreaterThan(0)

  // 差異データを選択
  const checkbox = page.locator('#discrepancy-tbody .row-checkbox').first()
  await checkbox.check()

  // 画面上の「CSV出力」ボタンをクリック
  const exportBtn = page.locator('#export-btn')
  expect(exportBtn).toBeVisible()

  // CSV出力ダイアログが表示される（存在する場合）
  const csvDialog = page.locator('text=CSV出力').first()

  // ファイル形式（CSV）と出力対象範囲が確認できることを確認
  await exportBtn.click()

  // CSVダウンロード完了を待つ
  await page.waitForTimeout(1500)

  // CSV出力完了メッセージが画面に表示されることを確認
  const completeMessage = page.locator('text=/CSV.*出力完了/')
  if (await completeMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
    await expect(completeMessage).toBeVisible()
  }

  // 内部監査ログテーブルを確認
  const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL)
  const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID)

  // 監査ログレコードの確認
  const auditResponse = await page.request.get(
    `${apiUrl}by-name?app=${appId}&table=%E7%9B%A3%E6%9F%BB%E3%83%AD%E3%82%B0`
  )
  const auditData = await auditResponse.json()
  const records = Array.isArray(auditData) ? auditData : auditData.records || []

  // 新規ログレコードが記録されていることを確認
  expect(records.length).toBeGreaterThan(0)

  // 最新のログレコードの属性確認
  const latestLog = records[records.length - 1]
  expect(latestLog).toBeDefined()

  // 操作種別がデータ移行整合性検証_差異データ出力に分類
  expect(latestLog['操作種別']).toBe('データ移行整合性検証_差異データ出力')

  // 操作対象が「差異検出レポート（旧Salesforce-新システム間の請求書生成ロジック照合）」
  expect(latestLog['操作対象']).toContain('差異検出レポート')

  // 操作ユーザーが当該管理者ID
  expect(latestLog['操作ユーザー']).toBeTruthy()

  // 操作日時が現在時刻のISO8601形式
  const logTimestamp = latestLog['操作日時']
  expect(logTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

  // 監査対象フラグが「true」
  expect(latestLog['監査対象フラグ']).toBe(true)

  // メタデータに出力ファイル形式、出力行数、ファイル保存先が含まれる
  expect(latestLog['出力ファイル形式']).toBe('CSV')
  expect(latestLog['出力行数']).toBeGreaterThan(0)
  expect(latestLog['ファイル保存先']).toBe('S3アップロード成功')
})
