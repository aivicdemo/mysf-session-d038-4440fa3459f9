import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as dataPersistence from '../../src/logic/data-persistence';
import { classifyInvoiceStatus, InvoiceDataInconsistency } from '../../src/logic/invoice-status-classification';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-358: 請求金額がマイナス値の場合、請求金額は0以上である必要があります エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvoiceDataInconsistency error when invoice amount is negative', async () => {
    const dealId = 'DEAL-20240115-001';
    const currentDateTime = new Date('2024-02-15T10:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock<any>).mockResolvedValue({
      dealId,
      dealAmount: 100000,
      dealStage: '成約',
      closedDate: new Date('2024-01-15'),
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock<any>).mockResolvedValue([
      {
        invoiceId: 'INV-20240115-001',
        invoiceAmount: -50000,
        taxAmount: -5000,
        invoiceStatus: '未送付',
        paidAmount: 0,
        paidDate: null,
        reissueCount: 0,
      },
    ]);

    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock<any>).mockResolvedValue([
      {
        invoiceId: 'INV-20240115-001',
        lineNumber: 1,
        amount: -50000,
        taxAmount: -5000,
        taxIncludedAmount: -55000,
      },
    ]);

    (dataPersistence.fetchAllValidationRules as jest.Mock<any>).mockResolvedValue({
      overdueThresholdDays: 30,
    });

    await expect(
      classifyInvoiceStatus({
        dealId,
        currentDateTime,
      })
    ).rejects.toThrow(InvoiceDataInconsistency);
  });
});
