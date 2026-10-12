import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import { FetchDealsForPeriodInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-1685: fetchDealsForPeriod with contractedDate after invoiceGenerationSLADeadline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return deals where contractedDate is after invoiceGenerationSLADeadline', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords = jest.fn().mockResolvedValue([
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'sales-rep-001',
        dealName: 'A社案件',
        dealAmount: 1000000,
        stageId: '成約',
        expectedContractDate: '2024-01-15T00:00:00Z',
        contractedDate: '2024-01-15T10:00:00Z',
        description: 'テスト商談',
        lossReason: null,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-01-13T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
    ]);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-10T00:00:00Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result = await fetchDealsForPeriod(input);

    expect(result).toBeDefined();
    expect(result.deals).toBeDefined();
    expect(result.deals.length).toBeGreaterThanOrEqual(1);

    const deal = result.deals.find(d => d.dealId === 'deal-001');
    expect(deal).toBeDefined();
    if (deal) {
      expect(deal.contractedDate).toBe('2024-01-15T10:00:00Z');
      expect(deal.invoiceGenerationSLADeadline).toBe('2024-01-13T23:59:59Z');
    }
  });
});
