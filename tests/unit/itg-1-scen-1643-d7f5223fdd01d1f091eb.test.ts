import { fetchDealsForPeriod } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-1643: 期間内のレコード取得と updatedAt 降順でのソート確認', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談テーブルから該当期間のレコード2件が取得され、updatedAt降順でソートされる', async () => {
    const dataStore = require('../../src/platform/data-store');

    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'ABC契約案件',
        dealAmount: 1000000,
        stageId: 'stage-01',
        expectedContractDate: '2024-01-15T00:00:00Z',
        description: 'テスト商談1',
        contractedDate: '2024-01-15T00:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-01-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-05T10:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'XYZ契約案件',
        dealAmount: 2000000,
        stageId: 'stage-01',
        expectedContractDate: '2024-01-20T00:00:00Z',
        description: 'テスト商談2',
        contractedDate: '2024-01-20T00:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-01-25T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-08T09:00:00Z',
        updatedAt: '2024-01-20T11:00:00Z',
        createdBy: 'user-002',
      },
    ];

    dataStore.listRecords.mockResolvedValue(mockDeals);

    const input = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    const result = await fetchDealsForPeriod(input);

    expect(result).toBeDefined();
    expect(result.deals).toBeDefined();
    expect(result.deals.length).toBe(2);
    expect(result.totalCount).toBe(2);
    expect(result.deals[0].dealId).toBe('deal-002');
    expect(result.deals[1].dealId).toBe('deal-001');
    expect(result.deals[0].updatedAt).toBe('2024-01-20T11:00:00Z');
    expect(result.deals[1].updatedAt).toBe('2024-01-15T14:30:00Z');
  });

  it('fetchedAt フィールドが ISO 8601形式で返される', async () => {
    const dataStore = require('../../src/platform/data-store');

    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'ABC契約案件',
        dealAmount: 1000000,
        stageId: 'stage-01',
        expectedContractDate: '2024-01-15T00:00:00Z',
        description: 'テスト商談1',
        contractedDate: '2024-01-15T00:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-01-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-05T10:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        createdBy: 'user-001',
      },
    ];

    dataStore.listRecords.mockResolvedValue(mockDeals);

    const input = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    const result = await fetchDealsForPeriod(input);

    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.fetchedAt)).toBe(true);
  });

  it('各商談レコードに SaveDealOutput 型の全属性が含まれる', async () => {
    const dataStore = require('../../src/platform/data-store');

    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'ABC契約案件',
        dealAmount: 1000000,
        stageId: 'stage-01',
        expectedContractDate: '2024-01-15T00:00:00Z',
        description: 'テスト商談1',
        contractedDate: '2024-01-15T00:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-01-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-05T10:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        createdBy: 'user-001',
      },
    ];

    dataStore.listRecords.mockResolvedValue(mockDeals);

    const input = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    const result = await fetchDealsForPeriod(input);

    expect(result.deals[0]).toHaveProperty('dealId');
    expect(result.deals[0]).toHaveProperty('customerId');
    expect(result.deals[0]).toHaveProperty('salesRepresentativeId');
    expect(result.deals[0]).toHaveProperty('dealName');
    expect(result.deals[0]).toHaveProperty('dealAmount');
    expect(result.deals[0]).toHaveProperty('stageId');
    expect(result.deals[0]).toHaveProperty('expectedContractDate');
    expect(result.deals[0]).toHaveProperty('description');
    expect(result.deals[0]).toHaveProperty('contractedDate');
    expect(result.deals[0]).toHaveProperty('lossReason');
    expect(result.deals[0]).toHaveProperty('invoiceGenerationSLADeadline');
    expect(result.deals[0]).toHaveProperty('invoiceSLAExceededFlag');
    expect(result.deals[0]).toHaveProperty('createdAt');
    expect(result.deals[0]).toHaveProperty('updatedAt');
    expect(result.deals[0]).toHaveProperty('createdBy');
  });
});
