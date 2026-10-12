import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-343: fetchInvoicesForPeriod の戻り値により、複数請求書の件数が正確に計上される', () => {
  const dealId = 'DEAL-20250107-001';
  const currentDateTime = new Date('2025-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数請求書（3件）が正確に計上される', async () => {
    const mockDealById = {
      dealId: 'DEAL-20250107-001',
      dealAmount: 1000000,
      closedDate: '2025-01-10',
      lossReason: null,
    };

    const mockInvoices = [
      {
        invoiceId: 'INV-2025-001',
        invoiceAmount: 300000,
        taxAmount: 30000,
        invoiceStatus: 'issued',
        paidAmount: 300000,
        paidDate: '2025-01-12',
        reissuanceCount: 0,
        dueDate: '2025-02-10',
      },
      {
        invoiceId: 'INV-2025-002',
        invoiceAmount: 350000,
        taxAmount: 35000,
        invoiceStatus: 'issued',
        paidAmount: 0,
        paidDate: null,
        reissuanceCount: 0,
        dueDate: '2025-02-20',
      },
      {
        invoiceId: 'INV-2025-003',
        invoiceAmount: 350000,
        taxAmount: 35000,
        invoiceStatus: 'issued',
        paidAmount: 0,
        paidDate: null,
        reissuanceCount: 0,
        dueDate: '2025-03-10',
      },
    ];

    const mockLineItemsINV2025001 = [
      { lineNumber: 1, amount: 150000, taxAmount: 15000, taxIncludedAmount: 165000 },
      { lineNumber: 2, amount: 150000, taxAmount: 15000, taxIncludedAmount: 165000 },
    ];

    const mockLineItemsINV2025002 = [
      { lineNumber: 1, amount: 350000, taxAmount: 35000, taxIncludedAmount: 385000 },
    ];

    const mockLineItemsINV2025003 = [
      { lineNumber: 1, amount: 350000, taxAmount: 35000, taxIncludedAmount: 385000 },
    ];

    const mockValidationRules = {
      overdueThresholdDays: 0,
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDealById);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(mockInvoices);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockImplementation((invoiceId) => {
      if (invoiceId === 'INV-2025-001') return Promise.resolve(mockLineItemsINV2025001);
      if (invoiceId === 'INV-2025-002') return Promise.resolve(mockLineItemsINV2025002);
      if (invoiceId === 'INV-2025-003') return Promise.resolve(mockLineItemsINV2025003);
      return Promise.resolve([]);
    });
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue(mockValidationRules);

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.invoiceCount).toBe(3);
    expect(result.invoiceStatus).toBe('split_billing');
    expect(result.invoiceDetails).toHaveLength(3);
    expect(result.totalInvoiceAmount).toBe(1000000);
    expect(result.totalPaidAmount).toBe(300000);
    expect(result.amountConsistency).toBe(true);
    expect(result.dealAmount).toBe(1000000);
  });
});
