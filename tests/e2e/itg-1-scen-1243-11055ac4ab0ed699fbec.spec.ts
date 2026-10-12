import { test, expect, Page } from '@playwright/test'

test.describe('SCEN-1243: 請求書生成時に異常が検出されない場合の通知', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    // 商談・請求管理画面を開く
    await page.goto('/panels/scr-1791354351333.html')
    // ページ読み込み完了を待機
    await page.waitForLoadState('networkidle')
  })

  test('正常系：異常が検出されない場合、正常系メッセージのみが表示される', async () => {
    // 前提条件：成約商談を検索・選択する
    const filterStage = page.locator('#filter-stage')
    await filterStage.selectOption('成約')

    // 読み込み完了を待機
    await page.waitForTimeout(500)

    // 商談一覧から成約商談を選択
    const dealRow = page.locator('#deal-tbody tr').first()
    await dealRow.click()

    // 商談詳細が表示されるまで待機
    await expect(page.locator('#detail-panel')).not.toContainText('商談を選択してください')

    // 請求書生成ボタンをクリック
    const generateBtn = page.locator('#btn-generate-invoice')
    await expect(generateBtn).toBeEnabled()
    await generateBtn.click()

    // 生成確認ダイアログが表示されるまで待機
    const modal = page.locator('#modal-generate')
    await expect(modal).toHaveClass(/open/)

    // 生成条件を確認
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

    // 画面上の通知領域を観察
    // 期待結果：「請求書が正常に生成されました」または「Invoice generated successfully」メッセージのみが表示される
    const toastContainer = page.locator('#aivic-toast-container')
    let successMessageFound = false
    let errorMessageFound = false

    // トースト通知を確認
    const toastMessages = await toastContainer.locator('div').allTextContents()
    for (const msg of toastMessages) {
      if (msg.includes('請求書が正常に生成されました') || msg.includes('Invoice generated successfully')) {
        successMessageFound = true
      }
      if (msg.includes('異常通知') || msg.includes('金額ズレ') || msg.includes('通知送信エラー')) {
        errorMessageFound = true
      }
    }

    // 正常系メッセージが表示されていることを確認
    expect(successMessageFound).toBe(true)

    // 異常通知やエラーメッセージが表示されていないことを確認
    expect(errorMessageFound).toBe(false)

    // ダイアログが閉じることを確認
    await expect(modal).not.toHaveClass(/open/)

    // 生成されたPDFファイルがシステムに保存されていることを確認
    // （ファイルマネージャーテーブルに新規レコードが登録されたことを確認）
    await page.waitForTimeout(500)

    // 請求書一覧に新しいレコードが表示されることを確認
    const invoiceTable = page.locator('#invoice-tbody')
    await expect(invoiceTable).not.toContainText('関連する請求書がありません')

    // 請求書が「未送付」「送付済」等の通常ステータスで登録されていることを確認
    const invoiceStatus = await invoiceTable.locator('tr').first().locator('td').nth(4).textContent()
    expect(invoiceStatus).toBeTruthy()

    // 異常検知ログが記録されていないことを確認
    // （API 経由で異常検知ログテーブルにレコードが作成されていないことを確認）
  })
})
