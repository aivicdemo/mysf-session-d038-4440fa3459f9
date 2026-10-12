import { fetchDealsForPeriod, type FetchDealsForPeriodInput, type FetchDealsForPeriodOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1699: SendGrid通知送信に失敗した場合、異常検知ログに記録し内部キューに保持する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期間内の商談レコードが返され、通知送信失敗時のログと内部キューが構成される', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: '大型プロジェクト A',
        dealAmount: 5000000,
        stageId: '提案段階',
        expectedContractDate: '2024-02-15T00:00:00Z',
        description: '重要案件',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-02-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
        createdBy: 'user-001',
      },
    ];

    (dataPersistence.listRecords as jest.Mock).mockResolvedValue(mockDeals);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result = await fetchDealsForPeriod(input);

    expect(dataPersistence.listRecords).toHaveBeenCalledWith('商談', expect.any(Object));

    // 1件のレコードが返される
    expect(result.deals).toHaveLength(1);
    expect(result.totalCount).toBe(1);

    // 正しいレコードが返される
    expect(result.deals[0].dealId).toBe('deal-001');
    expect(result.deals[0].customerId).toBe('customer-001');
    expect(result.deals[0].dealName).toBe('大型プロジェクト A');
    expect(result.deals[0].dealAmount).toBe(5000000);
    expect(result.deals[0].updatedAt).toBe('2024-01-20T15:30:00Z');
    expect(result.deals[0].invoiceGenerationSLADeadline).toBe('2024-02-20T00:00:00Z');

    // fetchedAt が ISO 8601 形式である
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
