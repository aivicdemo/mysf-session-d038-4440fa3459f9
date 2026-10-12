import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1626: 商談金額が0以下の場合、エラーが発生し処理が中断される', () => {
  const mockDealsWithInvalidAmount = [
    {
      id: 'deal-001',
      dealId: 'deal-001',
      customerId: 'customer-001',
      salesRepresentativeId: 'rep-001',
      dealName: 'A社プロジェクト',
      dealAmount: -50000,
      stageId: '提案中',
      expectedContractDate: '2026-12-31T23:59:59Z',
      description: '金額が負数のテストケース',
      contractedDate: null,
      lossReason: null,
      createdAt: '2026-10-01T10:00:00Z',
      updatedAt: '2026-10-15T14:30:00Z',
      createdBy: 'admin-001',
      invoiceGenerationSLADeadline: '2026-11-15T23:59:59Z',
      invoiceSLAExceededFlag: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockDealsWithInvalidAmount);
  });

  it('商談金額が負数の場合、エラーが発生する', async () => {
    await expect(
      fetchDealsForPeriod({
        periodStartDateTime: '2026-10-01T00:00:00Z',
        periodEndDateTime: '2026-10-31T23:59:59Z',
        salesRepresentativeIdFilter: null,
        customerIdFilter: null,
        stageIdFilter: null,
        sortBy: 'updatedAt',
      })
    ).rejects.toThrow();
  });
});
