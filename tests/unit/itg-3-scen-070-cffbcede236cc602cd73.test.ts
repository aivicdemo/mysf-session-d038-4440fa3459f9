import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-070: 参照チェーン全体が正常で、ステータス対応ルールも満たし、金額差異のみ許容範囲内のとき', () => {
  it('検証を合格扱いで返す', async () => {
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
        dealStatus: 'negotiation',
        dealAmount: 50000,
        invoiceIds: ['INV-002'],
      },
    ];
    const invoiceRecords = [
      {
        invoiceId: 'INV-001',
        accountId: 'ACC-001',
        dealId: 'DEAL-001',
        invoiceStatus: 'paid',
        invoiceAmount: 100500,
      },
      {
        invoiceId: 'INV-002',
        accountId: 'ACC-002',
        dealId: 'DEAL-002',
        invoiceStatus: 'invoiced',
        invoiceAmount: 49800,
      },
    ];
    const statusCorrespondenceRules = [
      {
        dealStatus: 'closed_won',
        allowedInvoiceStatuses: ['invoiced', 'paid'],
      },
      {
        dealStatus: 'negotiation',
        allowedInvoiceStatuses: ['invoiced', 'draft'],
      },
    ];
    const amountToleranceCriteria = {
      tolerancePercentage: 1,
      toleranceAbsoluteAmount: 1000,
    };
    const executionTimestamp = new Date('2026-01-31T23:59:59Z');

    const result = await validateDataIntegrityForMonthlyClose({
      dealRecords,
      invoiceRecords,
      statusCorrespondenceRules,
      amountToleranceCriteria,
      executionTimestamp,
    });

    expect(result.validationResult).toBe('PASSED');
    expect(result.totalDealsValidated).toBe(2);
    expect(result.totalInvoicesValidated).toBe(2);
    expect(result.referentialIntegrityViolations).toEqual([]);
    expect(result.statusCorrespondenceViolations).toEqual([]);
    expect(result.amountDiscrepancies).toHaveLength(2);
    expect(result.amountDiscrepancies[0]).toEqual(
      expect.objectContaining({
        dealId: 'DEAL-001',
        invoiceId: 'INV-001',
        dealAmount: 100000,
        invoiceAmount: 100500,
        discrepancyAmount: 500,
        withinTolerance: true,
      })
    );
    expect(result.amountDiscrepancies[1]).toEqual(
      expect.objectContaining({
        dealId: 'DEAL-002',
        invoiceId: 'INV-002',
        dealAmount: 50000,
        invoiceAmount: 49800,
        discrepancyAmount: 200,
        discrepancyPercentage: 0.4,
        withinTolerance: true,
      })
    );
    expect(result.abnormalCasesList).toEqual([]);
    expect(result.executionTimestamp).toEqual(new Date('2026-01-31T23:59:59Z'));
  });
});
