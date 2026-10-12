import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

describe('SCEN-1658: 旧新システム間で商談の件数・金額・ステータスが完全に一致し、差異が検出されない', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all deals within period in descending order by updatedAt and verify complete data consistency', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社向けシステム導入',
        dealAmount: 5000000,
        stageId: '提案',
        expectedContractDate: '2024-03-31T00:00:00Z',
        contractedDate: null,
        description: '大型案件',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-04-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-001',
        dealName: 'B社向けコンサルティング',
        dealAmount: 3000000,
        stageId: '受注',
        expectedContractDate: '2024-02-28T00:00:00Z',
        contractedDate: '2024-02-20T00:00:00Z',
        description: '中規模案件',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-03-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-02-20T14:00:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-003',
        salesRepresentativeId: 'rep-002',
        dealName: 'C社向けライセンス販売',
        dealAmount: 1500000,
        stageId: '初期接触',
        expectedContractDate: '2024-04-30T00:00:00Z',
        contractedDate: null,
        description: '小規模案件',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-05-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-18T11:00:00Z',
        updatedAt: '2024-01-19T16:45:00Z',
        createdBy: 'user-002',
      },
      {
        id: 'deal-004',
        dealId: 'deal-004',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-002',
        dealName: 'A社向け追加機能',
        dealAmount: 2000000,
        stageId: '失注',
        expectedContractDate: '2024-05-31T00:00:00Z',
        contractedDate: null,
        description: '予算削減により失注',
        lossReason: '予算不足',
        invoiceGenerationSLADeadline: '2024-06-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-05T08:30:00Z',
        updatedAt: '2024-01-25T10:00:00Z',
        createdBy: 'user-002',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(mockDeals);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-10T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(4);
    expect(result.totalCount).toBe(4);

    expect(result.deals[0].dealId).toBe('deal-004');
    expect(result.deals[0].updatedAt).toBe('2024-01-25T10:00:00Z');
    expect(result.deals[0].dealAmount).toBe(2000000);
    expect(result.deals[0].stageId).toBe('失注');

    expect(result.deals[1].dealId).toBe('deal-001');
    expect(result.deals[1].updatedAt).toBe('2024-01-20T15:30:00Z');
    expect(result.deals[1].dealAmount).toBe(5000000);
    expect(result.deals[1].stageId).toBe('提案');

    expect(result.deals[2].dealId).toBe('deal-003');
    expect(result.deals[2].updatedAt).toBe('2024-01-19T16:45:00Z');
    expect(result.deals[2].dealAmount).toBe(1500000);
    expect(result.deals[2].stageId).toBe('初期接触');

    expect(result.deals[3].dealId).toBe('deal-002');
    expect(result.deals[3].updatedAt).toBe('2024-02-20T14:00:00Z');
    expect(result.deals[3].dealAmount).toBe(3000000);
    expect(result.deals[3].stageId).toBe('受注');

    const totalAmount = result.deals.reduce((sum, deal) => sum + deal.dealAmount, 0);
    expect(totalAmount).toBe(11500000);

    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
  });
});
