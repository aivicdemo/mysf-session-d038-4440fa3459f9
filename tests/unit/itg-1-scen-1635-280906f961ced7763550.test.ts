import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchDealsForPeriod, type SaveDealOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1635: 商談確定金額が請求合計金額より多い場合、未請求として検出される', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期間内の成約済み商談レコードを正常に取得する（請求無し）', async () => {
    const deals: SaveDealOutput[] = [
      {
        dealId: 'deal-001-uuid',
        customerId: 'customer-001-uuid',
        salesRepresentativeId: 'sales-rep-001-uuid',
        dealName: 'ABC社向けシステム導入',
        dealAmount: 5000000,
        stageId: '成約',
        expectedContractDate: '2026-01-15T00:00:00Z',
        description: '大型案件',
        contractedDate: '2026-01-15T09:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2026-01-22T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2025-12-20T10:00:00Z',
        updatedAt: '2026-01-15T09:00:00Z',
        createdBy: 'admin-001-uuid',
      },
      {
        dealId: 'deal-002-uuid',
        customerId: 'customer-002-uuid',
        salesRepresentativeId: 'sales-rep-002-uuid',
        dealName: 'XYZ社保守契約',
        dealAmount: 3000000,
        stageId: '成約',
        expectedContractDate: '2026-01-20T00:00:00Z',
        description: '年間保守料',
        contractedDate: '2026-01-20T14:30:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2026-01-27T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2026-01-05T11:00:00Z',
        updatedAt: '2026-01-20T14:30:00Z',
        createdBy: 'admin-002-uuid',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(deals as any);

    const input = {
      periodStartDateTime: '2026-01-01T00:00:00Z',
      periodEndDateTime: '2026-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    const result = await fetchDealsForPeriod(input);

    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.deals[0]).toMatchObject({
      dealId: 'deal-001-uuid',
      dealAmount: 5000000,
      stageId: '成約',
    });
    expect(result.deals[1]).toMatchObject({
      dealId: 'deal-002-uuid',
      dealAmount: 3000000,
      stageId: '成約',
    });
    expect(result.fetchedAt).toBeDefined();
  });
});
