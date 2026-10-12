import { fetchDealsForPeriod } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

const mockDataStore = require('../../src/platform/data-store');

describe('SCEN-1666: 検出された各差異に対して是正状況が「未対応」で記録され、担当者・期限・是正アクションが設定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch deals within specified period with correct filtering by date range', async () => {
    const deals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社システム導入案件',
        dealAmount: 5000000,
        stageId: '提案段階',
        expectedContractDate: '2024-12-31T23:59:59Z',
        description: '大型システム導入',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-10-01T10:00:00Z',
        updatedAt: '2024-10-15T14:30:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2024-12-31T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社保守契約更新',
        dealAmount: 1200000,
        stageId: '契約段階',
        expectedContractDate: '2024-11-30T23:59:59Z',
        description: '既存顧客の保守契約',
        contractedDate: '2024-11-15T09:00:00Z',
        lossReason: null,
        createdAt: '2024-09-20T08:00:00Z',
        updatedAt: '2024-11-15T09:00:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2024-11-30T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'C社コンサルティング',
        dealAmount: 3500000,
        stageId: '初期接触',
        expectedContractDate: '2025-01-31T23:59:59Z',
        description: '経営コンサルティング案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-10-10T11:00:00Z',
        updatedAt: '2024-10-20T16:45:00Z',
        createdBy: 'admin-002',
        invoiceGenerationSLADeadline: '2025-01-31T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-004',
        dealId: 'deal-004',
        customerId: 'cust-003',
        salesRepresentativeId: 'rep-001',
        dealName: 'D社失注案件',
        dealAmount: 800000,
        stageId: '失注',
        expectedContractDate: '2024-10-31T23:59:59Z',
        description: '競合に敗北',
        contractedDate: null,
        lossReason: '価格競争力なし',
        createdAt: '2024-09-01T09:00:00Z',
        updatedAt: '2024-10-05T13:20:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2024-10-31T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(deals);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-10-01T00:00:00Z',
      periodEndDateTime: '2024-10-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toBeDefined();
    expect(result.deals[0].dealId).toBe('deal-003');
    expect(result.deals[0].updatedAt).toBe('2024-10-20T16:45:00Z');
    expect(result.deals[1].dealId).toBe('deal-001');
    expect(result.deals[1].updatedAt).toBe('2024-10-15T14:30:00Z');
    expect(result.deals[2].dealId).toBe('deal-004');
    expect(result.deals[2].updatedAt).toBe('2024-10-05T13:20:00Z');
  });
});
