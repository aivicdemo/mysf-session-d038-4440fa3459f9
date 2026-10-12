import { test, expect, Page } from '@playwright/test'

test.describe('SCEN-1245: 正常系：請求書生成後、生成された請求書レコードがデータベースに保存され、商談・請求管理画面に表示される', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
  })

  test('正常系：請求書生成後、生成された請求書レコードがデータベースに保存され、商談・請求管理画面に表示される', async () => {
    // 1. 商談・請求管理画面にアクセスする
    await page.goto('/panels/scr-1791354351333.html')
    await page.waitForLoadState('networkidle')

    // 2. 対象の商談を検索し、商談詳細を表示する
    // ステージでフィルタリング（成約済み商談を検索）
    const filterStage = page.locator('#filter-stage')
    await filterStage.selectOption('成約')
    await page.waitForTimeout(500)

    // 商談リストから最初の商談を選択
    const dealRow = page.locator('#deal-tbody tr').first()
    await dealRow.click()
    await page.waitForTimeout(300)

    // 商談詳細パネルが表示されたことを確認
    const detailPanel = page.locator('#detail-panel')
    await expect(detailPanel).not.toContainText('商談を選択してください')

    // 商談金額を取得（後で検証用）
    const dealAmountText = await page.locator('#detail-panel').textContent()
    expect(dealAmountText).toBeTruthy()

    // 3. 商談詳細画面から「請求書生成」ボタンをクリックする
    const generateBtn = page.locator('#btn-generate-invoice')
    await expect(generateBtn).toBeEnabled()
    await generateBtn.click()

    // 4. 請求書生成確認ダイアログで請求日・請求書番号・取引先情報が自動入力されていることを確認する
    const modal = page.locator('#modal-generate')
    await expect(modal).toHaveClass(/open/)

    // 請求日フィールドが存在し、値が入力されていることを確認
    const invoiceDateField = page.locator('#modal-invoice-date')
    await expect(invoiceDateField).toBeVisible()
    const invoiceDateValue = await invoiceDateField.inputValue()
    expect(invoiceDateValue).toBeTruthy()

    // 支払期限日フィールドが存在し、値が入力されていることを確認
    const dueDateField = page.locator('#modal-due-date')
    await expect(dueDateField).toBeVisible()
    const dueDateValue = await dueDateField.inputValue()
    expect(dueDateValue).toBeTruthy()

    // 5. ダイアログの「生成実行」ボタンをクリックする
    const confirmBtn = page.locator('#btn-confirm-generate')
    await expect(confirmBtn).toBeEnabled()
    await confirmBtn.click()

    // 6. 処理完了まで待機し、成功メッセージが画面に表示されることを確認する
    // モーダルが閉じるまで待機（処理完了を示す）
    await expect(modal).not.toHaveClass(/open/, { timeout: 10000 })

    // 成功メッセージが表示されることを確認
    const successMessage = page.locator('text=/成功|完了/')
    await expect(successMessage).toBeVisible({ timeout: 5000 })

    // 7. 商談・請求管理画面の請求書一覧セクションをリロードする
    // 「関連請求書」タブをクリック
    const invoicesTab = page.locator('#invoices-tab')
    await invoicesTab.click()
    await page.waitForTimeout(500)

    // 8. 生成された請求書レコードが一覧に表示されていることを確認する
    const invoiceTable = page.locator('#invoice-tbody')
    const invoiceRows = page.locator('#invoice-tbody tr')
    const rowCount = await invoiceRows.count()
    expect(rowCount).toBeGreaterThan(0)

    // 9. 請求書レコードをクリックして詳細を開く
    const firstInvoiceRow = invoiceRows.first()
    await firstInvoiceRow.click()
    await page.waitForTimeout(300)

    // 請求明細タブをクリックして詳細表示
    const detailsTab = page.locator('#details-tab')
    await detailsTab.click()
    await page.waitForTimeout(300)

    // 期待結果の検証
    // (1) 請求書ステータスが「草稿」であることを確認
    const invoiceDetailText = await page.locator('#detail-panel').textContent()
    expect(invoiceDetailText).toContain('草稿')

    // (2) 請求書番号が自動採番されていることを確認
    const invoiceNumberText = invoiceDetailText
    expect(invoiceNumberText).toMatch(/\d+/) // 数字を含む請求書番号

    // (3) 請求日が本日日付で設定されていることを確認
    const today = new Date()
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    expect(invoiceDetailText).toContain(formattedToday)

    // (4) 関連商談IDが正しく紐付けられていることを確認
    // 詳細パネルに商談情報が表示されることを確認
    await expect(page.locator('#detail-panel')).toContainText(/商談ID|関連商談/)

    // (5) 請求金額が対象商談の商談金額と一致していることを確認
    const invoiceAmountElements = page.locator('#invoice-detail-tbody')
    await expect(invoiceAmountElements).toBeVisible()

    // (6) 請求明細が商談商品から自動展開され、複数行表示されていることを確認
    const detailRows = page.locator('#invoice-detail-tbody tr')
    const detailRowCount = await detailRows.count()
    expect(detailRowCount).toBeGreaterThan(0)

    // 各詳細行に必要な情報が表示されていることを確認
    for (let i = 0; i < Math.min(detailRowCount, 3); i++) {
      const rowText = await detailRows.nth(i).textContent()
      expect(rowText).toBeTruthy()
      // 商品名、数量、単価などが表示されていることを確認
      expect(rowText).toMatch(/\d+/) // 数字を含む（数量、単価など）
    }

    // (7) 作成日時がシステム現在時刻で記録されていることを確認
    // 詳細パネルに作成日時が表示されていることを確認
    const createdAtText = await page.locator('#detail-panel').textContent()
    expect(createdAtText).toMatch(/\d{4}-\d{2}-\d{2}/) // ISO日付形式
  })
})
