import { classifyInvoiceStatus, MultipleInvoiceAmountMismatch } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-334: 複数の請求書が存在し合計金額が商談金額と一致しない場合、MultipleInvoiceAmountMismatch エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw MultipleInvoiceAmountMismatch error when multiple invoices total does not match deal amount', async () => {
    const dealId = 'DEAL-20240115-001';
    const currentDateTime = new Date('2024-01-20T10:00:00Z');

    // Mock fetchDealById
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId,
      dealAmount: 1000000,
      closedDate: '2024-01-15',
      lostReason: null,
    });

    // Mock fetchInvoicesForPeriod - total 850000 (not matching dealAmount 1000000)
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'INV-001',
        invoiceAmount: 400000,
        taxAmount: 40000,
        invoiceStatus: 'issued',
        paymentDate: null,
        paidAmount: 0,
        reissueCount: 0,
      },
      {
        invoiceId: 'INV-002',
        invoiceAmount: 450000,
        taxAmount: 45000,
        invoiceStatus: 'issued',
        paymentDate: null,
        paidAmount: 0,
        reissueCount: 0,
      },
    ]);

    // Mock fetchInvoiceLineItemsByInvoice - each invoice's line items match their invoice amount
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock)
      .mockImplementation((invoiceId) => {
        if (invoiceId === 'INV-001') {
          return Promise.resolve([
            {
              invoiceId: 'INV-001',
              lineNumber: 1,
              amount: 400000,
              taxAmount: 40000,
              taxIncludedAmount: 440000,
            },
          ]);
        } else if (invoiceId === 'INV-002') {
          return Promise.resolve([
            {
              invoiceId: 'INV-002',
              lineNumber: 1,
              amount: 450000,
              taxAmount: 45000,
              taxIncludedAmount: 495000,
            },
          ]);
        }
        return Promise.resolve([]);
      });

    // Mock fetchAllValidationRules
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({
      overdueDays: 0,
    });

    await expect(
      classifyInvoiceStatus({ dealId, currentDateTime })
    ).rejects.toThrow(MultipleInvoiceAmountMismatch);

    await expect(
      classifyInvoiceStatus({ dealId, currentDateTime })
    ).rejects.toThrow('複数請求書の合計金額が商談金額と一致しません。商談ID: DEAL-20240115-001');
  });
});
