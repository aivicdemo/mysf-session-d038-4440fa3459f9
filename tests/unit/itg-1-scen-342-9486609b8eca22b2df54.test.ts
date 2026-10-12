import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-342: fetchDealById の戻り値により、商談金額が出力に反映される', () => {
  const dealId = 'DEAL-001';
  const currentDateTime = new Date('2024-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談金額が dealAmount フィールドに正確に反映される', async () => {
    const mockDealById = {
      dealId: 'DEAL-001',
      dealAmount: 1000000,
      closedDate: '2023-12-01',
      lossReason: null,
    };

    const mockInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceAmount: 500000,
        taxAmount: 50000,
        invoiceStatus: 'issued',
        paidAmount: 500000,
        paidDate: '2024-01-10',
        reissueCount: 0,
      },
      {
        invoiceId: 'INV-002',
        invoiceAmount: 500000,
        taxAmount: 50000,
        invoiceStatus: 'issued',
        paidAmount: 0,
        paidDate: null,
        reissueCount: 0,
      },
    ];

    const mockLineItemsINV001 = [
      { lineNumber: 1, amount: 250000, taxAmount: 25000, taxIncludedAmount: 275000 },
      { lineNumber: 2, amount: 250000, taxAmount: 25000, taxIncludedAmount: 275000 },
    ];

    const mockLineItemsINV002 = [
      { lineNumber: 1, amount: 500000, taxAmount: 50000, taxIncludedAmount: 550000 },
    ];

    const mockValidationRules = {
      overdueDays: 30,
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

    expect(result.dealAmount).toBe(1000000);
    expect(result.dealId).toBe('DEAL-001');
    expect(result.invoiceStatus).toBe('paid');
    expect(result.invoiceCount).toBe(2);
    expect(result.totalInvoiceAmount).toBe(1000000);
    expect(result.totalPaidAmount).toBe(500000);
    expect(result.amountConsistency).toBe(true);
    expect(result.invoiceDetails).toHaveLength(2);

    const inv001Detail = result.invoiceDetails.find((d: any) => d.invoiceId === 'INV-001');
    expect(inv001Detail).toBeDefined();
    expect(inv001Detail?.invoiceStatus).toBe('paid');

    const inv002Detail = result.invoiceDetails.find((d: any) => d.invoiceId === 'INV-002');
    expect(inv002Detail).toBeDefined();
    expect(inv002Detail?.invoiceStatus).toBe('billed');
  });
});
