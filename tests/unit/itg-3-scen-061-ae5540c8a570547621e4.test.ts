import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-061: 請求書レコードが空のとき、参照チェーン検証警告が発生する', () => {
  it('空の請求書レコードで参照チェーン検証警告が発生する', async () => {
    const input = {
      dealRecords: [
        {
          dealId: 'DEAL001',
          accountId: 'ACC001',
          dealStatus: 'Closed Won',
          dealAmount: 100000,
          invoiceIds: ['INV001'],
        },
      ],
      invoiceRecords: [],
      statusCorrespondenceRules: [
        {
          dealStatus: 'Closed Won',
          allowedInvoiceStatuses: ['Invoiced', 'Paid'],
        },
      ],
      amountToleranceCriteria: {
        tolerancePercentage: 5,
        toleranceAbsoluteAmount: 1000,
      },
      executionTimestamp: new Date('2026-01-15T10:00:00Z'),
    };

    const result = await validateDataIntegrityForMonthlyClose(input);

    expect(result.validationResult).toBe('FAILED_WITH_WARNINGS');
    expect(result.totalDealsValidated).toBe(1);
    expect(result.totalInvoicesValidated).toBe(0);

    expect(result.referentialIntegrityViolations.length).toBeGreaterThanOrEqual(1);
    const missingRefViolation = result.referentialIntegrityViolations.find(
      (v) =>
        v.dealId === 'DEAL001' &&
        v.violationType === 'MISSING_REFERENCE'
    );
    expect(missingRefViolation).toBeDefined();
    expect(missingRefViolation?.invoiceId).toBeNull();
    expect(missingRefViolation?.description).toContain('参照チェーン検証エラー');
    expect(missingRefViolation?.description).toContain('参照先レコードが存在しません');

    expect(result.statusCorrespondenceViolations).toEqual([]);
    expect(result.amountDiscrepancies).toEqual([]);

    expect(result.abnormalCasesList.length).toBeGreaterThanOrEqual(1);
    const abnormalCase = result.abnormalCasesList.find(
      (c) => c.dealId === 'DEAL001'
    );
    expect(abnormalCase).toBeDefined();

    expect(result.executionTimestamp).toEqual(new Date('2026-01-15T10:00:00Z'));
  });
});
