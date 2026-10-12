import { fetchDealsForPeriod } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

const mockDataStore = require('../../src/platform/data-store');

describe('SCEN-1667: 差異検出結果がダッシュボード可視化形式で営業部システム担当に通知される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch deals within specified date range and return dashboard-ready format', async () => {
    const deals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-a',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社システム導入',
        dealAmount: 5000000,
        stageId: 'stage-proposal',
        expectedContractDate: '2024-03-15T00:00:00Z',
        description: '新システム導入プロジェクト',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-03-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-b',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社コンサル契約',
        dealAmount: 3000000,
        stageId: 'stage-negotiation',
        expectedContractDate: '2024-04-30T00:00:00Z',
        description: '経営コンサルティング',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-12T10:00:00Z',
        updatedAt: '2024-01-18T11:20:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-05-05T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-a',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社追加ライセンス',
        dealAmount: 1500000,
        stageId: 'stage-closed-won',
        expectedContractDate: '2024-02-28T00:00:00Z',
        description: 'ライセンス追加契約',
        contractedDate: '2024-02-25T00:00:00Z',
        lossReason: null,
        createdAt: '2024-01-05T08:30:00Z',
        updatedAt: '2024-02-25T16:45:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-03-02T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(deals);

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
    expect(result.fetchedAt).toBeDefined();
    expect(result.deals[0].dealId).toBe('deal-002');
    expect(result.deals[0].updatedAt).toBe('2024-01-18T11:20:00Z');
    expect(result.deals[1].dealId).toBe('deal-001');
    expect(result.deals[1].updatedAt).toBe('2024-01-15T14:30:00Z');
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
