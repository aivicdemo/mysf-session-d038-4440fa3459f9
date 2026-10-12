import { fetchDealsForPeriod, type FetchDealsForPeriodInput, type FetchDealsForPeriodOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1700: SendGrid通知送信失敗時、最大3回まで指数バックオフで再試行する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期間内の商談レコードが正しく返される', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'd001',
        customerId: 'cust-001',
        salesRepresentativeId: 'sales-001',
        dealName: '大型案件A',
        dealAmount: 5000000,
        stageId: '提案中',
        expectedContractDate: '2026-02-15T00:00:00Z',
        description: '重要顧客向け提案',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2026-02-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2026-01-05T10:00:00Z',
        updatedAt: '2026-01-20T14:30:00Z',
        createdBy: 'admin-001',
      },
      {
        id: 'deal-002',
        dealId: 'd002',
        customerId: 'cust-002',
        salesRepresentativeId: 'sales-002',
        dealName: '中型案件B',
        dealAmount: 2000000,
        stageId: '交渉中',
        expectedContractDate: '2026-01-25T00:00:00Z',
        description: '通常案件',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2026-02-10T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2026-01-10T09:00:00Z',
        updatedAt: '2026-01-18T11:20:00Z',
        createdBy: 'admin-001',
      },
    ];

    (dataPersistence.listRecords as jest.Mock).mockResolvedValue(mockDeals);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2026-01-01T00:00:00Z',
      periodEndDateTime: '2026-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result = await fetchDealsForPeriod(input);

    expect(dataPersistence.listRecords).toHaveBeenCalledWith('商談', expect.any(Object));

    // 2件が返される
    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    // updatedAt 降順: deal-001（2026-01-20T14:30:00Z） → deal-002（2026-01-18T11:20:00Z）
    expect(result.deals[0].dealId).toBe('d001');
    expect(result.deals[0].customerId).toBe('cust-001');
    expect(result.deals[0].salesRepresentativeId).toBe('sales-001');
    expect(result.deals[0].dealName).toBe('大型案件A');
    expect(result.deals[0].dealAmount).toBe(5000000);
    expect(result.deals[0].stageId).toBe('提案中');
    expect(result.deals[0].expectedContractDate).toBe('2026-02-15T00:00:00Z');
    expect(result.deals[0].description).toBe('重要顧客向け提案');
    expect(result.deals[0].contractedDate).toBeNull();
    expect(result.deals[0].lossReason).toBeNull();
    expect(result.deals[0].invoiceGenerationSLADeadline).toBe('2026-02-20T00:00:00Z');
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(false);
    expect(result.deals[0].updatedAt).toBe('2026-01-20T14:30:00Z');

    expect(result.deals[1].dealId).toBe('d002');
    expect(result.deals[1].customerId).toBe('cust-002');
    expect(result.deals[1].salesRepresentativeId).toBe('sales-002');
    expect(result.deals[1].dealName).toBe('中型案件B');
    expect(result.deals[1].dealAmount).toBe(2000000);
    expect(result.deals[1].stageId).toBe('交渉中');
    expect(result.deals[1].expectedContractDate).toBe('2026-01-25T00:00:00Z');
    expect(result.deals[1].description).toBe('通常案件');
    expect(result.deals[1].contractedDate).toBeNull();
    expect(result.deals[1].lossReason).toBeNull();
    expect(result.deals[1].invoiceGenerationSLADeadline).toBe('2026-02-10T00:00:00Z');
    expect(result.deals[1].invoiceSLAExceededFlag).toBe(false);
    expect(result.deals[1].updatedAt).toBe('2026-01-18T11:20:00Z');

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
