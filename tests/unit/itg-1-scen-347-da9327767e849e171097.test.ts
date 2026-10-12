import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-347: 請求書が 1 件のみの場合、invoiceCount が 1 に設定される', () => {
  const dealId = 'DEAL-001';
  const currentDateTime = new Date('2024-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求書が 1 件のみの場合、invoiceCount が 1 に設定される', async () => {
    const mockDealById = {
      dealId: 'DEAL-001',
      dealAmount: 100000,
      closedDate: '2024-01-10',
      lossReason: null,
    };

    const mockInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceAmount: 100000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: 0,
        reissueCount: 0,
        dueDate: '2024-02-15',
      },
    ];

    const mockLineItems = [
      {
        invoiceId: 'INV-001',
        lineItemNumber: 1,
        amount: 100000,
      },
    ];

    const mockValidationRules = {
      overdueDays: 0,
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDealById);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(mockInvoices);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValue(mockLineItems);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue(mockValidationRules);

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.invoiceCount).toBe(1);
    expect(result.dealId).toBe('DEAL-001');
    expect(result.totalInvoiceAmount).toBe(100000);
    expect(result.totalPaidAmount).toBe(0);
    expect(result.invoiceStatus).toBe('billed');
    expect(result.invoiceDetails).toHaveLength(1);
    expect(result.invoiceDetails[0].invoiceId).toBe('INV-001');
    expect(result.invoiceDetails[0].invoiceAmount).toBe(100000);
    expect(result.invoiceDetails[0].paidAmount).toBe(0);
    expect(result.invoiceDetails[0].invoiceStatus).toBe('issued');
    expect(result.invoiceDetails[0].isOverdue).toBe(false);
    expect(result.dealAmount).toBe(100000);
    expect(result.amountConsistency).toBe(true);
  });
});
