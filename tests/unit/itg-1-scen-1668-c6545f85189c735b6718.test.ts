import { fetchDealsForPeriod } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

const mockDataStore = require('../../src/platform/data-store');

describe('SCEN-1668: 検出された差異が異常検知ログとして記録され、追跡可能な状態で保存される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch deals filtered by sales representative with SLA exceeded flag detection', async () => {
    const deals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'sales-rep-001',
        dealName: 'A社システム導入案件',
        dealAmount: 5000000,
        stageId: '提案段階',
        expectedContractDate: '2024-03-15T00:00:00Z',
        description: 'A社への基幹システム導入',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-10T09:30:00Z',
        updatedAt: '2024-01-15T14:20:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-03-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'sales-rep-001',
        dealName: 'B社保守契約更新',
        dealAmount: 2000000,
        stageId: '受注',
        expectedContractDate: '2024-02-28T00:00:00Z',
        description: 'B社年間保守契約の更新手続き',
        contractedDate: '2024-02-20T00:00:00Z',
        lossReason: null,
        createdAt: '2024-01-05T10:15:00Z',
        updatedAt: '2024-02-20T16:45:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-02-25T00:00:00Z',
        invoiceSLAExceededFlag: true,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-001',
        salesRepresentativeId: 'sales-rep-002',
        dealName: 'A社追加ライセンス',
        dealAmount: 1500000,
        stageId: '初期接触',
        expectedContractDate: '2024-04-30T00:00:00Z',
        description: 'A社が既存システムに追加ライセンスを購入する案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-20T11:00:00Z',
        updatedAt: '2024-01-20T11:00:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-05-05T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(deals);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-10T00:00:00Z',
      periodEndDateTime: '2024-02-25T23:59:59Z',
      salesRepresentativeIdFilter: 'sales-rep-001',
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.fetchedAt).toBeDefined();
    expect(result.deals[0].dealId).toBe('deal-002');
    expect(result.deals[0].updatedAt).toBe('2024-02-20T16:45:00Z');
    expect(result.deals[0].dealAmount).toBe(2000000);
    expect(result.deals[0].salesRepresentativeId).toBe('sales-rep-001');
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(true);
    expect(result.deals[1].dealId).toBe('deal-001');
    expect(result.deals[1].updatedAt).toBe('2024-01-15T14:20:00Z');
    expect(result.deals[1].dealAmount).toBe(5000000);
    expect(result.deals[1].salesRepresentativeId).toBe('sales-rep-001');
    expect(result.deals[1].invoiceSLAExceededFlag).toBe(false);
  });
});
