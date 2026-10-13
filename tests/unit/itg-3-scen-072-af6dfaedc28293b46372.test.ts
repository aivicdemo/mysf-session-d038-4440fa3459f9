import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-072: 金額許容基準のパーセンテージと絶対額の両方が指定されているとき', () => {
  it('いずれかの基準を超過すれば違反と判定される', async () => {
    const dealRecords = [
      {
        dealId: 'DEAL-001',
        accountId: 'ACC-001',
        dealStatus: 'closed_won',
        dealAmount: 10000,
        invoiceIds: ['INV-001'],
      },
    ];
    const invoiceRecords = [
      {
        invoiceId: 'INV-001',
        accountId: 'ACC-001',
        dealId: 'DEAL-001',
        invoiceStatus: 'issued',
        invoiceAmount: 10500,
      },
    ];
    const statusCorrespondenceRules = [
      {
        dealStatus: 'closed_won',
        allowedInvoiceStatuses: ['issued', 'paid'],
      },
    ];
    const amountToleranceCriteria = {
      tolerancePercentage: 3,
      toleranceAbsoluteAmount: 200,
    };
    const executionTimestamp = new Date('2026-01-15T10:00:00Z');

    const result = await validateDataIntegrityForMonthlyClose({
      dealRecords,
      invoiceRecords,
      statusCorrespondenceRules,
      amountToleranceCriteria,
      executionTimestamp,
    });

    expect(result.validationResult).toBe('FAILED_WITH_VIOLATIONS');
    expect(result.amountDiscrepancies).toContainEqual(
      expect.objectContaining({
        dealId: 'DEAL-001',
        invoiceId: 'INV-001',
        dealAmount: 10000,
        invoiceAmount: 10500,
        discrepancyAmount: 500,
        discrepancyPercentage: 5,
        withinTolerance: false,
      })
    );
    expect(result.abnormalCasesList.length).toBeGreaterThan(0);
    expect(result.abnormalCasesList.some((c) => c.violationTypes.includes('AmountDiscrepancy'))).toBe(true);
  });
});
