import { fetchDealsForPeriod, type FetchDealsForPeriodInput, type FetchDealsForPeriodOutput, type SaveDealOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1644: 請求書生成が目標日数以内の場合、生成SLAが達成と判定される', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定期間内の商談を更新日時の降順でソートして返す', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社システム導入',
        dealAmount: 5000000,
        stageId: 'stage-contract',
        expectedContractDate: '2025-03-15T00:00:00Z',
        contractedDate: '2025-03-10T10:30:00Z',
        description: '大型システム導入案件',
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-03-17T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2025-02-01T09:00:00Z',
        updatedAt: '2025-03-10T10:30:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社コンサルティング',
        dealAmount: 2000000,
        stageId: 'stage-contract',
        expectedContractDate: '2025-03-20T00:00:00Z',
        contractedDate: '2025-03-18T14:15:00Z',
        description: '経営コンサルティング',
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-03-25T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2025-02-05T08:00:00Z',
        updatedAt: '2025-03-18T14:15:00Z',
        createdBy: 'user-001',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(mockDeals as any);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2025-02-01T00:00:00Z',
      periodEndDateTime: '2025-03-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result: FetchDealsForPeriodOutput = await fetchDealsForPeriod(input);

    expect(result.deals).toHaveLength(2);
    expect(result.deals[0].dealId).toBe('deal-002');
    expect(result.deals[0].updatedAt).toBe('2025-03-18T14:15:00Z');
    expect(result.deals[1].dealId).toBe('deal-001');
    expect(result.deals[1].updatedAt).toBe('2025-03-10T10:30:00Z');
    expect(result.totalCount).toBe(2);
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(false);
    expect(result.deals[1].invoiceSLAExceededFlag).toBe(false);
    expect(result.fetchedAt).toBeDefined();
  });
});
