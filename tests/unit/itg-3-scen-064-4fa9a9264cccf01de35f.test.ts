import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-064: 商談に関連する請求書IDが指定されているが請求書レコードに存在しないとき、参照チェーン欠落違反として検出される', () => {
  it('商談が参照する請求書IDが存在しないとき参照チェーン欠落違反として検出される', async () => {
    const input = {
      dealRecords: [
        {
          dealId: 'DEAL-001',
          accountId: 'ACC-001',
          dealStatus: 'closed_won',
          dealAmount: 100000,
          invoiceIds: ['INV-001', 'INV-MISSING-002'],
        },
      ],
      invoiceRecords: [
        {
          invoiceId: 'INV-001',
          accountId: 'ACC-001',
          dealId: 'DEAL-001',
          invoiceStatus: 'issued',
          invoiceAmount: 100000,
        },
      ],
      statusCorrespondenceRules: [
        {
          dealStatus: 'closed_won',
          allowedInvoiceStatuses: ['issued', 'paid'],
        },
      ],
      amountToleranceCriteria: {
        tolerancePercentage: 5,
        toleranceAbsoluteAmount: 1000,
      },
      executionTimestamp: new Date('2025-01-15T10:30:00Z'),
    };

    const result = await validateDataIntegrityForMonthlyClose(input);

    expect(result.validationResult).toBe('FAILED_WITH_VIOLATIONS');

    expect(result.referentialIntegrityViolations.length).toBeGreaterThanOrEqual(1);
    const violation = result.referentialIntegrityViolations.find(
      (v) =>
        v.dealId === 'DEAL-001' &&
        v.invoiceId === 'INV-MISSING-002' &&
        v.violationType === 'MISSING_REFERENCE'
    );
    expect(violation).toBeDefined();
    expect(violation?.description).toContain('参照チェーン検証エラー');
    expect(violation?.description).toContain('参照先レコードが存在しません');

    expect(result.abnormalCasesList.length).toBeGreaterThanOrEqual(1);
    const abnormalCase = result.abnormalCasesList.find(
      (c) => c.dealId === 'DEAL-001' && c.invoiceId === 'INV-MISSING-002'
    );
    expect(abnormalCase).toBeDefined();
    expect(abnormalCase?.violationTypes).toContain('MISSING_REFERENCE');
    expect(abnormalCase?.severity).toBe('CRITICAL');
    expect(abnormalCase?.correctionRequired).toBe(true);

    expect(result.totalDealsValidated).toBe(1);
    expect(result.totalInvoicesValidated).toBe(1);
  });
});
