import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1623: 複数の問題がある場合、請求漏れ > 金額ズレ > 遅延の順序で優先度が決定される', () => {
  const mockDeals = [
    {
      id: 'deal-001',
      dealId: 'deal-001',
      customerId: 'customer-001',
      salesRepresentativeId: 'rep-001',
      dealName: 'A社プロジェクト',
      dealAmount: 1000000,
      stageId: 'stage-closed',
      expectedContractDate: '2025-01-15T00:00:00Z',
      description: '成約済み',
      contractedDate: '2025-01-10T10:00:00Z',
      lossReason: null,
      createdAt: '2025-01-01T08:00:00Z',
      updatedAt: '2025-01-10T10:00:00Z',
      createdBy: 'user-001',
      invoiceGenerationSLADeadline: '2025-01-13T23:59:59Z',
      invoiceSLAExceededFlag: true,
    },
    {
      id: 'deal-002',
      dealId: 'deal-002',
      customerId: 'customer-001',
      salesRepresentativeId: 'rep-001',
      dealName: 'B社契約',
      dealAmount: 1500000,
      stageId: 'stage-closed',
      expectedContractDate: '2025-01-20T00:00:00Z',
      description: '成約済み',
      contractedDate: '2025-01-18T14:30:00Z',
      lossReason: null,
      createdAt: '2025-01-05T09:00:00Z',
      updatedAt: '2025-01-18T14:30:00Z',
      createdBy: 'user-001',
      invoiceGenerationSLADeadline: '2025-01-21T23:59:59Z',
      invoiceSLAExceededFlag: true,
    },
    {
      id: 'deal-003',
      dealId: 'deal-003',
      customerId: 'customer-002',
      salesRepresentativeId: 'rep-002',
      dealName: 'C社案件',
      dealAmount: 800000,
      stageId: 'stage-closed',
      expectedContractDate: '2025-01-25T00:00:00Z',
      description: '成約済み',
      contractedDate: '2025-01-22T11:00:00Z',
      lossReason: null,
      createdAt: '2025-01-08T10:00:00Z',
      updatedAt: '2025-01-22T11:00:00Z',
      createdBy: 'user-002',
      invoiceGenerationSLADeadline: '2025-01-25T23:59:59Z',
      invoiceSLAExceededFlag: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockDeals);
  });

  it('期間内の商談を更新日時の降順でソートして返す', async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2025-01-01T00:00:00Z',
      periodEndDateTime: '2025-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(3);
    expect(result.deals[0].dealId).toBe('deal-003');
    expect(result.deals[0].updatedAt).toBe('2025-01-22T11:00:00Z');
    expect(result.deals[1].dealId).toBe('deal-002');
    expect(result.deals[1].updatedAt).toBe('2025-01-18T14:30:00Z');
    expect(result.deals[2].dealId).toBe('deal-001');
    expect(result.deals[2].updatedAt).toBe('2025-01-10T10:00:00Z');

    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
  });

  it('返された各レコードが SaveDealOutput 型のすべての属性を含む', async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2025-01-01T00:00:00Z',
      periodEndDateTime: '2025-01-31T23:59:59Z',
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
      expect(deal).toHaveProperty('expectedContractDate');
      expect(deal).toHaveProperty('description');
      expect(deal).toHaveProperty('contractedDate');
      expect(deal).toHaveProperty('lossReason');
      expect(deal).toHaveProperty('createdAt');
      expect(deal).toHaveProperty('updatedAt');
      expect(deal).toHaveProperty('createdBy');
      expect(deal).toHaveProperty('invoiceGenerationSLADeadline');
      expect(deal).toHaveProperty('invoiceSLAExceededFlag');
    });
  });
});
