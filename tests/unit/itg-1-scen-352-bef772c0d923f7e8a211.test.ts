import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-352: 請求済み金額が契約金額を超える場合、請求済み金額が契約金額を超えています ワーニングが記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record warning when total invoice amount exceeds deal amount', async () => {
    const dealId = 'DEAL-001';
    const currentDateTime = new Date('2026-10-07T10:00:00Z');

    const mockDeal = {
      dealId: 'DEAL-001',
      dealAmount: 100000,
      closedDate: '2026-09-01',
      lostReason: null,
    };

    const mockInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceDate: '2026-09-15',
        invoiceAmount: 80000,
        taxAmount: 8000,
        invoiceStatus: 'sent',
        paidAmount: 0,
        paidDate: null,
        reissuanceCount: 0,
        dueDate: new Date('2026-10-15'),
      },
      {
        invoiceId: 'INV-002',
        invoiceDate: '2026-09-20',
        invoiceAmount: 30000,
        taxAmount: 3000,
        invoiceStatus: 'sent',
        paidAmount: 0,
        paidDate: null,
        reissuanceCount: 0,
        dueDate: new Date('2026-10-20'),
      },
    ];

    const mockLineItems = {
      'INV-001': [
        { lineNumber: 1, amount: 80000, taxAmount: 8000, taxIncludedAmount: 88000 },
      ],
      'INV-002': [
        { lineNumber: 1, amount: 30000, taxAmount: 3000, taxIncludedAmount: 33000 },
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

    expect(result.totalInvoiceAmount).toBe(110000);
    expect(result.dealAmount).toBe(100000);
    expect(result.amountConsistency).toBe(false);
    expect(result.invoiceStatus).toBe('billed');
    expect(result.invoiceCount).toBe(2);
  });
});
