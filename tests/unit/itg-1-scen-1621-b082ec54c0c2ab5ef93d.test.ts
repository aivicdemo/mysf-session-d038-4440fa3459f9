import { fetchDealsForPeriod, type SaveDealOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1621: 金額ズレが存在する場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetchDealsForPeriodが複数の成約案件を正常に取得する', async () => {
    const mockDealRecords: SaveDealOutput[] = [
      {
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'sales-rep-001',
        dealName: 'A社システム導入案件',
        dealAmount: 500000,
        stageId: '成約済み',
        expectedContractDate: '2026-10-01T00:00:00Z',
        description: 'システム導入プロジェクト',
        contractedDate: '2026-10-01T10:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2026-10-05T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z',
        createdBy: 'user-001',
      },
      {
        dealId: 'deal-002',
        customerId: 'customer-001',
        salesRepresentativeId: 'sales-rep-001',
        dealName: 'A社追加ライセンス購入',
        dealAmount: 150000,
        stageId: '成約済み',
        expectedContractDate: '2026-10-10T00:00:00Z',
        description: 'ライセンス追加購入',
        contractedDate: '2026-10-10T11:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2026-10-15T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2026-09-15T08:00:00Z',
        updatedAt: '2026-10-10T11:00:00Z',
        createdBy: 'user-001',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce(mockDealRecords);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2026-09-01T00:00:00Z',
      periodEndDateTime: '2026-10-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.deals[0].dealId).toBe('deal-001');
    expect(result.deals[0].dealAmount).toBe(500000);
    expect(result.deals[1].dealId).toBe('deal-002');
    expect(result.deals[1].dealAmount).toBe(150000);
    expect(result.fetchedAt).toBeDefined();
  });
});
