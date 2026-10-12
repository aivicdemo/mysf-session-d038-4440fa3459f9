import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-349: totalPaidAmount に商談に紐付く全請求書の入金金額合計が計算される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate totalPaidAmount correctly for multiple invoices', async () => {
    const dealId = 'DEAL-2024-001';
    const currentDateTime = new Date('2024-12-15T10:00:00Z');

    const mockDeal = {
      dealId: 'DEAL-2024-001',
      dealAmount: 1000000,
      dealStage: 'closed_won',
      closedDate: '2024-12-01',
      lostReason: null,
    };

    const mockInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceAmount: 400000,
        taxAmount: 40000,
        invoiceStatus: 'issued',
        paidAmount: 300000,
        paymentDate: '2024-11-15',
        reissueCount: 0,
        dueDate: new Date('2024-11-30'),
      },
      {
        invoiceId: 'INV-002',
        invoiceAmount: 600000,
        taxAmount: 60000,
        invoiceStatus: 'issued',
        paidAmount: 200000,
        paymentDate: '2024-12-10',
        reissueCount: 0,
        dueDate: new Date('2024-12-31'),
      },
    ];

    const mockLineItems = {
      'INV-001': [
        { lineNumber: 1, amount: 200000, taxAmount: 20000, taxIncludedAmount: 220000 },
        { lineNumber: 2, amount: 200000, taxAmount: 20000, taxIncludedAmount: 220000 },
      ],
      'INV-002': [
        { lineNumber: 1, amount: 600000, taxAmount: 60000, taxIncludedAmount: 660000 },
      ],
    };

    const mockValidationRules = { overdueThresholdDays: 30 };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDeal);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(mockInvoices);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockImplementation((invoiceId) =>
      Promise.resolve(mockLineItems[invoiceId] || [])
    );
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue(mockValidationRules);

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.totalPaidAmount).toBe(500000);
    expect(result.dealId).toBe('DEAL-2024-001');
    expect(result.invoiceStatus).toBe('paid');
    expect(result.invoiceCount).toBe(2);
    expect(result.totalInvoiceAmount).toBe(1000000);
    expect(result.invoiceDetails).toHaveLength(2);
    expect(result.invoiceDetails[0]).toMatchObject({
      invoiceId: 'INV-001',
      invoiceAmount: 400000,
      paidAmount: 300000,
      isOverdue: false,
    });
    expect(result.invoiceDetails[1]).toMatchObject({
      invoiceId: 'INV-002',
      invoiceAmount: 600000,
      paidAmount: 200000,
      isOverdue: false,
    });
    expect(result.dealAmount).toBe(1000000);
    expect(result.amountConsistency).toBe(true);
  });
});
