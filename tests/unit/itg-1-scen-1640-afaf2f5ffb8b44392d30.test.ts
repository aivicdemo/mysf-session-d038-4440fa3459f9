import { fetchDealsForPeriod } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-1640: 成約予定日が未設定の場合、エラーが発生し検証が中断される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('成約予定日が null のレコードを含む場合、呼び出し元の検証ロジックが例外を発生させる', async () => {
    const dataStore = require('../../src/platform/data-store');

    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社向けシステム構築',
        dealAmount: 5000000,
        stageId: '提案段階',
        expectedContractDate: null,
        description: '成約予定日が未設定',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
      },
    ];

    dataStore.listRecords.mockResolvedValue(mockDeals);

    const input = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    await expect(fetchDealsForPeriod(input)).rejects.toThrow();
  });
});
