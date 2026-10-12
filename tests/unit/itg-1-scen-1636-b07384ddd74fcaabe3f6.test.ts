import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchDealsForPeriod, type SaveDealOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1636: 商談確定金額が請求合計金額より少ない場合、過請求として検出される', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期間内の成約済み商談レコードを正常に取得する（過請求状態）', async () => {
    const deals: SaveDealOutput[] = [
      {
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社システム導入',
        dealAmount: 1000000,
        stageId: '成約',
        expectedContractDate: '2025-01-15T00:00:00Z',
        description: '契約済み',
        contractedDate: '2025-01-10T09:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-01-25T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2025-01-05T10:00:00Z',
        updatedAt: '2025-01-10T09:30:00Z',
        createdBy: 'admin-001',
      },
      {
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社コンサル契約',
        dealAmount: 500000,
        stageId: '成約',
        expectedContractDate: '2025-01-20T00:00:00Z',
        description: '請求済み（合計1200000円）',
        contractedDate: '2025-01-12T14:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-01-27T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2025-01-06T11:00:00Z',
        updatedAt: '2025-01-12T14:30:00Z',
        createdBy: 'admin-001',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(deals as any);

    const input = {
      periodStartDateTime: '2025-01-05T00:00:00Z',
      periodEndDateTime: '2025-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    const result = await fetchDealsForPeriod(input);

    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.deals[0]).toMatchObject({
      dealId: 'deal-001',
      dealAmount: 1000000,
      stageId: '成約',
    });
    expect(result.deals[1]).toMatchObject({
      dealId: 'deal-002',
      dealAmount: 500000,
      stageId: '成約',
    });
    expect(result.fetchedAt).toBeDefined();
  });
});
