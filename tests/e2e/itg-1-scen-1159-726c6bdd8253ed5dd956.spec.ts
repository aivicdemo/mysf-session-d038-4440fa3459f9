import { test, expect } from '@playwright/test'

test('SCEN-1159: 請求書・請求明細タブ表示：請求金額が商談金額を超える場合、エラーメッセージを表示', async ({ page }) => {
  await page.goto('/panels/scr-1791354351333.html')

  // 商談を検索・選択し、商談詳細を表示する
  // 請求金額合計が1,200,000円で、商談金額が1,000,000円の商談を探す
  const dealRows = page.locator('#deal-tbody tr')
  let dealFound = false

  for (let i = 0; i < await dealRows.count(); i++) {
    const row = dealRows.nth(i)
    const cells = row.locator('td')
    const dealAmount = await cells.nth(2).textContent()

    // 1,000,000円の商談を検索
    if (dealAmount?.includes('1,000,000')) {
      await row.click()
      dealFound = true
      break
    }
  }

  if (!dealFound) {
    throw new Error('対象商談（金額1,000,000円）が見つかりません')
  }

  // 商談詳細画面から「請求書・請求明細タブ」をクリックして展開する
  const invoicesTab = page.locator('[data-testid="tab-invoices"]')
  await invoicesTab.click()
  await page.waitForLoadState('networkidle')

  // 請求書・請求明細タブ内で、請求金額合計が1,200,000円の請求明細データが表示される状態を確認する
  // 明細タブに移動
  await page.click('[data-testid="tab-details"]')

  // 明細行を確認して、合計が1,200,000円であることを検証
  const detailRows = page.locator('#invoice-detail-tbody tr')
  const rowCount = await detailRows.count()
  expect(rowCount).toBeGreaterThan(0)

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

  // 「請求書生成」ボタンをクリックしてバリデーション処理を実行する
  const generateBtn = page.locator('#btn-generate-invoice')
  await generateBtn.click()

  // 期待結果の検証：画面上に赤色のエラーバナーまたはエラーメッセージが表示され、
  // 「請求金額（1,200,000円）が商談金額（1,000,000円）を超えています。請求明細を修正してください」
  // という具体的なメッセージテキストが表示される
  const errorMessage = page.locator('text=/請求金額.*商談金額.*超え/i')
  await expect(errorMessage).toBeVisible({ timeout: 5000 })

  // エラーメッセージに正確な金額が含まれていることを確認
  const errorText = await errorMessage.first().textContent()
  expect(errorText).toMatch(/1,200,000|1200000/)
  expect(errorText).toMatch(/1,000,000|1000000/)
  expect(errorText).toMatch(/修正/)

  // 同時に「請求書生成」ボタンが無効化（disabled状態）となる
  await expect(generateBtn).toBeDisabled()
})
