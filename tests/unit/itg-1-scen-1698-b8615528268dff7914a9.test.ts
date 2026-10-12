import { fetchDealsForPeriod, type FetchDealsForPeriodInput, type FetchDealsForPeriodOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1698: 警告レベルが正常の場合、推奨対応として定期監視継続を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求SLA超過フラグが全てfalseのレコードが正常として返される', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社 システム導入案件',
        dealAmount: 5000000,
        stageId: '契約段階',
        expectedContractDate: '2024-12-31T23:59:59Z',
        description: '大型システム導入',
        contractedDate: '2024-12-15T10:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-12-31T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-10-01T09:00:00Z',
        updatedAt: '2024-12-15T10:30:00Z',
        createdBy: 'admin-001',
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社 保守契約',
        dealAmount: 1200000,
        stageId: '契約段階',
        expectedContractDate: '2024-11-30T23:59:59Z',
        description: '1年間保守契約',
        contractedDate: '2024-11-20T14:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-11-30T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-09-15T08:30:00Z',
        updatedAt: '2024-11-20T15:00:00Z',
        createdBy: 'admin-001',
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'cust-003',
        salesRepresentativeId: 'rep-001',
        dealName: 'C社 コンサル案件',
        dealAmount: 800000,
        stageId: '提案段階',
        expectedContractDate: '2025-01-31T23:59:59Z',
        description: '経営コンサルティング',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-02-28T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-11-10T11:00:00Z',
        updatedAt: '2024-12-20T16:45:00Z',
        createdBy: 'admin-001',
      },
    ];

    (dataPersistence.listRecords as jest.Mock).mockResolvedValue(mockDeals);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2024-12-01T00:00:00Z',
      periodEndDateTime: '2024-12-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result = await fetchDealsForPeriod(input);

    expect(dataPersistence.listRecords).toHaveBeenCalledWith('商談', expect.any(Object));

    // 期間内に作成または更新されたレコードが返される
    expect(result.totalCount).toBe(2);
    expect(result.deals).toHaveLength(2);

    // updatedAt 降順: deal-001（2024-12-15T10:30:00Z） → deal-003（2024-12-20T16:45:00Z）
    // 注意: 仕様で deal-001（2024-12-15） と deal-003（2024-12-20） の降順を確認
    // deal-003 が deal-001 より後なので、降順の場合 deal-003 → deal-001 となる
    expect(result.deals[0].dealId).toBe('deal-003');
    expect(result.deals[0].updatedAt).toBe('2024-12-20T16:45:00Z');
    expect(result.deals[0].dealName).toBe('C社 コンサル案件');
    expect(result.deals[0].dealAmount).toBe(800000);
    expect(result.deals[0].stageId).toBe('提案段階');
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(false);

    expect(result.deals[1].dealId).toBe('deal-001');
    expect(result.deals[1].updatedAt).toBe('2024-12-15T10:30:00Z');
    expect(result.deals[1].dealName).toBe('A社 システム導入案件');
    expect(result.deals[1].dealAmount).toBe(5000000);
    expect(result.deals[1].stageId).toBe('契約段階');
    expect(result.deals[1].invoiceSLAExceededFlag).toBe(false);

    // すべてのレコードが正常（invoiceSLAExceededFlag=false）
    result.deals.forEach(deal => {
      expect(deal.invoiceSLAExceededFlag).toBe(false);
    });

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
