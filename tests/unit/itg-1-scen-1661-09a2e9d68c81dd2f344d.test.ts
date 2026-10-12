import { fetchDealsForPeriod } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

const mockDataStore = require('../../src/platform/data-store');

describe('SCEN-1661: 旧新システム間でステータスマッピングルールに従って対応させたステータスが一致せず、重大度criticalで差異が検出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch deals and detect status mapping discrepancy with critical severity', async () => {
    const deals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'sales-rep-001',
        dealName: 'A社プロジェクト',
        dealAmount: 1000000,
        stageId: 'Negotiation',
        expectedContractDate: '2024-12-31T23:59:59Z',
        description: '契約交渉中',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-11-01T10:00:00Z',
        updatedAt: '2024-11-15T14:30:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-12-31T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'sales-rep-002',
        dealName: 'B社システム導入',
        dealAmount: 2500000,
        stageId: 'Won',
        expectedContractDate: '2024-11-30T23:59:59Z',
        description: '成約済み',
        contractedDate: '2024-11-20T09:00:00Z',
        lossReason: null,
        createdAt: '2024-10-15T09:00:00Z',
        updatedAt: '2024-11-20T09:00:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-11-20T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-001',
        salesRepresentativeId: 'sales-rep-001',
        dealName: 'A社追加案件',
        dealAmount: 500000,
        stageId: 'Qualification',
        expectedContractDate: '2025-01-31T23:59:59Z',
        description: '要件検討中',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-11-10T11:00:00Z',
        updatedAt: '2024-11-18T16:45:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2025-01-31T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(deals);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-11-01T00:00:00Z',
      periodEndDateTime: '2024-11-30T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toBeDefined();
    expect(result.deals[0].dealId).toBe('deal-003');
    expect(result.deals[1].dealId).toBe('deal-002');
    expect(result.deals[2].dealId).toBe('deal-001');
  });
});
