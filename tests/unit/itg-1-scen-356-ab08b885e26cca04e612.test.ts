import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as dataPersistence from '../../src/logic/data-persistence';
import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-356: 請求済み金額が契約金額の1%以上99%未満で請求書が複数件の場合、請求ステータスが「分割請求」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return invoiceStatus as "split_billing" when invoice amount is 65% of deal amount with multiple invoices', async () => {
    const dealId = 'DEAL-20250107-001';
    const currentDateTime = new Date('2025-01-15T10:00:00Z');
    const dealAmount = 1000000;
    const invoice1Amount = 300000;
    const invoice1TaxAmount = 30000;
    const invoice1PaidAmount = 300000;
    const invoice1DueDate = new Date('2025-02-01');
    const invoice2Amount = 350000;
    const invoice2TaxAmount = 35000;
    const invoice2PaidAmount = 50000;
    const invoice2DueDate = new Date('2025-02-04');

    (dataPersistence.fetchDealById as jest.Mock<any>).mockResolvedValue({
      dealId,
      dealAmount,
      closedDate: new Date('2025-01-01'),
      lostReason: null,
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock<any>).mockResolvedValue([
      {
        invoiceId: 'INV-001',
        invoiceAmount: invoice1Amount,
        taxAmount: invoice1TaxAmount,
        invoiceStatus: 'sent',
        invoiceDate: new Date('2025-01-02'),
        paidAmount: invoice1PaidAmount,
        paidDate: new Date('2025-01-10'),
        reissueCount: 0,
      },
      {
        invoiceId: 'INV-002',
        invoiceAmount: invoice2Amount,
        taxAmount: invoice2TaxAmount,
        invoiceStatus: 'sent',
        invoiceDate: new Date('2025-01-05'),
        paidAmount: invoice2PaidAmount,
        paidDate: new Date('2025-01-12'),
        reissueCount: 0,
      },
    ]);

    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock<any>).mockImplementation(
      (invoiceId: string) => {
        if (invoiceId === 'INV-001') {
          return Promise.resolve([
            {
              invoiceId: 'INV-001',
              lineNumber: 1,
              amount: invoice1Amount,
              taxAmount: invoice1TaxAmount,
              taxIncludedAmount: invoice1Amount + invoice1TaxAmount,
            },
          ]);
        } else if (invoiceId === 'INV-002') {
          return Promise.resolve([
            {
              invoiceId: 'INV-002',
              lineNumber: 1,
              amount: invoice2Amount,
              taxAmount: invoice2TaxAmount,
              taxIncludedAmount: invoice2Amount + invoice2TaxAmount,
            },
          ]);
        }
        return Promise.resolve([]);
      }
    );

    (dataPersistence.fetchAllValidationRules as jest.Mock<any>).mockResolvedValue({
      overdueThresholdDays: 30,
    });

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.dealId).toBe(dealId);
    expect(result.invoiceStatus).toBe('split_billing');
    expect(result.invoiceCount).toBe(2);
    expect(result.totalInvoiceAmount).toBe(invoice1Amount + invoice2Amount);
    expect(result.totalPaidAmount).toBe(invoice1PaidAmount + invoice2PaidAmount);
    expect(result.dealAmount).toBe(dealAmount);
    expect(result.amountConsistency).toBe(false);
    expect(result.invoiceDetails).toEqual([
      {
        invoiceId: 'INV-001',
        invoiceAmount: invoice1Amount,
        paidAmount: invoice1PaidAmount,
        invoiceStatus: 'paid',
        dueDate: invoice1DueDate,
        isOverdue: false,
      },
      {
        invoiceId: 'INV-002',
        invoiceAmount: invoice2Amount,
        paidAmount: invoice2PaidAmount,
        invoiceStatus: 'billed',
        dueDate: invoice2DueDate,
        isOverdue: false,
      },
    ]);
  });
});
