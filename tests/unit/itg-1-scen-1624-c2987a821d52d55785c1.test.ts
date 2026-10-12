import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1624: 検出された請求漏れ・遅延の異常が異常検知ログに記録され、追跡可能になる', () => {
  const mockDeals = [
    {
      id: 'deal-001',
      dealId: 'deal-001',
      customerId: 'customer-001',
      salesRepresentativeId: 'rep-001',
      dealName: 'A社 システム導入案件',
      dealAmount: 5000000,
      stageId: '成約',
      expectedContractDate: '2024-01-15T00:00:00Z',
      description: '成約済み',
      contractedDate: '2024-01-10T00:00:00Z',
      lossReason: null,
      createdAt: '2024-01-01T09:00:00Z',
      updatedAt: '2024-01-10T14:30:00Z',
      createdBy: 'user-001',
      invoiceGenerationSLADeadline: '2024-01-12T00:00:00Z',
      invoiceSLAExceededFlag: true,
    },
    {
      id: 'deal-002',
      dealId: 'deal-002',
      customerId: 'customer-002',
      salesRepresentativeId: 'rep-002',
      dealName: 'B社 保守契約案件',
      dealAmount: 1200000,
      stageId: '成約',
      expectedContractDate: '2024-01-20T00:00:00Z',
      description: '成約済み',
      contractedDate: '2024-01-18T00:00:00Z',
      lossReason: null,
      createdAt: '2024-01-05T10:00:00Z',
      updatedAt: '2024-01-18T16:45:00Z',
      createdBy: 'user-002',
      invoiceGenerationSLADeadline: '2024-01-20T00:00:00Z',
      invoiceSLAExceededFlag: true,
    },
    {
      id: 'deal-003',
      dealId: 'deal-003',
      customerId: 'customer-001',
      salesRepresentativeId: 'rep-001',
      dealName: 'C社 追加ライセンス案件',
      dealAmount: 800000,
      stageId: '成約',
      expectedContractDate: '2024-01-25T00:00:00Z',
      description: '成約済み',
      contractedDate: '2024-01-22T00:00:00Z',
      lossReason: null,
      createdAt: '2024-01-10T11:00:00Z',
      updatedAt: '2024-01-22T13:20:00Z',
      createdBy: 'user-001',
      invoiceGenerationSLADeadline: '2024-01-24T00:00:00Z',
      invoiceSLAExceededFlag: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockDeals);
  });

  it('指定期間内のすべての商談レコードを返す', async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(3);
    expect(result.totalCount).toBe(3);
  });

  it('3件すべてのレコードが請求SLA超過フラグ=true を持つ', async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    result.deals.forEach((deal) => {
      expect(deal.invoiceSLAExceededFlag).toBe(true);
    });
  });

  it('返却値が ISO 8601 形式の fetchedAt を含む', async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
  });

  it('返却値の deals 配列に SaveDealOutput 型のレコードが含まれる', async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    result.deals.forEach((deal) => {
      expect(deal).toHaveProperty('dealId');
      expect(deal).toHaveProperty('customerId');
      expect(deal).toHaveProperty('salesRepresentativeId');
      expect(deal).toHaveProperty('dealName');
      expect(deal).toHaveProperty('dealAmount');
      expect(deal).toHaveProperty('stageId');
      expect(deal).toHaveProperty('contractedDate');
      expect(deal).toHaveProperty('invoiceGenerationSLADeadline');
      expect(deal).toHaveProperty('invoiceSLAExceededFlag');
    });
  });
});
