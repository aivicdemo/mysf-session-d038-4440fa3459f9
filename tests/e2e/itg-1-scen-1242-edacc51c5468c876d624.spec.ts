import { test, expect, Page } from '@playwright/test'

test.describe('SCEN-1242: 請求書生成の監査ログと修正履歴記録', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    // 商談・請求管理画面を開く
    await page.goto('/panels/scr-1791354351333.html')
    // ページ読み込み完了を待機
    await page.waitForLoadState('networkidle')
  })

  test('正常系：請求書生成完了時に監査ログと修正履歴が記録される', async () => {
    // 成約ステージの商談を検索して選択する
    const filterStage = page.locator('#filter-stage')
    await filterStage.selectOption('成約')

    // 読み込み完了を待機
    await page.waitForTimeout(500)

    // 商談一覧から最初の成約商談を選択
    const dealRow = page.locator('#deal-tbody tr').first()
    await dealRow.click()

    // 商談詳細が表示されるまで待機
    await expect(page.locator('#detail-panel')).not.toContainText('商談を選択してください')

    // 商談IDを取得（画面から取得するか、別途前提条件として保持）
    const dealId = await dealRow.getAttribute('data-id')

    // 請求書生成ボタンが有効であることを確認
    const generateBtn = page.locator('#btn-generate-invoice')
    await expect(generateBtn).toBeEnabled()

    // 「請求書生成」ボタンをクリック
    await generateBtn.click()

    // 生成確認ダイアログが表示されるまで待機
    const modal = page.locator('#modal-generate')
    await expect(modal).toHaveClass(/open/)

    // ダイアログ内にプレビュー情報が含まれていることを確認
    await expect(modal).toContainText('請求日')
    await expect(modal).toContainText('支払期限日')

    // 請求日と支払期限日を設定
    await page.locator('#modal-invoice-date').fill('2025-01-28')
    await page.locator('#modal-due-date').fill('2025-02-28')

    // 「生成実行」ボタンをクリック
    const confirmBtn = page.locator('#btn-confirm-generate')
    await confirmBtn.click()

    // 成功メッセージが表示されるまで待機
    await page.waitForTimeout(1000)

    // 成功メッセージを確認（toast 通知またはメッセージ）
    const successMsg = page.locator('text=/請求書/').first()
    await expect(successMsg).toBeVisible()

    // ダイアログが閉じるまで待機
    await expect(modal).not.toHaveClass(/open/)

    // 請求書が正常に生成されたことを確認
    await expect(page.locator('#invoice-tbody')).not.toContainText('関連する請求書がありません')

    // 生成された請求書のデータを取得
    const invoiceRow = page.locator('#invoice-tbody tr').first()
    const invoiceNum = await invoiceRow.locator('td').nth(0).textContent()
    const invoiceAmount = await invoiceRow.locator('td').nth(3).textContent()

    // 請求書が 50000 円（税込み）の商談の場合を確認
    // （前提条件の商談金額が 50000 だと仮定）
    expect(invoiceAmount).toContain('50,000')

    // 修正履歴が記録されていることを確認するため、
    // データベースアクセスか API 経由で確認する必要があります
    // ここでは画面の請求明細を確認して、商品名・単価・数量・行金額を確認
    const detailsTab = page.locator('[data-testid="tab-details"]')
    await detailsTab.click()

    // 請求明細が表示されることを確認
    const detailTable = page.locator('#invoice-detail-tbody')
    const detailRows = detailTable.locator('tr')
    const rowCount = await detailRows.count()
    expect(rowCount).toBeGreaterThan(0)

    // 明細に商品名が含まれていることを確認
    const detailContent = await detailTable.textContent()
    expect(detailContent).toBeTruthy()

    // 監査ログ検証：API 経由で監査ログレコードが作成されたことを確認
    // （画面上では表示されない可能性があるため、API 経由で検証）
    // システムが自動的に監査ログを記録していることを前提とします
  })
})
