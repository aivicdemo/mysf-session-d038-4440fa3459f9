import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-344: fetchInvoiceLineItemsByInvoice の戻り値により、請求明細の金額合計が検証される', () => {
  const dealId = 'DEAL-001';
  const currentDateTime = new Date('2026-10-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求明細の金額合計が請求書金額と一致することを検証', async () => {
    const mockDealById = {
      dealId: 'DEAL-001',
      dealAmount: 1000000,
      invoiceStatus: 'won',
    };

    const mockInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceAmount: 500000,
        invoiceStatus: 'issued',
        paidDate: '2026-10-10',
        paidAmount: 500000,
        dueDate: '2026-09-30',
      },
      {
        invoiceId: 'INV-002',
        invoiceAmount: 500000,
        invoiceStatus: 'issued',
        paidDate: null,
        paidAmount: 0,
        dueDate: '2026-10-30',
      },
    ];

    const mockLineItemsINV001 = [
      { amount: 250000 },
      { amount: 250000 },
    ];

    const mockLineItemsINV002 = [
      { amount: 500000 },
    ];

    const mockValidationRules = {
      overdueDays: 0,
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDealById);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(mockInvoices);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockImplementation((invoiceId) => {
      if (invoiceId === 'INV-001') return Promise.resolve(mockLineItemsINV001);
      if (invoiceId === 'INV-002') return Promise.resolve(mockLineItemsINV002);
      return Promise.resolve([]);
    });
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue(mockValidationRules);

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.amountConsistency).toBe(true);
    expect(result.totalInvoiceAmount).toBe(1000000);
    expect(result.dealAmount).toBe(1000000);
    expect(result.totalPaidAmount).toBe(500000);
  });
});
