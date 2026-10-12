import { fetchDealsForPeriod } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1692: 顧客送付が目標日数の110%を超過した場合、送付SLA超過と判定する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求SLA超過フラグが正しく設定された商談を返す', async () => {
    const { listRecords } = require('../../src/platform/data-store');
    listRecords.mockResolvedValue([
      {
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: '案件A',
        dealAmount: 1000000,
        stageId: '契約済',
        expectedContractDate: '2025-01-15T00:00:00Z',
        description: 'テスト商談',
        contractedDate: '2025-01-10T00:00:00Z',
        lossReason: null,
        createdAt: '2025-01-05T10:00:00Z',
        updatedAt: '2025-01-10T15:00:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2025-01-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-001',
        dealName: '案件B',
        dealAmount: 500000,
        stageId: '契約済',
        expectedContractDate: '2025-01-12T00:00:00Z',
        description: 'テスト商談2',
        contractedDate: '2025-01-08T00:00:00Z',
        lossReason: null,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-08T14:00:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2025-01-13T00:00:00Z',
        invoiceSLAExceededFlag: true,
      },
    ]);

    const input = {
      periodStartDateTime: '2025-01-01T00:00:00Z',
      periodEndDateTime: '2025-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    const result = await fetchDealsForPeriod(input);

    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.deals[0].dealId).toBe('deal-001');
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(false);
    expect(result.deals[1].dealId).toBe('deal-002');
    expect(result.deals[1].invoiceSLAExceededFlag).toBe(true);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
