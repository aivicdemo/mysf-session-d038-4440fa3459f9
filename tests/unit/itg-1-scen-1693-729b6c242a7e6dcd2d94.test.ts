import { fetchDealsForPeriod } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-1693: 生成SLAと送付SLAがいずれか一つ以上超過している場合、警告レベルを危険と判定する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求SLA超過フラグが true のレコードが含まれ、請求生成SLA期限が超過している状態を検証する', async () => {
    const { listRecords } = require('../../src/platform/data-store');
    listRecords.mockResolvedValue([
      {
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: '案件A',
        dealAmount: 1000000,
        stageId: '成約',
        expectedContractDate: '2024-01-15T00:00:00Z',
        description: 'テスト商談',
        contractedDate: '2024-01-10T00:00:00Z',
        lossReason: null,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-10T14:00:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-01-20T00:00:00Z',
        invoiceSLAExceededFlag: true,
      },
      {
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        dealName: '案件B',
        dealAmount: 500000,
        stageId: '成約',
        expectedContractDate: '2024-01-20T00:00:00Z',
        description: 'テスト商談2',
        contractedDate: '2024-01-15T00:00:00Z',
        lossReason: null,
        createdAt: '2024-01-05T09:00:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-01-25T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ]);

    const input = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    const result = await fetchDealsForPeriod(input);

    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.deals[0].dealId).toBe('deal-001');
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(true);
    expect(result.deals[0].invoiceGenerationSLADeadline).toBe('2024-01-20T00:00:00Z');
    expect(result.deals[0].updatedAt).toBe('2024-01-10T14:00:00Z');
    expect(result.deals[1].dealId).toBe('deal-002');
    expect(result.deals[1].invoiceSLAExceededFlag).toBe(false);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
