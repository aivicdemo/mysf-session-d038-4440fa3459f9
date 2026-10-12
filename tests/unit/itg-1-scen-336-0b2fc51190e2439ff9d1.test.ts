import { classifyInvoiceStatus, ClassifyInvoiceStatusOutput } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-336: 商談の請求書合計金額が商談金額と異なり、amountConsistency が false に設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return partial_billing status with amountConsistency=false when invoice total does not match deal amount', async () => {
    const dealId = 'DEAL-20250115-001';
    const currentDateTime = new Date('2025-01-15T10:00:00Z');

    // Mock fetchDealById
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId,
      dealAmount: 1000000,
      closedDate: '2025-01-01',
      lossReason: null,
    });

    // Mock fetchInvoicesForPeriod - total 600000 (not matching dealAmount 1000000)
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'INV-2025-001',
        invoiceAmount: 600000,
        taxAmount: 60000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: 0,
        reissueCount: 0,
        dueDate: '2025-02-15',
        invoiceDate: '2025-01-10',
      },
    ]);

    // Mock fetchInvoiceLineItemsByInvoice
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'INV-2025-001',
        lineNumber: 1,
        amount: 300000,
        taxAmount: 30000,
        taxIncludedAmount: 330000,
      },
      {
        invoiceId: 'INV-2025-001',
        lineNumber: 2,
        amount: 300000,
        taxAmount: 30000,
        taxIncludedAmount: 330000,
      },
    ]);

    // Mock fetchAllValidationRules
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      overdueDays: 30,
    });

    const result = await classifyInvoiceStatus({ dealId, currentDateTime });

    expect(result.dealId).toBe(dealId);
    expect(result.invoiceStatus).toBe('partial_billing');
    expect(result.invoiceCount).toBe(1);
    expect(result.totalInvoiceAmount).toBe(600000);
    expect(result.totalPaidAmount).toBe(0);
    expect(result.dealAmount).toBe(1000000);
    expect(result.amountConsistency).toBe(false);
    expect(result.invoiceDetails).toHaveLength(1);
    expect(result.invoiceDetails[0]).toMatchObject({
      invoiceId: 'INV-2025-001',
      invoiceAmount: 600000,
      paidAmount: 0,
      invoiceStatus: 'issued',
      dueDate: new Date('2025-02-15'),
      isOverdue: false,
    });
  });
});
