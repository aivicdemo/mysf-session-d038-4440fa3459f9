import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-348: totalInvoiceAmount に商談に紐付く全請求書の請求金額合計が計算される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate totalInvoiceAmount correctly for multiple invoices', async () => {
    const dealId = 'DEAL-20250107-001';
    const currentDateTime = new Date('2025-01-15T10:00:00Z');

    const mockDeal = {
      dealId: 'DEAL-20250107-001',
      dealAmount: 1000000,
      dealStage: 'closed_won',
      closedDate: '2025-01-10',
    };

    const mockInvoices = [
      {
        invoiceId: 'INV-20250110-001',
        invoiceAmount: 300000,
        taxAmount: 30000,
        invoiceStatus: 'issued',
        invoiceDate: '2025-01-10',
        paidAmount: 0,
        paidDate: null,
        reissueCount: 0,
        dueDate: new Date('2025-02-10'),
      },
      {
        invoiceId: 'INV-20250112-002',
        invoiceAmount: 400000,
        taxAmount: 40000,
        invoiceStatus: 'issued',
        invoiceDate: '2025-01-12',
        paidAmount: 0,
        paidDate: null,
        reissueCount: 0,
        dueDate: new Date('2025-02-12'),
      },
      {
        invoiceId: 'INV-20250113-003',
        invoiceAmount: 300000,
        taxAmount: 30000,
        invoiceStatus: 'issued',
        invoiceDate: '2025-01-13',
        paidAmount: 0,
        paidDate: null,
        reissueCount: 0,
        dueDate: new Date('2025-02-13'),
      },
    ];

    const mockLineItems = {
      'INV-20250110-001': [
        { lineItemNumber: 1, lineItemAmount: 150000, lineItemTaxAmount: 15000, lineItemTaxIncludedAmount: 165000 },
        { lineItemNumber: 2, lineItemAmount: 150000, lineItemTaxAmount: 15000, lineItemTaxIncludedAmount: 165000 },
      ],
      'INV-20250112-002': [
        { lineItemNumber: 1, lineItemAmount: 400000, lineItemTaxAmount: 40000, lineItemTaxIncludedAmount: 440000 },
      ],
      'INV-20250113-003': [
        { lineItemNumber: 1, lineItemAmount: 300000, lineItemTaxAmount: 30000, lineItemTaxIncludedAmount: 330000 },
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

    expect(result.totalInvoiceAmount).toBe(1000000);
    expect(result.invoiceCount).toBe(3);
    expect(result.dealAmount).toBe(1000000);
    expect(result.amountConsistency).toBe(true);
    expect(result.invoiceStatus).toBe('billed');
    expect(result.invoiceDetails).toHaveLength(3);
    expect(result.invoiceDetails[0]).toMatchObject({
      invoiceId: 'INV-20250110-001',
      invoiceAmount: 300000,
    });
    expect(result.invoiceDetails[1]).toMatchObject({
      invoiceId: 'INV-20250112-002',
      invoiceAmount: 400000,
    });
    expect(result.invoiceDetails[2]).toMatchObject({
      invoiceId: 'INV-20250113-003',
      invoiceAmount: 300000,
    });
  });
});
