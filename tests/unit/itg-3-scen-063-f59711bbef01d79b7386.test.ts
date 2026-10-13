import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-063: 商談が指す取引先IDが請求書に存在しないとき、参照先不在違反として検出される', () => {
  it('商談の取引先IDと請求書の取引先IDの不一致が検出される', async () => {
    const input = {
      dealRecords: [
        {
          dealId: 'DEAL-001',
          accountId: 'ACC-100',
          dealStatus: 'Closed Won',
          dealAmount: 100000,
          invoiceIds: ['INV-001'],
        },
        {
          dealId: 'DEAL-002',
          accountId: 'ACC-200',
          dealStatus: 'Negotiation',
          dealAmount: 50000,
          invoiceIds: ['INV-002'],
        },
      ],
      invoiceRecords: [
        {
          invoiceId: 'INV-001',
          accountId: 'ACC-100',
          dealId: 'DEAL-001',
          invoiceStatus: 'Paid',
          invoiceAmount: 100000,
        },
        {
          invoiceId: 'INV-002',
          accountId: 'ACC-999',
          dealId: 'DEAL-002',
          invoiceStatus: 'Draft',
          invoiceAmount: 50000,
        },
      ],
      statusCorrespondenceRules: [
        {
          dealStatus: 'Closed Won',
          allowedInvoiceStatuses: ['Paid', 'Invoiced'],
        },
        {
          dealStatus: 'Negotiation',
          allowedInvoiceStatuses: ['Draft', 'Invoiced'],
        },
      ],
      amountToleranceCriteria: {
        tolerancePercentage: 5,
        toleranceAbsoluteAmount: 1000,
      },
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    const result = await validateDataIntegrityForMonthlyClose(input);

    expect(result.validationResult).toBe('FAILED_WITH_VIOLATIONS');

    expect(result.referentialIntegrityViolations.length).toBeGreaterThanOrEqual(1);
    const violation = result.referentialIntegrityViolations.find(
      (v) =>
        v.dealId === 'DEAL-002' &&
        v.invoiceId === 'INV-002' &&
        v.violationType === 'MISSING_REFERENCE'
    );
    expect(violation).toBeDefined();
    expect(violation?.description).toContain('参照チェーン検証エラー');

    expect(result.totalDealsValidated).toBe(2);
    expect(result.totalInvoicesValidated).toBe(2);

    expect(result.abnormalCasesList.length).toBeGreaterThanOrEqual(1);
    const abnormalCase = result.abnormalCasesList.find(
      (c) => c.dealId === 'DEAL-002' && c.invoiceId === 'INV-002'
    );
    expect(abnormalCase).toBeDefined();
    expect(abnormalCase?.violationTypes).toContain('MISSING_REFERENCE');
    expect(abnormalCase?.severity).toBe('CRITICAL');
    expect(abnormalCase?.correctionRequired).toBe(true);
    expect(abnormalCase?.assignedTo).toBeNull();

    expect(result.executionTimestamp).toEqual(new Date('2025-01-15T10:00:00Z'));
  });
});
