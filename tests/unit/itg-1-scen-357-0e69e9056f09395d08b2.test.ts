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

describe('SCEN-357: 請求済み金額が契約金額の99%以上の場合、請求ステータスが「全額請求済み」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return invoiceStatus as "billed" when invoice amount is 99% of deal amount', async () => {
    const dealId = 'DEAL-20250107-001';
    const currentDateTime = new Date('2025-01-15T10:00:00Z');
    const dealAmount = 10000000;
    const invoiceAmount = 9900000;
    const taxAmount = 990000;
    const paidAmount = 9900000;
    const paymentDueDate = new Date('2025-02-11');

    (dataPersistence.fetchDealById as jest.Mock<any>).mockResolvedValue({
      dealId,
      dealName: '顧客A 新規システム導入案件',
      dealAmount,
      dealStage: '受注',
      closedDate: new Date('2025-01-10'),
      lossReason: null,
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock<any>).mockResolvedValue([
      {
        invoiceId: 'INV-2025-001',
        invoiceAmount,
        taxAmount,
        invoiceStatus: 'issued',
        invoiceDate: new Date('2025-01-11'),
        paymentDueDate,
        paidAmount,
        paidDate: new Date('2025-01-14'),
        reissuanceCount: 0,
      },
    ]);

    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock<any>).mockResolvedValue([
      {
        invoiceId: 'INV-2025-001',
        lineItemNumber: 1,
        itemAmount: invoiceAmount,
        itemTaxAmount: taxAmount,
        itemTotalAmount: invoiceAmount + taxAmount,
      },
    ]);

    (dataPersistence.fetchAllValidationRules as jest.Mock<any>).mockResolvedValue({
      overdueThresholdDays: 0,
    });

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.dealId).toBe(dealId);
    expect(result.invoiceStatus).toBe('billed');
    expect(result.invoiceCount).toBe(1);
    expect(result.totalInvoiceAmount).toBe(invoiceAmount);
    expect(result.totalPaidAmount).toBe(paidAmount);
    expect(result.dealAmount).toBe(dealAmount);
    expect(result.amountConsistency).toBe(false);
    expect(result.invoiceDetails).toEqual([
      {
        invoiceId: 'INV-2025-001',
        invoiceAmount,
        paidAmount,
        invoiceStatus: 'issued',
        dueDate: paymentDueDate,
        isOverdue: false,
      },
    ]);
  });
});
