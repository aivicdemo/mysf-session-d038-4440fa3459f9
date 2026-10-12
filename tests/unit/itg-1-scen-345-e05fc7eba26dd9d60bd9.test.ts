import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-345: fetchAllValidationRules の戻り値により、滞納判定の基準日数が適用される', () => {
  const dealId = 'DEAL-001';
  const currentDateTime = new Date('2026-01-15T10:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('滞納判定基準日数が正しく適用される', async () => {
    const mockDealById = {
      dealId: 'DEAL-001',
      dealAmount: 1000000,
      dealStage: '受注',
      closedDate: '2025-12-01',
    };

    const mockInvoices = [
      {
        invoiceId: 'INV-001',
        invoiceAmount: 500000,
        taxAmount: 50000,
        invoiceStatus: 'issued',
        paidAmount: 500000,
        paidDate: '2026-01-05',
        dueDate: '2026-01-10',
        reissueCount: 0,
      },
      {
        invoiceId: 'INV-002',
        invoiceAmount: 500000,
        taxAmount: 50000,
        invoiceStatus: 'issued',
        paidAmount: 0,
        paidDate: null,
        dueDate: '2026-01-20',
        reissueCount: 0,
      },
    ];

    const mockLineItemsINV001 = [
      { lineNumber: 1, amount: 500000, taxAmount: 50000, taxIncludedAmount: 550000 },
    ];

    const mockLineItemsINV002 = [
      { lineNumber: 1, amount: 500000, taxAmount: 50000, taxIncludedAmount: 550000 },
    ];

    const mockValidationRules = {
      overdueDays: 3,
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

    expect(dataPersistence.fetchAllValidationRules).toHaveBeenCalled();

    const inv002Detail = result.invoiceDetails.find((d: any) => d.invoiceId === 'INV-002');
    expect(inv002Detail).toBeDefined();
    expect(inv002Detail?.isOverdue).toBe(false);

    const inv001Detail = result.invoiceDetails.find((d: any) => d.invoiceId === 'INV-001');
    expect(inv001Detail).toBeDefined();
    expect(inv001Detail?.isOverdue).toBe(false);
  });
});
