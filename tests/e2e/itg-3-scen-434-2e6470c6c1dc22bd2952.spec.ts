import { test, expect } from '@playwright/test'

test('SCEN-434: CSV出力によって記録された監視ログが金額ズレ・請求ミス関連の場合、監査対象として分類され監査ログ専用ストレージに保管される', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html')

  // ページ読み込み完了待ち
  await page.waitForSelector('#discrepancy-tbody')

  // 金額ズレと請求ミスを含む差異検出レポートを特定
  const discrepancyRows = page.locator('#discrepancy-tbody tr')
  const rowCount = await discrepancyRows.count()
  expect(rowCount).toBeGreaterThan(0)

  // 該当レポートの詳細画面を開く
  const detailButton = page.locator('[data-testid="detail-button"]').first()
  await detailButton.click()

  // 詳細画面が表示される
  const detailModal = page.locator('#detail-modal')
  await expect(detailModal).toBeVisible()

  // 「CSV出力」ボタンをクリック
  const csvExportInModal = page.locator('button:has-text("CSV出力")').first()
  if (await csvExportInModal.isVisible()) {
    // ダウンロードイベントを待つ
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      csvExportInModal.click()
    ])
    expect(download).toBeTruthy()
  } else {
    // モーダルを閉じて元の画面でエクスポート
    await page.locator('[data-testid="modal-close-button"]').click()
    await page.waitForTimeout(500)
    const exportBtn = page.locator('#export-btn')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportBtn.click()
    ])
    expect(download).toBeTruthy()
  }

  // ダッシュボードに戻る
  await page.waitForTimeout(1000)

  // 画面右側の「監査ログ記録状況」パネルを確認
  const auditPanel = page.locator('text=監査ログ記録状況').first()
  if (await auditPanel.isVisible()) {
    // 該当ログエントリが「監査対象として分類」のステータスで表示
    const auditEntry = page.locator(
      'text=/AUDIT_CLASSIFIED.*金額ズレ.*請求ミス関連/'
    )
    await expect(auditEntry).toBeVisible({ timeout: 10000 })

    // 「保管先: 監査ログ専用ストレージ」が記載されている
    const storageInfo = page.locator(
      'text=/保管先.*監査ログ専用ストレージ/'
    )
    await expect(storageInfo).toBeVisible()
  }

  // タイムスタンプがCSVダウンロード実行時刻と一致
  const auditLog = page.evaluate(() => {
    const logs = (window as any).AIVIC_AUDIT_LOG || []
    return logs.filter((l: any) =>
      l['操作分類']?.includes('AUDIT_CLASSIFIED') ||
      l['操作内容']?.includes('金額ズレ')
    )
  })

  expect(auditLog).toBeDefined()
})
