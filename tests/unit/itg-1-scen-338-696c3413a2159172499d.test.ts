import { classifyInvoiceStatus, ClassifyInvoiceStatusOutput } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-338: 請求書に対する入金が一部である場合、invoiceDetails の paidAmount に部分入金額が反映される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reflect partial payment amount in invoiceDetails', async () => {
    const dealId = 'DEAL-001';
    const currentDateTime = new Date('2026-10-15T10:00:00Z');

    // Mock fetchDealById
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId,
      dealAmount: 1000000,
    });

    // Mock fetchInvoicesForPeriod - total 1000000 matching dealAmount with partial payment
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'INV-001',
        invoiceAmount: 1000000,
        invoiceStatus: 'issued',
        invoiceDate: '2026-09-05',
        paidAmount: 600000,
        reissueCount: 0,
      },
    ]);

    // Mock fetchInvoiceLineItemsByInvoice
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'INV-001',
        lineNumber: 1,
        amount: 500000,
        taxAmount: 50000,
        taxIncludedAmount: 550000,
      },
      {
        invoiceId: 'INV-001',
        lineNumber: 2,
        amount: 500000,
        taxAmount: 50000,
        taxIncludedAmount: 550000,
      },
    ]);

    // Mock fetchAllValidationRules
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      overdueDays: 30,
    });

    const result = await classifyInvoiceStatus({ dealId, currentDateTime });

    expect(result.dealId).toBe(dealId);
    expect(result.invoiceStatus).toBe('partial_billing');
    expect(result.invoiceCount).toBe(1);
    expect(result.totalInvoiceAmount).toBe(1000000);
    expect(result.totalPaidAmount).toBe(600000);
    expect(result.dealAmount).toBe(1000000);
    expect(result.amountConsistency).toBe(true);
    expect(result.invoiceDetails).toHaveLength(1);

    const invoiceDetail = result.invoiceDetails[0];
    expect(invoiceDetail.invoiceId).toBe('INV-001');
    expect(invoiceDetail.invoiceAmount).toBe(1000000);
    expect(invoiceDetail.paidAmount).toBe(600000);
    expect(invoiceDetail.invoiceStatus).toBe('issued');
    expect(invoiceDetail.dueDate).toEqual(new Date('2026-10-05'));
    expect(invoiceDetail.isOverdue).toBe(false);
  });
});
