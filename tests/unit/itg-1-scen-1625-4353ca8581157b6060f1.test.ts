import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1625: 営業担当者に請求漏れ・遅延の検出結果が通知される', () => {
  const mockDeals = [
    {
      id: 'deal-001',
      dealId: 'deal-001',
      customerId: 'customer-001',
      salesRepresentativeId: 'sales-rep-001',
      dealName: 'A社システム導入',
      dealAmount: 5000000,
      stageId: 'stage-001',
      expectedContractDate: '2024-03-15T00:00:00Z',
      description: '大型案件',
      contractedDate: null,
      lossReason: null,
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z',
      createdBy: 'admin-001',
      invoiceGenerationSLADeadline: '2024-02-20T23:59:59Z',
      invoiceSLAExceededFlag: true,
    },
    {
      id: 'deal-002',
      dealId: 'deal-002',
      customerId: 'customer-002',
      salesRepresentativeId: 'sales-rep-001',
      dealName: 'B社ライセンス更新',
      dealAmount: 1500000,
      stageId: 'stage-002',
      expectedContractDate: '2024-02-28T00:00:00Z',
      description: '年間ライセンス',
      contractedDate: '2024-02-20T10:00:00Z',
      lossReason: null,
      createdAt: '2024-01-05T08:00:00Z',
      updatedAt: '2024-01-22T11:15:00Z',
      createdBy: 'admin-001',
      invoiceGenerationSLADeadline: '2024-03-06T23:59:59Z',
      invoiceSLAExceededFlag: false,
    },
    {
      id: 'deal-003',
      dealId: 'deal-003',
      customerId: 'customer-001',
      salesRepresentativeId: 'sales-rep-002',
      dealName: 'C社保守契約',
      dealAmount: 800000,
      stageId: 'stage-003',
      expectedContractDate: '2024-03-01T00:00:00Z',
      description: '保守・サポート',
      contractedDate: null,
      lossReason: null,
      createdAt: '2024-01-08T10:30:00Z',
      updatedAt: '2024-01-21T09:45:00Z',
      createdBy: 'admin-001',
      invoiceGenerationSLADeadline: '2024-02-21T23:59:59Z',
      invoiceSLAExceededFlag: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockDeals);
  });

  it("営業担当者ID='sales-rep-001' に一致する商談を取得する", async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-05T00:00:00Z',
      periodEndDateTime: '2024-01-25T23:59:59Z',
      salesRepresentativeIdFilter: 'sales-rep-001',
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(2);
    expect(result.deals.every((d) => d.salesRepresentativeId === 'sales-rep-001')).toBe(true);
  });

  it('取得した商談を更新日時の降順でソートする', async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-05T00:00:00Z',
      periodEndDateTime: '2024-01-25T23:59:59Z',
      salesRepresentativeIdFilter: 'sales-rep-001',
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals[0].dealId).toBe('deal-002');
    expect(result.deals[0].updatedAt).toBe('2024-01-22T11:15:00Z');
    expect(result.deals[1].dealId).toBe('deal-001');
    expect(result.deals[1].updatedAt).toBe('2024-01-20T14:30:00Z');
  });

  it('totalCount は 2、fetchedAt は ISO 8601 形式の現在日時を返す', async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-05T00:00:00Z',
      periodEndDateTime: '2024-01-25T23:59:59Z',
      salesRepresentativeIdFilter: 'sales-rep-001',
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.totalCount).toBe(2);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
  });
});
