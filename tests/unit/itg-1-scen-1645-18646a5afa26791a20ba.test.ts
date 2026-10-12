import { fetchDealsForPeriod, type FetchDealsForPeriodInput, type FetchDealsForPeriodOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1645: 請求書生成が目標日数の110%以内の場合、生成SLAが警告と判定される', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定期間内の商談を取得し、更新日時の降順でソート して返す', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: '案件A',
        dealAmount: 1000000,
        stageId: 'stage-contract',
        expectedContractDate: '2025-01-15T00:00:00Z',
        contractedDate: '2025-01-10T00:00:00Z',
        description: 'テスト商談',
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-01-13T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-09T15:30:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: '案件B',
        dealAmount: 500000,
        stageId: 'stage-contract',
        expectedContractDate: '2025-01-20T00:00:00Z',
        contractedDate: '2025-01-12T00:00:00Z',
        description: 'テスト商談2',
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-01-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2025-01-02T09:00:00Z',
        updatedAt: '2025-01-12T14:00:00Z',
        createdBy: 'user-002',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(mockDeals as any);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2025-01-01T00:00:00Z',
      periodEndDateTime: '2025-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result: FetchDealsForPeriodOutput = await fetchDealsForPeriod(input);

    expect(result.deals).toHaveLength(2);
    expect(result.deals[0].dealId).toBe('deal-002');
    expect(result.deals[0].updatedAt).toBe('2025-01-12T14:00:00Z');
    expect(result.deals[1].dealId).toBe('deal-001');
    expect(result.deals[1].updatedAt).toBe('2025-01-09T15:30:00Z');
    expect(result.totalCount).toBe(2);
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(false);
    expect(result.deals[1].invoiceSLAExceededFlag).toBe(false);
    expect(result.deals[0].invoiceGenerationSLADeadline).toBe('2025-01-15T00:00:00Z');
    expect(result.deals[1].invoiceGenerationSLADeadline).toBe('2025-01-13T00:00:00Z');
    expect(result.fetchedAt).toBeDefined();
  });
});
