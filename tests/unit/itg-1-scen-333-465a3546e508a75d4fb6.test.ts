import { classifyInvoiceStatus, InvoiceDataInconsistency } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-333: 請求書の請求金額と請求明細の合計金額が一致しない場合、InvoiceDataInconsistency エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvoiceDataInconsistency error when invoice amount does not match line items total', async () => {
    const dealId = 'DEAL-20240115-001';
    const currentDateTime = new Date('2024-01-20T10:00:00Z');

    // Mock fetchDealById
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId,
      dealAmount: 1000000,
      stage: '成約',
      closedDate: '2024-01-10',
      lossReason: null,
    });

    // Mock fetchInvoicesForPeriod
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'INV-20240115-001',
        invoiceAmount: 1000000,
        invoiceStatus: 'issued',
        paymentDate: null,
        paidAmount: 0,
        reissuanceCount: 0,
      },
    ]);

    // Mock fetchInvoiceLineItemsByInvoice - total 900000 (not matching invoiceAmount 1000000)
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'INV-20240115-001',
        lineNumber: 1,
        amount: 500000,
        amountWithTax: 550000,
      },
      {
        invoiceId: 'INV-20240115-001',
        lineNumber: 2,
        amount: 400000,
        amountWithTax: 440000,
      },
    ]);

    // Mock fetchAllValidationRules
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      overdueDays: 30,
    });

    await expect(
      classifyInvoiceStatus({ dealId, currentDateTime })
    ).rejects.toThrow(InvoiceDataInconsistency);

    await expect(
      classifyInvoiceStatus({ dealId, currentDateTime })
    ).rejects.toThrow('請求書のデータに不整合があります。請求書ID: INV-20240115-001');
  });
});
