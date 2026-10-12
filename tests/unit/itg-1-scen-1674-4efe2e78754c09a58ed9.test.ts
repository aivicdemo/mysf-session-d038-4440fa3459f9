import { fetchDealsForPeriod, SaveDealOutput, FetchDealsForPeriodOutput } from '../../src/logic/data-persistence';

const mockDeal: SaveDealOutput = {
  dealId: 'deal-001',
  customerId: 'customer-001',
  salesRepresentativeId: 'sales-rep-001',
  dealName: 'A社 システム導入',
  dealAmount: 5000000,
  stageId: '提案段階',
  expectedContractDate: '2024-02-15T00:00:00Z',
  contractedDate: null,
  description: 'システム導入提案中',
  lossReason: null,
  invoiceGenerationSLADeadline: '2024-03-15T00:00:00Z',
  invoiceSLAExceededFlag: false,
  createdAt: '2024-01-10T10:00:00Z',
  updatedAt: '2024-01-15T14:30:00Z',
  createdBy: 'user-001',
};

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  DataStore: {
    listRecords: jest.fn().mockResolvedValue([mockDeal]),
  },
}));

describe('SCEN-1674: 許容閾値が0の場合、エラー発生なし', () => {
  it('エラーが発生せず、正しく出力が返される', async () => {
    const input = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    const result: FetchDealsForPeriodOutput = await fetchDealsForPeriod(input);

    expect(result).toBeDefined();
    expect(result.deals).toHaveLength(1);
    expect(result.deals[0]).toEqual(mockDeal);
    expect(result.totalCount).toBe(1);
    expect(result.fetchedAt).toBeDefined();
  });
});
