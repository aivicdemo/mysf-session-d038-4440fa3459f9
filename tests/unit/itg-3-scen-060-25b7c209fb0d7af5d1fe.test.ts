import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-060: 商談レコードが空のとき、参照チェーン検証警告が発生する', () => {
  it('空の商談レコードで参照チェーン検証警告が発生する', async () => {
    const input = {
      dealRecords: [],
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
      executionTimestamp: new Date('2025-01-31T23:59:59Z'),
    };

    const result = await validateDataIntegrityForMonthlyClose(input);

    expect(result.validationResult).toBe('FAILED_WITH_WARNINGS');
    expect(result.totalDealsValidated).toBe(0);
    expect(result.totalInvoicesValidated).toBe(1);
    expect(result.referentialIntegrityViolations.length).toBeGreaterThanOrEqual(1);

    const missingRefViolation = result.referentialIntegrityViolations.find(
      (v) => v.violationType === 'MISSING_REFERENCE' && v.invoiceId === 'INV-001'
    );
    expect(missingRefViolation).toBeDefined();
    expect(missingRefViolation?.description).toContain('商談レコードが見つかりません');

    expect(result.abnormalCasesList.length).toBeGreaterThanOrEqual(1);
    const abnormalCase = result.abnormalCasesList.find(
      (c) => c.invoiceId === 'INV-001'
    );
    expect(abnormalCase).toBeDefined();
    expect(abnormalCase?.violationTypes).toContain('MISSING_REFERENCE');
    expect(['HIGH', 'MEDIUM']).toContain(abnormalCase?.severity);
    expect(abnormalCase?.correctionRequired).toBe(true);

    expect(result.executionTimestamp).toEqual(new Date('2025-01-31T23:59:59Z'));
  });
});
