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

describe('SCEN-359: 入金金額が請求金額を超える場合、入金金額が請求金額を超えています ワーニングが記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return result with paidAmount exceeding invoiceAmount', async () => {
    const dealId = 'DEAL-20240115-001';
    const currentDateTime = new Date('2024-01-20T09:00:00Z');
    const dealAmount = 100000;
    const invoiceAmount = 100000;
    const paidAmount = 105000;
    const dueDate = new Date('2024-02-10');

    (dataPersistence.fetchDealById as jest.Mock<any>).mockResolvedValue({
      dealId,
      dealAmount,
      dealStage: '成約',
      closedDate: new Date('2024-01-10'),
      lostReason: null,
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock<any>).mockResolvedValue([
      {
        invoiceId: 'INV-20240115-001',
        invoiceAmount,
        invoiceStatus: 'issued',
        paidAmount,
        dueDate,
      },
    ]);

    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock<any>).mockResolvedValue([
      {
        invoiceId: 'INV-20240115-001',
        amount: invoiceAmount,
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
    expect(result.invoiceStatus).toBe('paid');
    expect(result.invoiceCount).toBe(1);
    expect(result.totalInvoiceAmount).toBe(invoiceAmount);
    expect(result.totalPaidAmount).toBe(paidAmount);
    expect(result.dealAmount).toBe(dealAmount);
    expect(result.amountConsistency).toBe(true);
    expect(result.invoiceDetails).toEqual([
      {
        invoiceId: 'INV-20240115-001',
        invoiceAmount,
        paidAmount,
        invoiceStatus: 'paid',
        dueDate,
        isOverdue: false,
      },
    ]);
  });
});
