import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as dataPersistence from '../../src/logic/data-persistence';
import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-361: 請求書が存在せず入金がない場合、請求ステータスが「未請求」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return invoiceStatus as "unbilled" when no invoices exist', async () => {
    const dealId = 'DEAL-20250107-001';
    const currentDateTime = new Date('2025-01-15T10:00:00Z');
    const dealAmount = 500000;

    (dataPersistence.fetchDealById as jest.Mock<any>).mockResolvedValue({
      dealId,
      dealAmount,
      dealStage: 'closed_won',
      closedDate: new Date('2025-01-10'),
    });

    (dataPersistence.fetchInvoicesForPeriod as jest.Mock<any>).mockResolvedValue([]);

    (dataPersistence.fetchAllValidationRules as jest.Mock<any>).mockResolvedValue({
      overdueThresholdDays: 30,
    });

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.dealId).toBe(dealId);
    expect(result.invoiceStatus).toBe('unbilled');
    expect(result.invoiceCount).toBe(0);
    expect(result.totalInvoiceAmount).toBe(0);
    expect(result.totalPaidAmount).toBe(0);
    expect(result.invoiceDetails).toEqual([]);
    expect(result.dealAmount).toBe(dealAmount);
    expect(result.amountConsistency).toBe(true);
  });
});
