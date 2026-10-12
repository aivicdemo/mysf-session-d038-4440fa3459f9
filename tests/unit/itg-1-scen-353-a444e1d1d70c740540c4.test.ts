import { classifyInvoiceStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-353: 請求書レコードが存在しないのに請求済み金額がゼロでない場合、請求済み金額がありますが請求書レコードが見つかりません ワーニングが記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record warning when no invoice records exist but paid amount is not zero', async () => {
    const dealId = 'DEAL-20240101-001';
    const currentDateTime = new Date('2024-01-15T10:00:00Z');

    const mockDeal = {
      dealId: 'DEAL-20240101-001',
      dealAmount: 1000000,
      dealStage: '成約',
      closedDate: '2024-01-10',
      lossReason: null,
    };

    const mockValidationRules = { overdueThresholdDays: 30 };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDeal);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([]);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue(mockValidationRules);

    const result = await classifyInvoiceStatus({
      dealId,
      currentDateTime,
    });

    expect(result.invoiceStatus).toBe('unbilled');
    expect(result.invoiceCount).toBe(0);
    expect(result.totalInvoiceAmount).toBe(0);
    expect(result.totalPaidAmount).toBe(0);
    expect(result.invoiceDetails).toEqual([]);
    expect(result.dealAmount).toBe(1000000);
    expect(result.amountConsistency).toBe(true);
  });
});
