import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-069: 請求金額と商談金額が不一致だが許容基準内のとき', () => {
  it('金額ズレが許容範囲内として検出される', async () => {
    const dealRecords = [
      {
        dealId: 'DEAL-001',
        accountId: 'ACC-001',
        dealStatus: 'closed_won',
        dealAmount: 100000,
        invoiceIds: ['INV-001'],
      },
    ];
    const invoiceRecords = [
      {
        invoiceId: 'INV-001',
        accountId: 'ACC-001',
        dealId: 'DEAL-001',
        invoiceStatus: 'issued',
        invoiceAmount: 101500,
      },
    ];
    const statusCorrespondenceRules = [
      {
        dealStatus: 'closed_won',
        allowedInvoiceStatuses: ['issued', 'paid'],
      },
    ];
    const amountToleranceCriteria = {
      tolerancePercentage: 2,
      toleranceAbsoluteAmount: 5000,
    };
    const executionTimestamp = new Date('2024-02-29T23:59:59Z');

    const result = await validateDataIntegrityForMonthlyClose({
      dealRecords,
      invoiceRecords,
      statusCorrespondenceRules,
      amountToleranceCriteria,
      executionTimestamp,
    });

    expect(result.validationResult).toBe('PASSED');
    expect(result.totalDealsValidated).toBe(1);
    expect(result.totalInvoicesValidated).toBe(1);
    expect(result.referentialIntegrityViolations).toEqual([]);
    expect(result.statusCorrespondenceViolations).toEqual([]);
    expect(result.amountDiscrepancies).toContainEqual(
      expect.objectContaining({
        dealId: 'DEAL-001',
        invoiceId: 'INV-001',
        dealAmount: 100000,
        invoiceAmount: 101500,
        discrepancyAmount: 1500,
        discrepancyPercentage: 1.5,
        withinTolerance: true,
      })
    );
    expect(result.abnormalCasesList).toEqual([]);
    expect(result.executionTimestamp).toEqual(new Date('2024-02-29T23:59:59Z'));
  });
});
