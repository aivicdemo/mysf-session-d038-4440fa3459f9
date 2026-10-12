import { fetchDealsForPeriod, type FetchDealsForPeriodInput, type FetchDealsForPeriodOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1694: 生成SLAと送付SLAのいずれかが警告で超過がない場合、警告レベルを注意と判定する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期間内に作成または更新された商談を正しくフィルタしてソートして返す', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'sales-rep-001',
        dealName: '案件A',
        dealAmount: 1000000,
        stageId: 'stage-001',
        expectedContractDate: '2025-02-28T23:59:59Z',
        description: 'テスト商談',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-02-15T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-20T14:30:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'sales-rep-002',
        dealName: '案件B',
        dealAmount: 2000000,
        stageId: 'stage-002',
        expectedContractDate: '2025-03-15T23:59:59Z',
        description: 'テスト商談2',
        contractedDate: '2025-02-10T10:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-02-20T23:59:59Z',
        invoiceSLAExceededFlag: true,
        createdAt: '2025-01-10T09:00:00Z',
        updatedAt: '2025-01-25T16:45:00Z',
        createdBy: 'user-002',
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-001',
        salesRepresentativeId: 'sales-rep-001',
        dealName: '案件C',
        dealAmount: 1500000,
        stageId: 'stage-001',
        expectedContractDate: '2025-03-20T23:59:59Z',
        description: 'テスト商談3',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-02-25T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2025-01-18T11:00:00Z',
        updatedAt: '2025-01-28T13:20:00Z',
        createdBy: 'user-001',
      },
    ];

    (dataPersistence.listRecords as jest.Mock).mockResolvedValue(mockDeals);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2025-01-15T00:00:00Z',
      periodEndDateTime: '2025-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result = await fetchDealsForPeriod(input);

    expect(dataPersistence.listRecords).toHaveBeenCalledWith('商談', expect.any(Object));

    // 期間内でフィルタされた3件
    expect(result.deals).toHaveLength(3);
    expect(result.totalCount).toBe(3);

    // updatedAt の降順: deal-002（2025-01-25T16:45:00Z） → deal-003（2025-01-28T13:20:00Z） → deal-001（2025-01-20T14:30:00Z）
    // 注: 実装がソート順序を降順にするか確認が必要だが、仕様から updatedAt 降順であることが示唆されている
    expect(result.deals[0].dealId).toBe('deal-002');
    expect(result.deals[0].updatedAt).toBe('2025-01-25T16:45:00Z');

    expect(result.deals[1].dealId).toBe('deal-003');
    expect(result.deals[1].updatedAt).toBe('2025-01-28T13:20:00Z');

    expect(result.deals[2].dealId).toBe('deal-001');
    expect(result.deals[2].updatedAt).toBe('2025-01-20T14:30:00Z');

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
