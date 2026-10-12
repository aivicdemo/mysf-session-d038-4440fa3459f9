import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1628: 商談ステータスが未定義の場合、警告がログに記録されるが処理は継続される', () => {
  const mockDeals = [
    {
      id: 'deal-001',
      dealId: 'deal-001',
      customerId: 'cust-001',
      salesRepresentativeId: 'rep-001',
      dealName: 'A社案件',
      dealAmount: 1000000,
      stageId: '提案段階',
      expectedContractDate: '2024-02-15T00:00:00Z',
      description: 'テスト商談',
      contractedDate: null,
      lossReason: null,
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-15T15:30:00Z',
      createdBy: 'user-001',
      invoiceGenerationSLADeadline: '2024-02-20T00:00:00Z',
      invoiceSLAExceededFlag: false,
    },
    {
      id: 'deal-002',
      dealId: 'deal-002',
      customerId: 'cust-002',
      salesRepresentativeId: 'rep-002',
      dealName: 'B社案件',
      dealAmount: 500000,
      stageId: null,
      expectedContractDate: '2024-02-28T00:00:00Z',
      description: 'ステージ未定義の商談',
      contractedDate: null,
      lossReason: null,
      createdAt: '2024-01-12T09:00:00Z',
      updatedAt: '2024-01-16T14:00:00Z',
      createdBy: 'user-002',
      invoiceGenerationSLADeadline: '2024-03-05T00:00:00Z',
      invoiceSLAExceededFlag: false,
    },
    {
      id: 'deal-003',
      dealId: 'deal-003',
      customerId: 'cust-001',
      salesRepresentativeId: 'rep-001',
      dealName: 'C社案件',
      dealAmount: 750000,
      stageId: '契約段階',
      expectedContractDate: '2024-03-10T00:00:00Z',
      description: '通常の商談',
      contractedDate: null,
      lossReason: null,
      createdAt: '2024-01-11T08:30:00Z',
      updatedAt: '2024-01-14T16:45:00Z',
      createdBy: 'user-001',
      invoiceGenerationSLADeadline: '2024-03-15T00:00:00Z',
      invoiceSLAExceededFlag: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockDeals);
  });

  it('ステージが未定義の商談を含むすべてのレコードを返す', async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-10T00:00:00Z',
      periodEndDateTime: '2024-01-20T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(3);
    expect(result.totalCount).toBe(3);
  });

  it('返却値には deal-002 を含む、stageId が null のレコードが含まれる', async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-10T00:00:00Z',
      periodEndDateTime: '2024-01-20T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    const deal002 = result.deals.find((d) => d.dealId === 'deal-002');
    expect(deal002).toBeDefined();
    expect(deal002?.stageId).toBeNull();
  });

  it('エラーは発生せず、正常な FetchDealsForPeriodOutput を返す', async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-10T00:00:00Z',
      periodEndDateTime: '2024-01-20T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result).toHaveProperty('deals');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('fetchedAt');
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
  });
});
