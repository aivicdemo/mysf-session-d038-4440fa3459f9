import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchDealsForPeriod, type SaveDealOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1637: 請求明細の行金額合計が請求書合計金額と不一致の場合、不整合として検出される', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期間内の商談レコードを正常に取得する（請求明細の不整合を含む）', async () => {
    const deals: SaveDealOutput[] = [
      {
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社 システム導入案件',
        dealAmount: 1000000,
        stageId: '成約',
        expectedContractDate: '2024-01-15T00:00:00Z',
        description: '大型案件',
        contractedDate: '2024-01-10T09:30:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-01-17T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-10T09:30:00Z',
        createdBy: 'user-001',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(deals as any);

    const input = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    const result = await fetchDealsForPeriod(input);

    expect(result.deals).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    expect(result.deals[0]).toMatchObject({
      dealId: 'deal-001',
      customerId: 'customer-001',
      salesRepresentativeId: 'rep-001',
      dealName: 'A社 システム導入案件',
      dealAmount: 1000000,
      stageId: '成約',
      contractedDate: '2024-01-10T09:30:00Z',
    });
    expect(result.fetchedAt).toBeDefined();
  });
});
