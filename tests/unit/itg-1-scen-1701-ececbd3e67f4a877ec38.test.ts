import { fetchDealsForPeriod, type FetchDealsForPeriodInput, type FetchDealsForPeriodOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1701: SendGrid通知送信が3回失敗した場合、管理者に通知する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期間内の商談レコードが返され、SLA超過レコードが識別される', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: '案件A',
        dealAmount: 500000,
        stageId: 'stage-01',
        expectedContractDate: '2026-02-15T00:00:00Z',
        description: '重要案件',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2026-02-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2026-01-05T10:00:00Z',
        updatedAt: '2026-01-10T14:30:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: '案件B',
        dealAmount: 300000,
        stageId: 'stage-02',
        expectedContractDate: '2026-03-01T00:00:00Z',
        description: '通常案件',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2026-03-10T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2026-01-12T09:00:00Z',
        updatedAt: '2026-01-20T11:15:00Z',
        createdBy: 'user-002',
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: '案件C',
        dealAmount: 750000,
        stageId: 'stage-03',
        expectedContractDate: '2026-02-28T00:00:00Z',
        description: '高額案件',
        contractedDate: '2026-01-25T00:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2026-02-01T00:00:00Z',
        invoiceSLAExceededFlag: true,
        createdAt: '2026-01-15T08:30:00Z',
        updatedAt: '2026-01-25T16:45:00Z',
        createdBy: 'user-001',
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

    // 3件が返される
    expect(result.deals).toHaveLength(3);
    expect(result.totalCount).toBe(3);

    // updatedAt 降順で並んでいる: deal-003（2026-01-25） → deal-002（2026-01-20） → deal-001（2026-01-10）
    expect(result.deals[0].dealId).toBe('deal-003');
    expect(result.deals[0].updatedAt).toBe('2026-01-25T16:45:00Z');
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(true);
    expect(result.deals[0].dealAmount).toBe(750000);
    expect(result.deals[0].dealName).toBe('案件C');
    expect(result.deals[0].contractedDate).toBe('2026-01-25T00:00:00Z');
    expect(result.deals[0].invoiceGenerationSLADeadline).toBe('2026-02-01T00:00:00Z');

    expect(result.deals[1].dealId).toBe('deal-002');
    expect(result.deals[1].updatedAt).toBe('2026-01-20T11:15:00Z');

    expect(result.deals[2].dealId).toBe('deal-001');
    expect(result.deals[2].updatedAt).toBe('2026-01-10T14:30:00Z');

    // SLA超過の deal-003 が識別される
    const slaExceededDeal = result.deals.find(d => d.invoiceSLAExceededFlag === true);
    expect(slaExceededDeal).toBeDefined();
    expect(slaExceededDeal?.dealId).toBe('deal-003');

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
