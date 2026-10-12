import { fetchDealsForPeriod } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

const mockDataStore = require('../../src/platform/data-store');

describe('SCEN-1665: 複数の差異が検出され、検査対象件数・差異件数・累積金額差分・重大度別件数がサマリーメトリクスに正確に集計される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch multiple deals and summarize metrics correctly', async () => {
    const deals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社システム導入案件',
        dealAmount: 5000000,
        stageId: 'stage-proposal',
        expectedContractDate: '2024-03-31T00:00:00Z',
        description: 'A社向けシステム導入',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-04-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-001',
        dealName: 'B社コンサル案件',
        dealAmount: 3000000,
        stageId: 'stage-negotiation',
        expectedContractDate: '2024-02-28T00:00:00Z',
        description: 'B社向けコンサルティング',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-22T11:15:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-03-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-002',
        dealName: 'A社保守契約',
        dealAmount: 1200000,
        stageId: 'stage-contract',
        expectedContractDate: '2024-01-31T00:00:00Z',
        description: 'A社向け保守契約',
        contractedDate: '2024-01-25T00:00:00Z',
        lossReason: null,
        createdAt: '2024-01-05T08:30:00Z',
        updatedAt: '2024-01-25T16:45:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-02-10T00:00:00Z',
        invoiceSLAExceededFlag: true,
      },
      {
        id: 'deal-004',
        dealId: 'deal-004',
        customerId: 'customer-003',
        salesRepresentativeId: 'rep-002',
        dealName: 'C社企画案件',
        dealAmount: 2500000,
        stageId: 'stage-lost',
        expectedContractDate: '2024-04-30T00:00:00Z',
        description: 'C社向け企画案件',
        contractedDate: null,
        lossReason: '予算削減',
        createdAt: '2024-01-08T07:00:00Z',
        updatedAt: '2024-01-23T13:20:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-05-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-005',
        dealId: 'deal-005',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-003',
        dealName: 'B社追加導入',
        dealAmount: 1800000,
        stageId: 'stage-proposal',
        expectedContractDate: '2024-03-15T00:00:00Z',
        description: 'B社向け追加導入',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-18T12:00:00Z',
        updatedAt: '2024-01-21T10:30:00Z',
        createdBy: 'user-003',
        invoiceGenerationSLADeadline: '2024-04-10T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(deals);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(5);
    expect(result.totalCount).toBe(5);
    expect(result.fetchedAt).toBeDefined();
    expect(result.deals[0].dealId).toBe('deal-003');
    expect(result.deals[0].updatedAt).toBe('2024-01-25T16:45:00Z');
    expect(result.deals[1].dealId).toBe('deal-002');
    expect(result.deals[2].dealId).toBe('deal-004');
    expect(result.deals[3].dealId).toBe('deal-001');
    expect(result.deals[4].dealId).toBe('deal-005');
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
