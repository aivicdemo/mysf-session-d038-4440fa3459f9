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

describe('SCEN-360: 支払期限日が請求書発行日より前の場合、支払期限日は請求書発行日以降である必要があります エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when payment due date is before invoice issued date', async () => {
    const dealId = 'DEAL-001';
    const currentDateTime = new Date('2024-01-15T00:00:00Z');
    const dealAmount = 1000000;
    const invoiceIssuedDate = new Date('2024-01-12');
    const paymentDueDate = new Date('2024-01-10');

    (dataPersistence.fetchDealById as jest.Mock<any>).mockResolvedValue({
      dealId,
      dealAmount,
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock<any>).mockResolvedValue([
      {
        invoiceId: 'INV-001',
        invoiceAmount: dealAmount,
        taxAmount: 100000,
        invoiceStatus: '未送付',
        invoiceIssuedDate,
        paymentDueDate,
        paidAmount: 0,
        reissueCount: 0,
      },
    ]);

    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock<any>).mockResolvedValue([
      {
        invoiceId: 'INV-001',
        lineItemNumber: 1,
        lineItemAmount: dealAmount,
        lineItemTaxAmount: 100000,
        lineItemTaxIncludedAmount: dealAmount + 100000,
      },
    ]);

    (dataPersistence.fetchAllValidationRules as jest.Mock<any>).mockResolvedValue({});

    await expect(
      classifyInvoiceStatus({
        dealId,
        currentDateTime,
      })
    ).rejects.toThrow();
  });
});
