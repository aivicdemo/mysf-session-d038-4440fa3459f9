import { classifyInvoiceStatus, DealNotFound } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-340: invoiceDetails の isOverdue フラグ（支払期限超過判定）', () => {
  const dealId = 'DEAL-20240115-001';
  const currentDateTime = new Date('2024-01-20T10:00:00Z');
  const dueDate = new Date('2024-01-18');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('支払期限が現在日時より前の場合、isOverdue が true に設定される', async () => {
    const mockDealById = {
      dealId: 'DEAL-20240115-001',
      dealAmount: 1000000,
      dealStage: '成約',
      closedDate: '2024-01-10',
      lostReason: null,
    };

    const mockInvoices = [
      {
        invoiceId: 'INV-20240115-001',
        invoiceAmount: 1000000,
        taxAmount: 100000,
        invoiceStatus: 'issued',
        paidAmount: 0,
        paidDate: null,
        reissueCount: 0,
        dueDate: '2024-01-18',
      },
    ];

    const mockLineItems = [
      {
        invoiceId: 'INV-20240115-001',
        lineItemNumber: 1,
        amount: 1000000,
        taxAmount: 100000,
        amountWithTax: 1100000,
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

    expect(result).toBeDefined();
    expect(result.invoiceDetails).toBeDefined();
    expect(result.invoiceDetails.length).toBeGreaterThan(0);

    const invoiceDetail = result.invoiceDetails[0];
    expect(invoiceDetail.invoiceId).toBe('INV-20240115-001');
    expect(invoiceDetail.isOverdue).toBe(true);
    expect(invoiceDetail.dueDate).toEqual(expect.any(Date));
  });
});
