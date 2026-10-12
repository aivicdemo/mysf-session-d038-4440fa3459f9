import { classifyInvoiceStatus, ClassifyInvoiceStatusOutput } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-337: 複数の請求書が商談に紐付く場合、invoiceDetails に全請求書の詳細情報が含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include all invoice details for multiple invoices with partial payment status', async () => {
    const dealId = 'DEAL-20240515-001';
    const currentDateTime = new Date('2024-06-15T10:00:00Z');

    // Mock fetchDealById
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId,
      dealAmount: 1000000,
      dealStage: 'closed_won',
      closedDate: '2024-05-15',
      lossReason: null,
    });

    // Mock fetchInvoicesForPeriod - total 1000000 matching dealAmount
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'INV-20240520-001',
        invoiceAmount: 500000,
        taxAmount: 50000,
        invoiceStatus: 'issued',
        paidDate: '2024-06-01',
        paidAmount: 500000,
        reissueCount: 0,
      },
      {
        invoiceId: 'INV-20240610-002',
        invoiceAmount: 500000,
        taxAmount: 50000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: 0,
        reissueCount: 0,
      },
    ]);

    // Mock fetchInvoiceLineItemsByInvoice
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock)
      .mockImplementation((invoiceId) => {
        if (invoiceId === 'INV-20240520-001') {
          return Promise.resolve([
            {
              invoiceId: 'INV-20240520-001',
              lineNumber: 1,
              lineAmount: 250000,
              lineTaxAmount: 25000,
              lineTaxIncludedAmount: 275000,
            },
            {
              invoiceId: 'INV-20240520-001',
              lineNumber: 2,
              lineAmount: 250000,
              lineTaxAmount: 25000,
              lineTaxIncludedAmount: 275000,
            },
          ]);
        } else if (invoiceId === 'INV-20240610-002') {
          return Promise.resolve([
            {
              invoiceId: 'INV-20240610-002',
              lineNumber: 1,
              lineAmount: 250000,
              lineTaxAmount: 25000,
              lineTaxIncludedAmount: 275000,
            },
            {
              invoiceId: 'INV-20240610-002',
              lineNumber: 2,
              lineAmount: 250000,
              lineTaxAmount: 25000,
              lineTaxIncludedAmount: 275000,
            },
          ]);
        }
        return Promise.resolve([]);
      });

    // Mock fetchAllValidationRules
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      overdueDays: 30,
    });

    const result = await classifyInvoiceStatus({ dealId, currentDateTime });

    expect(result.dealId).toBe(dealId);
    expect(result.invoiceStatus).toBe('partial_billing');
    expect(result.invoiceCount).toBe(2);
    expect(result.totalInvoiceAmount).toBe(1000000);
    expect(result.totalPaidAmount).toBe(500000);
    expect(result.dealAmount).toBe(1000000);
    expect(result.amountConsistency).toBe(true);
    expect(result.invoiceDetails).toHaveLength(2);

    // First invoice (paid)
    expect(result.invoiceDetails[0]).toMatchObject({
      invoiceId: 'INV-20240520-001',
      invoiceAmount: 500000,
      paidAmount: 500000,
      invoiceStatus: 'paid',
      dueDate: new Date('2024-07-20'),
      isOverdue: false,
    });

    // Second invoice (billed, overdue)
    expect(result.invoiceDetails[1]).toMatchObject({
      invoiceId: 'INV-20240610-002',
      invoiceAmount: 500000,
      paidAmount: 0,
      invoiceStatus: 'billed',
      dueDate: new Date('2024-07-10'),
      isOverdue: true,
    });
  });
});
