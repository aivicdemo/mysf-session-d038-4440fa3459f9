import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import { FetchDealsForPeriodInput, FetchDealsForPeriodOutput, SaveDealOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-1683: fetchDealsForPeriod with null expectedContractDate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return deals including the one with null expectedContractDate', async () => {
    // Mock data-store
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords = jest.fn().mockResolvedValue([
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'テスト商談A',
        dealAmount: 1000000,
        stageId: 'クローズ',
        expectedContractDate: '2024-01-15T00:00:00Z',
        contractedDate: null,
        description: 'テスト用商談',
        lossReason: null,
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-20T15:00:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-01-22T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'テスト商談B',
        dealAmount: 2000000,
        stageId: 'クローズ',
        expectedContractDate: null,
        contractedDate: null,
        description: '商談クローズ日が未設定',
        lossReason: null,
        createdAt: '2024-01-05T09:00:00Z',
        updatedAt: '2024-01-18T12:00:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-01-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ]);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result = await fetchDealsForPeriod(input);

    expect(result).toBeDefined();
    expect(result.deals).toBeDefined();
    expect(result.deals.length).toBeGreaterThanOrEqual(1);

    const deal002 = result.deals.find(d => d.dealId === 'deal-002');
    expect(deal002).toBeDefined();
    expect(deal002?.expectedContractDate).toBeNull();
  });
});
