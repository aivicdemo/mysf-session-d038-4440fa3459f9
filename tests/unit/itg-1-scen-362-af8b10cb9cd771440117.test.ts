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

describe('SCEN-362: 請求書が存在し入金金額が請求金額と一致する場合、請求ステータスが「入金済」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return invoiceStatus as "paid" when paid amount equals invoice amount', async () => {
    const dealId = 'DEAL-20250107-001';
    const currentDateTime = new Date('2025-01-15T10:00:00Z');
    const dealAmount = 1000000;
    const invoiceAmount = 1000000;
    const taxAmount = 100000;
    const paidAmount = 1000000;
    const dueDate = new Date('2025-02-07');

    (dataPersistence.fetchDealById as jest.Mock<any>).mockResolvedValue({
      dealId,
      dealAmount,
      dealStage: '成約',
      closeDate: new Date('2025-01-10'),
      lossReason: null,
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock<any>).mockResolvedValue([
      {
        invoiceId: 'INV-20250107-001',
        invoiceAmount,
        taxAmount,
        invoiceStatus: 'issued',
        paymentDate: new Date('2025-01-14'),
        paidAmount,
        reissueCount: 0,
        dueDate,
      },
    ]);

    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock<any>).mockResolvedValue([
      {
        lineNumber: 1,
        amount: 500000,
        taxAmount: 50000,
        taxIncludedAmount: 550000,
      },
      {
        lineNumber: 2,
        amount: 500000,
        taxAmount: 50000,
        taxIncludedAmount: 550000,
      },
    ]);

    (dataPersistence.fetchAllValidationRules as jest.Mock<any>).mockResolvedValue({
      overdueThresholdDays: 1,
    });

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.dealId).toBe(dealId);
    expect(result.invoiceStatus).toBe('paid');
    expect(result.invoiceCount).toBe(1);
    expect(result.totalInvoiceAmount).toBe(invoiceAmount);
    expect(result.totalPaidAmount).toBe(paidAmount);
    expect(result.invoiceDetails).toEqual([
      {
        invoiceId: 'INV-20250107-001',
        invoiceAmount,
        paidAmount,
        invoiceStatus: 'paid',
        dueDate,
        isOverdue: false,
      },
    ]);
    expect(result.dealAmount).toBe(dealAmount);
    expect(result.amountConsistency).toBe(true);
  });
});
