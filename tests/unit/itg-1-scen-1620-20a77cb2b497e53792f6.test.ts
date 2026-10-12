import { fetchDealsForPeriod, type FetchDealsForPeriodOutput, type SaveDealOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1620: 商談ステータスが受注で請求書ステータスが未作成の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetchDealsForPeriodが指定期間内の受注案件を正常に取得する', async () => {
    const mockDealRecord: SaveDealOutput = {
      dealId: 'deal-001',
      customerId: 'customer-001',
      salesRepresentativeId: 'rep-001',
      dealName: 'A社新規案件',
      dealAmount: 1000000,
      stageId: '受注',
      expectedContractDate: '2026-10-15T00:00:00.000Z',
      description: '契約済み',
      contractedDate: '2026-10-10T00:00:00.000Z',
      lossReason: null,
      invoiceGenerationSLADeadline: '2026-10-17T00:00:00.000Z',
      invoiceSLAExceededFlag: false,
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-10T15:30:00.000Z',
      createdBy: 'user-001',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce([mockDealRecord]);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2026-10-01T00:00:00.000Z',
      periodEndDateTime: '2026-10-31T23:59:59.999Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(1);
    expect(result.totalCount).toBe(1);
    expect(result.deals[0].dealId).toBe('deal-001');
    expect(result.deals[0].stageId).toBe('受注');
    expect(result.deals[0].dealAmount).toBe(1000000);
    expect(result.deals[0].contractedDate).toBe('2026-10-10T00:00:00.000Z');
    expect(result.deals[0].invoiceGenerationSLADeadline).toBe('2026-10-17T00:00:00.000Z');
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(false);
    expect(result.fetchedAt).toBeDefined();
  });
});
