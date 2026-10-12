import { fetchDealsForPeriod, SaveDealOutput, FetchDealsForPeriodOutput } from '../../src/logic/data-persistence';

const mockDeal: SaveDealOutput = {
  dealId: 'deal-001',
  customerId: 'customer-001',
  salesRepresentativeId: 'rep-001',
  dealName: 'A社との契約',
  dealAmount: 1000000,
  stageId: 'negotiation',
  expectedContractDate: '2025-03-15T00:00:00Z',
  contractedDate: null,
  description: 'テスト商談',
  lossReason: null,
  invoiceGenerationSLADeadline: '2025-04-15T00:00:00Z',
  invoiceSLAExceededFlag: false,
  createdAt: '2025-01-10T10:00:00Z',
  updatedAt: '2025-01-15T14:30:00Z',
  createdBy: 'user-001',
};

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  DataStore: {
    listRecords: jest.fn().mockResolvedValue([mockDeal]),
  },
}));

describe('SCEN-1675: ステータスマッピングルールが空の場合、処理は継続される', () => {
  it('正常に完了し、FetchDealsForPeriodOutput が返される', async () => {
    const input = {
      periodStartDateTime: '2025-01-01T00:00:00Z',
      periodEndDateTime: '2025-02-01T00:00:00Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    const result: FetchDealsForPeriodOutput = await fetchDealsForPeriod(input);

    expect(result).toBeDefined();
    expect(result.deals).toHaveLength(1);
    expect(result.deals[0].dealId).toBe('deal-001');
    expect(result.deals[0].stageId).toBe('negotiation');
    expect(result.totalCount).toBe(1);
    expect(result.fetchedAt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
