import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-068: 請求金額と商談金額が不一致で許容基準を超過するとき', () => {
  it('金額ズレが許容範囲外として検出される', async () => {
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
        invoiceAmount: 115000,
      },
    ];
    const statusCorrespondenceRules = [
      {
        dealStatus: 'closed_won',
        allowedInvoiceStatuses: ['issued', 'paid'],
      },
    ];
    const amountToleranceCriteria = {
      tolerancePercentage: 5,
      toleranceAbsoluteAmount: 3000,
    };
    const executionTimestamp = new Date('2026-01-15T09:00:00Z');

    const result = await validateDataIntegrityForMonthlyClose({
      dealRecords,
      invoiceRecords,
      statusCorrespondenceRules,
      amountToleranceCriteria,
      executionTimestamp,
    });

    expect(result.amountDiscrepancies).toContainEqual(
      expect.objectContaining({
        dealId: 'DEAL-001',
        invoiceId: 'INV-001',
        dealAmount: 100000,
        invoiceAmount: 115000,
        discrepancyAmount: 15000,
        discrepancyPercentage: 15,
        withinTolerance: false,
      })
    );
    expect(result.abnormalCasesList.length).toBeGreaterThan(0);
    expect(result.abnormalCasesList.some((c) => c.violationTypes.includes('AmountDiscrepancyDetected'))).toBe(
      true
    );
    expect(result.abnormalCasesList.some((c) => c.severity === 'HIGH' || c.severity === 'CRITICAL')).toBe(true);
    expect(result.validationResult).toBe('FAILED_WITH_VIOLATIONS');
  });
});
