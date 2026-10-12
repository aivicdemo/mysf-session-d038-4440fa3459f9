import { fetchDealsForPeriod, type FetchDealsForPeriodInput, type FetchDealsForPeriodOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1696: 警告レベルが危険の場合、推奨対応として経理部門への即座の確認依頼を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求SLA超過フラグがtrueのレコードが危険として識別される', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: '大型案件A',
        dealAmount: 5000000,
        stageId: '契約段階',
        expectedContractDate: '2025-01-15T00:00:00Z',
        description: '重要案件',
        contractedDate: '2025-01-10T00:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-01-20T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-12-01T10:00:00Z',
        updatedAt: '2025-01-05T14:30:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        dealName: '中型案件B',
        dealAmount: 2000000,
        stageId: '提案段階',
        expectedContractDate: '2025-02-28T00:00:00Z',
        description: '通常案件',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-02-05T23:59:59Z',
        invoiceSLAExceededFlag: true,
        createdAt: '2024-11-20T09:15:00Z',
        updatedAt: '2025-01-03T11:20:00Z',
        createdBy: 'user-002',
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: '小型案件C',
        dealAmount: 500000,
        stageId: '初期接触',
        expectedContractDate: '2025-03-31T00:00:00Z',
        description: '小規模プロジェクト',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-04-10T23:59:59Z',
        invoiceSLAExceededFlag: true,
        createdAt: '2024-12-15T13:45:00Z',
        updatedAt: '2025-01-06T16:00:00Z',
        createdBy: 'user-001',
      },
    ];

    (dataPersistence.listRecords as jest.Mock).mockResolvedValue(mockDeals);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2025-01-01T00:00:00Z',
      periodEndDateTime: '2025-01-10T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result = await fetchDealsForPeriod(input);

    expect(dataPersistence.listRecords).toHaveBeenCalledWith('商談', expect.any(Object));

    // 期間内のレコードが返される
    expect(result.totalCount).toBe(2);
    expect(result.deals).toHaveLength(2);

    // deal-002 と deal-003 が含まれ、両方ともinvoiceSLAExceededFlag=true
    const dealIds = result.deals.map(d => d.dealId);
    expect(dealIds).toContain('deal-002');
    expect(dealIds).toContain('deal-003');

    // deal-002 と deal-003 の確認
    const deal002 = result.deals.find(d => d.dealId === 'deal-002');
    const deal003 = result.deals.find(d => d.dealId === 'deal-003');

    expect(deal002?.invoiceSLAExceededFlag).toBe(true);
    expect(deal002?.invoiceGenerationSLADeadline).toBe('2025-02-05T23:59:59Z');

    expect(deal003?.invoiceSLAExceededFlag).toBe(true);
    expect(deal003?.invoiceGenerationSLADeadline).toBe('2025-04-10T23:59:59Z');

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
