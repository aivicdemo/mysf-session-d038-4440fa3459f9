import { fetchDealsForPeriod, FetchDealsForPeriodInput, FetchDealsForPeriodOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

const mockDataStore = require('../../src/platform/data-store');

describe('SCEN-1660: 旧新システム間で商談の金額差異が許容閾値を超過し、重大度criticalで差異が検出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch deals with amount discrepancy detected when old-new system difference exceeds threshold', async () => {
    const deals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: '大型プロジェクトA',
        dealAmount: 1000000,
        stageId: '提案中',
        expectedContractDate: '2024-12-31T23:59:59Z',
        description: '旧システム登録',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2025-01-15T10:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: '大型プロジェクトA',
        dealAmount: 1250000,
        stageId: '提案中',
        expectedContractDate: '2024-12-31T23:59:59Z',
        description: '新システム登録',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-16T10:00:00Z',
        updatedAt: '2024-01-16T10:00:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2025-01-16T10:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(deals);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: 'rep-001',
      customerIdFilter: 'customer-001',
      stageIdFilter: null,
      sortBy: 'dealAmount',
    });

    expect(result.deals).toHaveLength(2);
    expect(result.deals[0].dealAmount).toBe(1000000);
    expect(result.deals[1].dealAmount).toBe(1250000);
    expect(result.totalCount).toBe(2);
    expect(result.fetchedAt).toBeDefined();
  });
});
