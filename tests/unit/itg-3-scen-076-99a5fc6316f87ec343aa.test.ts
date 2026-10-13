import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';
import type { ValidateDataIntegrityForMonthlyCloseInput } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-076: 検証対象の商談件数と請求書件数が出力に正確に記録される', () => {
  it('totalDealsValidated と totalInvoicesValidated が正確に記録される', async () => {
    // Preconditions setup
    const executionTimestamp = new Date('2025-01-15T09:00:00Z');

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
        accountId: 'ACC-002',
        dealStatus: 'closed_won',
        dealAmount: 50000,
        invoiceIds: ['INV-003'],
      },
      {
        dealId: 'DEAL-003',
        accountId: 'ACC-003',
        dealStatus: 'negotiation',
        dealAmount: 75000,
        invoiceIds: [],
      },
    ];

    const invoiceRecords = [
      {
        invoiceId: 'INV-001',
        accountId: 'ACC-001',
        dealId: 'DEAL-001',
        invoiceStatus: 'invoiced',
        invoiceAmount: 60000,
      },
      {
        invoiceId: 'INV-002',
        accountId: 'ACC-001',
        dealId: 'DEAL-001',
        invoiceStatus: 'invoiced',
        invoiceAmount: 40000,
      },
      {
        invoiceId: 'INV-003',
        accountId: 'ACC-002',
        dealId: 'DEAL-002',
        invoiceStatus: 'invoiced',
        invoiceAmount: 50000,
      },
    ];

    const statusCorrespondenceRules = [
      {
        dealStatus: 'closed_won',
        allowedInvoiceStatuses: ['invoiced', 'paid'],
      },
      {
        dealStatus: 'negotiation',
        allowedInvoiceStatuses: ['draft', 'pending'],
      },
    ];

    const amountToleranceCriteria = {
      tolerancePercentage: 2,
      toleranceAbsoluteAmount: 1000,
    };

    const input: ValidateDataIntegrityForMonthlyCloseInput = {
      dealRecords,
      invoiceRecords,
      statusCorrespondenceRules,
      amountToleranceCriteria,
      executionTimestamp,
    };

    // Execute
    const output = await validateDataIntegrityForMonthlyClose(input);

    // Expected result verification
    // totalDealsValidated が 3 であり、totalInvoicesValidated が 3 である
    // これは dealRecords に 3 件の商談レコード（DEAL-001、DEAL-002、DEAL-003）が含まれ、
    // invoiceRecords に 3 件の請求書レコード（INV-001、INV-002、INV-003）が含まれていることを反映している
    expect(output.totalDealsValidated).toBe(3);
    expect(output.totalInvoicesValidated).toBe(3);
  });
});
