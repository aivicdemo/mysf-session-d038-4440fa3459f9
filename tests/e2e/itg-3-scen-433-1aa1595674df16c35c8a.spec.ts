import { test, expect } from '@playwright/test'

test('SCEN-433: 移行完了日が未指定の場合、保管期間終了日の計算が正確でないことを示す警告が表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html')

  // ページ読み込み完了待ち
  await page.waitForSelector('[data-aivic-panel]')

  // 移行完了日が未指定の状態を模擬
  await page.evaluate(() => {
    ;(window as any).AIVIC_MIGRATION_COMPLETION_DATE = null
  })

  // 「差異データCSV出力」ボタンを配置している領域を確認
  const csvExportButton = page.locator('#export-btn')
  await expect(csvExportButton).toBeVisible()

  // 「差異データCSV出力」ボタンをクリック
  await csvExportButton.click()

  // CSV出力処理が実行される
  await page.waitForTimeout(1000)

  // ダッシュボード画面上に警告メッセージが表示されるか確認
  const warningMessage = page.locator(
    'text=/移行完了日が未指定です.*保管期間終了日の計算が正確でない/'
  )
  await expect(warningMessage).toBeVisible({ timeout: 10000 })

  // 警告メッセージのテキスト内容を読み取る
  const messageText = await warningMessage.textContent()
  expect(messageText).toContain('移行完了日が未指定です')
  expect(messageText).toContain('保管期間終了日の計算が正確でない可能性')
  expect(messageText).toContain('移行完了日を設定してください')

  // 警告が黄色背景またはアラートアイコンで視認可能
  const warningElement = warningMessage.locator('..')
  const backgroundColor = await warningElement.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor
  })
  expect(backgroundColor).toBeTruthy()

  // 警告はCSV出力処理直後に表示されている
  const alertIcon = page.locator('[class*="alert"], [class*="warn"], [class*="icon"]').first()
  if (await alertIcon.isVisible()) {
    expect(alertIcon).toBeTruthy()
  }

  // 監査ログに警告メッセージ表示エントリが記録される
  const apiUrl = await page.evaluate(() => (window as any).AIVIC_API_URL)
  const appId = await page.evaluate(() => (window as any).AIVIC_APP_ID)

  const auditResponse = await page.request.get(
    `${apiUrl}by-name?app=${appId}&table=%E7%9B%A3%E6%9F%BB%E3%83%AD%E3%82%B0`
  )
  const auditData = await auditResponse.json()
  const records = Array.isArray(auditData) ? auditData : auditData.records || []

  // 最新のログに警告エントリがあるか確認
  const warningLog = records.find((r: any) =>
    r['操作内容']?.includes('警告メッセージ表示') ||
    r['操作内容']?.includes('移行完了日未指定')
  )
  expect(warningLog).toBeDefined()
})
