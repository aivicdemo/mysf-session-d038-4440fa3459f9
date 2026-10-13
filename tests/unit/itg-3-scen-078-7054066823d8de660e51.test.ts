import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';
import type { ValidateDataIntegrityForMonthlyCloseInput } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-078: 修正が必要な異常案件に対して、担当者割り当て対象フラグが正確に立てられる', () => {
  it('修正が必要な案件について、severity が CRITICAL または HIGH で担当者が割り当てられる', async () => {
    // Preconditions setup
    const executionTimestamp = new Date('2025-01-15T10:00:00Z');

    const dealRecords = [
      {
        dealId: 'DEAL-001',
        accountId: 'ACC-001',
        dealStatus: 'closed_won',
        dealAmount: 100000,
        invoiceIds: ['INV-001'],
      },
      {
        dealId: 'DEAL-002',
        accountId: 'ACC-002',
        dealStatus: 'closed_won',
        dealAmount: 50000,
        invoiceIds: ['INV-002'],
      },
      {
        dealId: 'DEAL-003',
        accountId: 'ACC-003',
        dealStatus: 'proposal',
        dealAmount: 75000,
        invoiceIds: [],
      },
    ];

    const invoiceRecords = [
      {
        invoiceId: 'INV-001',
        accountId: 'ACC-001',
        dealId: 'DEAL-001',
        invoiceStatus: 'paid',
        invoiceAmount: 100000,
      },
      {
        invoiceId: 'INV-002',
        accountId: 'ACC-002',
        dealId: 'DEAL-002',
        invoiceStatus: 'draft',
        invoiceAmount: 50000,
      },
    ];

    const statusCorrespondenceRules = [
      {
        dealStatus: 'closed_won',
        allowedInvoiceStatuses: ['invoiced', 'paid', 'partially_paid'],
      },
      {
        dealStatus: 'proposal',
        allowedInvoiceStatuses: ['draft', 'pending'],
      },
    ];

    const amountToleranceCriteria = {
      tolerancePercentage: 5,
      toleranceAbsoluteAmount: 1000,
    };

    const input: ValidateDataIntegrityForMonthlyCloseInput = {
      dealRecords,
      invoiceRecords,
      statusCorrespondenceRules,
      amountToleranceCriteria,
      executionTimestamp,
    };

    // Execute
    const output = await validateDataIntegrityForMonthlyClose(input);

    // Expected result verification
    expect(output.validationResult).toBe('FAILED_WITH_VIOLATIONS');
    expect(output.totalDealsValidated).toBe(3);
    expect(output.totalInvoicesValidated).toBe(2);

    // DEAL-001: 違反なし
    const deal001Case = output.abnormalCasesList.find((c) => c.dealId === 'DEAL-001');
    // deal001CaseがundefinedまたはcorrectionRequired=falseであることを確認
    if (deal001Case) {
      expect(deal001Case.correctionRequired).toBe(false);
    }

    // DEAL-002: StatusCorrespondenceViolation が検出される
    // dealStatus='closed_won'、invoiceStatus='draft'で規則に違反
    // severity='HIGH', correctionRequired=true で、修正対象フラグが立つべき
    const deal002Case = output.abnormalCasesList.find((c) => c.dealId === 'DEAL-002');
    expect(deal002Case).toBeDefined();
    if (deal002Case) {
      expect(deal002Case.invoiceId).toBe('INV-002');
      expect(deal002Case.violationTypes).toContain('StatusCorrespondenceViolation');
      expect(deal002Case.severity).toBe('HIGH');
      expect(deal002Case.correctionRequired).toBe(true);
      // 修正が必要な HIGH 違反案件には assignedTo が非 null である
      expect(deal002Case.assignedTo).not.toBeNull();
    }

    // DEAL-003: invoiceIds=[] で請求書がない
    // dealStatus='proposal' で未成約のため、ReferentialIntegrityViolation が検出される場合
    // ビジネスロジック上、提案段階では請求書なしが正常のため、correctionRequired=false または assignedTo=null
    const deal003Case = output.abnormalCasesList.find((c) => c.dealId === 'DEAL-003');
    if (deal003Case) {
      // 提案段階では請求書が不要なため、correctionRequired=false であること
      expect(deal003Case.correctionRequired).toBe(false);
      expect(deal003Case.assignedTo).toBeNull();
    }
  });
});
