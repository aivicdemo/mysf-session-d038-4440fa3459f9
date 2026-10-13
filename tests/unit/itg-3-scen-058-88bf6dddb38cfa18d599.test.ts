import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-058: 参照チェーン全体が正常で、ステータス対応ルールと金額が全て許容範囲内のとき、検証合格と詳細情報を返す', () => {
  it('should return PASSED with detailed information when all validations pass', async () => {
    const input = {
      dealRecords: [
        {
          dealId: 'DEAL001',
          accountId: 'ACC001',
          dealStatus: 'Closed Won',
          dealAmount: 100000,
          invoiceIds: ['INV001'],
        },
        {
          dealId: 'DEAL002',
          accountId: 'ACC002',
          dealStatus: 'Closed Won',
          dealAmount: 50000,
          invoiceIds: ['INV002'],
        },
      ],
      invoiceRecords: [
        {
          invoiceId: 'INV001',
          accountId: 'ACC001',
          dealId: 'DEAL001',
          invoiceStatus: 'Paid',
          invoiceAmount: 100000,
        },
        {
          invoiceId: 'INV002',
          accountId: 'ACC002',
          dealId: 'DEAL002',
          invoiceStatus: 'Paid',
          invoiceAmount: 49500,
        },
      ],
      statusCorrespondenceRules: [
        {
          dealStatus: 'Closed Won',
          allowedInvoiceStatuses: ['Invoiced', 'Paid'],
        },
        {
          dealStatus: 'Draft',
          allowedInvoiceStatuses: ['Draft', 'Pending'],
        },
      ],
      amountToleranceCriteria: {
        tolerancePercentage: 1,
        toleranceAbsoluteAmount: 1000,
      },
      executionTimestamp: new Date('2025-01-15T10:00:00Z'),
    };

    const result = await validateDataIntegrityForMonthlyClose(input);

    expect(result.validationResult).toBe('PASSED');
    expect(result.totalDealsValidated).toBe(2);
    expect(result.totalInvoicesValidated).toBe(2);
    expect(result.referentialIntegrityViolations).toEqual([]);
    expect(result.statusCorrespondenceViolations).toEqual([]);
    expect(result.abnormalCasesList).toEqual([]);
    expect(result.executionTimestamp).toEqual(new Date('2025-01-15T10:00:00Z'));

    // Check amount discrepancies details
    expect(result.amountDiscrepancies).toHaveLength(2);
    expect(result.amountDiscrepancies[0]).toMatchObject({
      dealId: 'DEAL001',
      invoiceId: 'INV001',
      dealAmount: 100000,
      invoiceAmount: 100000,
      discrepancyAmount: 0,
      withinTolerance: true,
    });
    expect(result.amountDiscrepancies[1]).toMatchObject({
      dealId: 'DEAL002',
      invoiceId: 'INV002',
      dealAmount: 50000,
      invoiceAmount: 49500,
      discrepancyAmount: 500,
      withinTolerance: true,
    });
  });
});
