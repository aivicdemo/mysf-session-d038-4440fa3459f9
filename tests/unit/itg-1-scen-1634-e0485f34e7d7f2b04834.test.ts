import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchDealsForPeriod, type FetchDealsForPeriodOutput, type SaveDealOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1634: 請求書が商談クローズ前に発行されている場合、正常に取得される', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期間内の成約済み商談レコードを正常に取得する', async () => {
    const deals: SaveDealOutput[] = [
      {
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: '案件A',
        dealAmount: 1000000,
        stageId: '成約',
        expectedContractDate: '2025-02-01T00:00:00Z',
        description: 'テスト商談',
        contractedDate: '2025-01-15T10:30:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-01-22T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2025-01-10T08:00:00Z',
        updatedAt: '2025-01-15T10:30:00Z',
        createdBy: 'user-001',
      },
      {
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: '案件B',
        dealAmount: 500000,
        stageId: '提案',
        expectedContractDate: '2025-03-01T00:00:00Z',
        description: 'テスト商談2',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        createdAt: '2025-01-05T09:00:00Z',
        updatedAt: '2025-01-14T15:45:00Z',
        createdBy: 'user-002',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(deals as any);

    const input = {
      periodStartDateTime: '2025-01-10T00:00:00Z',
      periodEndDateTime: '2025-01-20T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    const result = await fetchDealsForPeriod(input);

    expect(result).toHaveProperty('deals');
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('fetchedAt');
    expect(result.totalCount).toBe(2);
    expect(result.deals).toHaveLength(2);
    expect(result.deals[0]).toMatchObject({
      dealId: 'deal-001',
      dealAmount: 1000000,
      stageId: '成約',
      contractedDate: '2025-01-15T10:30:00Z',
      invoiceGenerationSLADeadline: '2025-01-22T23:59:59Z',
    });
  });
});
