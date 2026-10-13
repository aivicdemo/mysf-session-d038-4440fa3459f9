import { test, expect } from '@playwright/test';

test('SCEN-425: プロジェクトコンテキストと移行対象システムが正常に解決され、以降の処理の基盤が確立される', async ({ page }) => {
  await page.goto('/panels/scr-1791354749663.html');

  // 新規プロジェクト作成ボタンをクリック
  const createProjectBtn = page.locator('[data-role="create-project-btn"]');
  await createProjectBtn.click();

  // プロジェクト名入力
  const projectNameInput = page.locator('[data-field="project-name"]');
  await projectNameInput.fill('Oracle ERP請求移行 v1');

  // Organization ID入力
  const orgIdInput = page.locator('[data-field="organization-id"]');
  await orgIdInput.fill('00Dxx0000000001');

  // 移行対象システムドロップダウンから「Oracle ERP」を選択
  const systemDropdown = page.locator('[data-field="migration-system"]');
  await systemDropdown.click();
  const oracleOption = page.locator('[data-value="oracle-erp"]');
  await oracleOption.click();

  // 「メタデータ初期同期」ボタンをクリック
  const metadataSyncBtn = page.locator('[data-role="metadata-sync-btn"]');
  await metadataSyncBtn.click();

  // ローディング表示を確認
  const loading = page.locator('[data-role="loading-indicator"]');
  await expect(loading).toBeVisible();

  // 「プロジェクト初期化」ボタンをクリック
  const projectInitBtn = page.locator('[data-role="project-init-btn"]');
  await projectInitBtn.waitFor({ state: 'visible', timeout: 10000 });
  await projectInitBtn.click();

  // ローディング消去を待機
  await loading.waitFor({ state: 'hidden', timeout: 10000 });

  // プロジェクト情報ペインの確認
  const projectInfoPane = page.locator('[data-role="project-info-pane"]');
  await expect(projectInfoPane).toBeVisible();

  const projectNameDisplay = projectInfoPane.locator('[data-field="project-name"]');
  await expect(projectNameDisplay).toContainText('Oracle ERP請求移行 v1');

  // 初期化完了日時の確認（当日のタイムスタンプ）
  const initDateDisplay = projectInfoPane.locator('[data-field="initialized-date"]');
  await expect(initDateDisplay).toHaveValue(/\d{4}-\d{2}-\d{2}/);

  // Salesforceメタデータセクション
  const sfMetadataSection = page.locator('[data-role="sf-metadata-section"]');
  await expect(sfMetadataSection).toBeVisible();

  // メタデータテーブルに「Invoice_c」「InvoiceLine_c」が表示
  const invoiceObjRow = sfMetadataSection.locator('[data-object="Invoice_c"]');
  const invoiceLineObjRow = sfMetadataSection.locator('[data-object="InvoiceLine_c"]');
  await expect(invoiceObjRow).toBeVisible();
  await expect(invoiceLineObjRow).toBeVisible();

  // ステータス表示が「同期完了」で緑色
  const sfStatusBadge = sfMetadataSection.locator('[data-role="sync-status"]');
  await expect(sfStatusBadge).toContainText('同期完了');
  await expect(sfStatusBadge).toHaveClass(/status-success|status-green/);

  // 移行対象システムメタデータセクション
  const targetMetadataSection = page.locator('[data-role="target-metadata-section"]');
  await expect(targetMetadataSection).toBeVisible();

  const arInvoicesRow = targetMetadataSection.locator('[data-table="AR_INVOICES_ALL"]');
  const arInvoiceLinesRow = targetMetadataSection.locator('[data-table="AR_INVOICE_LINES_ALL"]');
  await expect(arInvoicesRow).toBeVisible();
  await expect(arInvoiceLinesRow).toBeVisible();

  // ステータス表示が「同期完了」で緑色
  const targetStatusBadge = targetMetadataSection.locator('[data-role="sync-status"]');
  await expect(targetStatusBadge).toContainText('同期完了');
  await expect(targetStatusBadge).toHaveClass(/status-success|status-green/);

  // 参照関係ペイン
  const relationshipPane = page.locator('[data-role="relationship-pane"]');
  await expect(relationshipPane).toBeVisible();

  const sfRelationship = relationshipPane.locator('[data-side="sf"]');
  const targetRelationship = relationshipPane.locator('[data-side="target"]');
  await expect(sfRelationship).toContainText('Invoice_c');
  await expect(targetRelationship).toContainText('AR_INVOICES_ALL');

  // ヘッダーのプロジェクトステータス
  const headerStatus = page.locator('[data-role="project-status-header"]');
  await expect(headerStatus).toContainText('初期化済み');

  // ナビゲーションボタンが有効化
  const mappingDefBtn = page.locator('[data-role="mapping-definition-btn"]');
  const validationBtn = page.locator('[data-role="validation-btn"]');
  const riskEvalBtn = page.locator('[data-role="risk-evaluation-btn"]');

  await expect(mappingDefBtn).toBeEnabled();
  await expect(validationBtn).toBeEnabled();
  await expect(riskEvalBtn).toBeEnabled();

  // 警告メッセージが表示されない
  const warningMessage = page.locator('[data-role="warning-message"]');
  await expect(warningMessage).not.toBeVisible();
});
