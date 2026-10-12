import { fetchDealsForPeriod, SaveDealOutput, FetchDealsForPeriodOutput } from '../../src/logic/data-persistence';

const mockDeals: SaveDealOutput[] = [
  {
    dealId: 'deal-001',
    customerId: 'customer-001',
    salesRepresentativeId: 'sales-rep-001',
    dealName: 'A社システム導入案件',
    dealAmount: 5000000,
    stageId: 'negotiation',
    expectedContractDate: '2024-01-15T00:00:00Z',
    contractedDate: null,
    description: 'A社向けシステム導入プロジェクト',
    lossReason: null,
    invoiceGenerationSLADeadline: '2024-02-05T00:00:00Z',
    invoiceSLAExceededFlag: false,
    createdAt: '2023-12-20T10:30:00Z',
    updatedAt: '2024-01-05T14:20:00Z',
    createdBy: 'user-001',
  },
  {
    dealId: 'deal-002',
    customerId: 'customer-002',
    salesRepresentativeId: 'sales-rep-002',
    dealName: 'B社サポート契約',
    dealAmount: 1200000,
    stageId: 'closed_won',
    expectedContractDate: '2024-01-10T00:00:00Z',
    contractedDate: '2024-01-10T09:15:00Z',
    description: 'B社向けサポートサービス年間契約',
    lossReason: null,
    invoiceGenerationSLADeadline: '2024-01-25T00:00:00Z',
    invoiceSLAExceededFlag: false,
    createdAt: '2024-01-02T08:00:00Z',
    updatedAt: '2024-01-10T09:15:00Z',
    createdBy: 'user-002',
  },
  {
    dealId: 'deal-003',
    customerId: 'customer-003',
    salesRepresentativeId: 'sales-rep-001',
    dealName: 'C社コンサルティング',
    dealAmount: 3500000,
    stageId: 'proposal',
    expectedContractDate: '2024-01-22T00:00:00Z',
    contractedDate: null,
    description: 'C社向けビジネスコンサルティングサービス',
    lossReason: null,
    invoiceGenerationSLADeadline: '2024-02-10T00:00:00Z',
    invoiceSLAExceededFlag: false,
    createdAt: '2024-01-08T11:45:00Z',
    updatedAt: '2024-01-20T16:30:00Z',
    createdBy: 'user-001',
  },
  {
    dealId: 'deal-004',
    customerId: 'customer-004',
    salesRepresentativeId: 'sales-rep-003',
    dealName: 'D社失注案件',
    dealAmount: 800000,
    stageId: 'closed_lost',
    expectedContractDate: '2024-01-25T00:00:00Z',
    contractedDate: null,
    description: 'D社向け提案（失注）',
    lossReason: '予算削減により提案取り下げ',
    invoiceGenerationSLADeadline: null,
    invoiceSLAExceededFlag: false,
    createdAt: '2024-01-12T09:00:00Z',
    updatedAt: '2024-01-18T13:20:00Z',
    createdBy: 'user-003',
  },
];

jest.mock('../../src/platform/data-store.ts', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  DataStore: {
    listRecords: jest.fn().mockResolvedValue(mockDeals),
  },
}));

describe('SCEN-1677: 月次締め対象期間内の全商談を取得し、請求書生成SLA期限の判定対象を確定する', () => {
  it('期間内に作成または更新された全商談が更新日時の降順で返される', async () => {
    const input = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    const result: FetchDealsForPeriodOutput = await fetchDealsForPeriod(input);

    expect(result.deals).toHaveLength(4);
    expect(result.totalCount).toBe(4);
    expect(result.fetchedAt).toBeDefined();

    const deals = result.deals;
    for (let i = 0; i < deals.length - 1; i++) {
      expect(new Date(deals[i].updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(deals[i + 1].updatedAt).getTime());
    }
  });
});
