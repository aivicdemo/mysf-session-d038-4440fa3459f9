import { classifyInvoiceStatus, ClassifyInvoiceStatusOutput } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-335: 商談の請求書合計金額が商談金額と一致し、amountConsistency が true に設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paid status with amountConsistency=true when all invoices are fully paid', async () => {
    const dealId = 'DEAL-20250107-001';
    const currentDateTime = new Date('2025-01-15T10:00:00Z');

    // Mock fetchDealById
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId,
      dealAmount: 1000000,
      dealStage: 'won',
      closedDate: '2025-01-10',
      lossReason: null,
    });

    // Mock fetchInvoicesForPeriod - total 1000000 matching dealAmount
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'INV-20250110-001',
        invoiceAmount: 500000,
        taxAmount: 50000,
        invoiceStatus: 'issued',
        paidDate: '2025-01-12',
        paidAmount: 500000,
        reissuedCount: 0,
        dueDate: '2025-02-10',
      },
      {
        invoiceId: 'INV-20250111-001',
        invoiceAmount: 500000,
        taxAmount: 50000,
        invoiceStatus: 'issued',
        paidDate: '2025-01-13',
        paidAmount: 500000,
        reissuedCount: 0,
        dueDate: '2025-02-11',
      },
    ]);

    // Mock fetchInvoiceLineItemsByInvoice
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock)
      .mockImplementation((invoiceId) => {
        if (invoiceId === 'INV-20250110-001') {
          return Promise.resolve([
            {
              invoiceId: 'INV-20250110-001',
              lineNumber: 1,
              amount: 500000,
              taxAmount: 50000,
              taxIncludedAmount: 550000,
            },
          ]);
        } else if (invoiceId === 'INV-20250111-001') {
          return Promise.resolve([
            {
              invoiceId: 'INV-20250111-001',
              lineNumber: 1,
              amount: 500000,
              taxAmount: 50000,
              taxIncludedAmount: 550000,
            },
          ]);
        }
        return Promise.resolve([]);
      });

    // Mock fetchAllValidationRules
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      overdueDays: 0,
    });

    const result = await classifyInvoiceStatus({ dealId, currentDateTime });

    expect(result.dealId).toBe(dealId);
    expect(result.invoiceStatus).toBe('paid');
    expect(result.invoiceCount).toBe(2);
    expect(result.totalInvoiceAmount).toBe(1000000);
    expect(result.totalPaidAmount).toBe(1000000);
    expect(result.dealAmount).toBe(1000000);
    expect(result.amountConsistency).toBe(true);
    expect(result.invoiceDetails).toHaveLength(2);
    expect(result.invoiceDetails[0]).toMatchObject({
      invoiceId: 'INV-20250110-001',
      invoiceAmount: 500000,
      paidAmount: 500000,
      invoiceStatus: 'paid',
      isOverdue: false,
    });
    expect(result.invoiceDetails[1]).toMatchObject({
      invoiceId: 'INV-20250111-001',
      invoiceAmount: 500000,
      paidAmount: 500000,
      invoiceStatus: 'paid',
      isOverdue: false,
    });
  });
});
