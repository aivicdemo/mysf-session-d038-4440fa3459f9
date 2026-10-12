import { fetchDealsForPeriod, SaveDealOutput, FetchDealsForPeriodOutput } from '../../src/logic/data-persistence';

const mockDeals: SaveDealOutput[] = [
  {
    dealId: 'deal-001',
    customerId: 'customer-001',
    salesRepresentativeId: 'sales-rep-001',
    dealName: 'A社システム導入案件',
    dealAmount: 5000000,
    stageId: 'unmapped-status-xyz',
    expectedContractDate: '2024-12-31T00:00:00Z',
    contractedDate: null,
    description: 'レガシーシステム置換案件',
    lossReason: null,
    invoiceGenerationSLADeadline: '2024-03-31T23:59:59Z',
    invoiceSLAExceededFlag: false,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-02-20T14:30:00Z',
    createdBy: 'admin-001',
  },
  {
    dealId: 'deal-002',
    customerId: 'customer-002',
    salesRepresentativeId: 'sales-rep-002',
    dealName: 'B社保守契約更新',
    dealAmount: 1200000,
    stageId: 'negotiation',
    expectedContractDate: '2024-03-15T00:00:00Z',
    contractedDate: null,
    description: '年間保守契約の更新交渉',
    lossReason: null,
    invoiceGenerationSLADeadline: '2024-04-15T23:59:59Z',
    invoiceSLAExceededFlag: false,
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-02-25T16:45:00Z',
    createdBy: 'admin-001',
  },
];

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  DataStore: {
    listRecords: jest.fn().mockResolvedValue(mockDeals),
  },
}));

describe('SCEN-1676: ステータスマッピングルールに存在しないステータス値は、マッピング前の値のままステータス比較に使用される', () => {
  it('unmapped-status-xyz がマッピング前の値のまま格納される', async () => {
    const input = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-02-28T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    const result: FetchDealsForPeriodOutput = await fetchDealsForPeriod(input);

    expect(result.deals).toHaveLength(2);
    expect(result.deals[0].dealId).toBe('deal-001');
    expect(result.deals[0].stageId).toBe('unmapped-status-xyz');
    expect(result.deals[1].dealId).toBe('deal-002');
    expect(result.totalCount).toBe(2);
    expect(result.fetchedAt).toBeDefined();
  });
});
