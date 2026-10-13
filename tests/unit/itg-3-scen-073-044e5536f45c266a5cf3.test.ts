import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';
import type { ValidateDataIntegrityForMonthlyCloseInput } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-073: 複数の商談に対して複数の請求書が関連付けられているとき', () => {
  it('全ての商談・請求書のペアを検証対象に含める', async () => {
    const dealRecords = [
      {
        dealId: 'DEAL-001',
        accountId: 'ACC-001',
        dealStatus: 'closed_won',
        dealAmount: 100000,
        invoiceIds: ['INV-001', 'INV-002'],
      },
      {
        dealId: 'DEAL-002',
        accountId: 'ACC-001',
        dealStatus: 'closed_won',
        dealAmount: 50000,
        invoiceIds: ['INV-003', 'INV-004'],
      },
      {
        dealId: 'DEAL-003',
        accountId: 'ACC-002',
        dealStatus: 'negotiation',
        dealAmount: 75000,
        invoiceIds: ['INV-005'],
      },
    ];

    const invoiceRecords = [
      {
        invoiceId: 'INV-001',
        accountId: 'ACC-001',
        dealId: 'DEAL-001',
        invoiceStatus: 'issued',
        invoiceAmount: 50000,
      },
      {
        invoiceId: 'INV-002',
        accountId: 'ACC-001',
        dealId: 'DEAL-001',
        invoiceStatus: 'issued',
        invoiceAmount: 50000,
      },
      {
        invoiceId: 'INV-003',
        accountId: 'ACC-001',
        dealId: 'DEAL-002',
        invoiceStatus: 'paid',
        invoiceAmount: 25000,
      },
      {
        invoiceId: 'INV-004',
        accountId: 'ACC-001',
        dealId: 'DEAL-002',
        invoiceStatus: 'paid',
        invoiceAmount: 25000,
      },
      {
        invoiceId: 'INV-005',
        accountId: 'ACC-002',
        dealId: 'DEAL-003',
        invoiceStatus: 'draft',
        invoiceAmount: 75000,
      },
    ];

    const statusCorrespondenceRules = [
      { dealStatus: 'closed_won', allowedInvoiceStatuses: ['issued', 'paid'] },
      {
        dealStatus: 'negotiation',
        allowedInvoiceStatuses: ['draft', 'pending'],
      },
    ];

    const amountToleranceCriteria = {
      tolerancePercentage: 5,
      toleranceAbsoluteAmount: 1000,
    };

    const executionTimestamp = new Date('2024-01-15T10:30:00Z');

    const input: ValidateDataIntegrityForMonthlyCloseInput = {
      dealRecords,
      invoiceRecords,
      statusCorrespondenceRules,
      amountToleranceCriteria,
      executionTimestamp,
    };

    const result = await validateDataIntegrityForMonthlyClose(input);

    expect(result.validationResult).toBe('PASSED');
    expect(result.totalDealsValidated).toBe(3);
    expect(result.totalInvoicesValidated).toBe(5);
    expect(result.referentialIntegrityViolations).toEqual([]);
    expect(result.statusCorrespondenceViolations).toEqual([]);
    expect(result.amountDiscrepancies).toEqual([]);
    expect(result.abnormalCasesList).toEqual([]);
    expect(result.executionTimestamp).toEqual(executionTimestamp);
  });
});
