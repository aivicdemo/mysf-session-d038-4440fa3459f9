import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-346: 請求書が存在しない場合、invoiceCount が 0 に設定される', () => {
  const dealId = 'DEAL-20250107-001';
  const currentDateTime = new Date('2025-01-07T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求書が存在しない場合、invoiceCount が 0 に設定される', async () => {
    const mockDealById = {
      dealId: 'DEAL-20250107-001',
      dealAmount: 1000000,
      closedDate: '2024-12-01',
      lossReason: null,
    };

    const mockInvoices: any[] = [];
    const mockLineItems: any[] = [];

    const mockValidationRules = {
      overdueDays: 30,
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDealById);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(mockInvoices);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValue(mockLineItems);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue(mockValidationRules);

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.invoiceCount).toBe(0);
    expect(result.invoiceDetails).toEqual([]);
    expect(result.totalInvoiceAmount).toBe(0);
    expect(result.totalPaidAmount).toBe(0);
    expect(result.invoiceStatus).toBe('unbilled');
    expect(result.amountConsistency).toBe(false);
  });
});
