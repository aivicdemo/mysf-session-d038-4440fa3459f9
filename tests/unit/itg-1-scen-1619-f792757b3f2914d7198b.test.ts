import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1619: 同期間内の請求書レコードが正常に取得され、既請求状況が把握される', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定期間内に作成または更新された全商談を正しく取得し、更新日時の降順でソートして返す', async () => {
    const savedDealOutputRecords = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社新規案件',
        dealAmount: 1000000,
        stageId: '提案',
        expectedContractDate: '2024-01-15T00:00:00Z',
        contractedDate: null,
        description: '新規顧客対応',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-01-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-05T10:30:00Z',
        updatedAt: '2024-01-10T14:20:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社拡大案件',
        dealAmount: 2500000,
        stageId: '成約',
        expectedContractDate: '2024-01-20T00:00:00Z',
        contractedDate: '2024-01-18T09:00:00Z',
        description: '既存顧客の追加受注',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-01-25T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-02T08:15:00Z',
        updatedAt: '2024-01-18T16:45:00Z',
        createdBy: 'user-002',
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'cust-003',
        salesRepresentativeId: 'rep-001',
        dealName: 'C社保留案件',
        dealAmount: 800000,
        stageId: 'ヒアリング',
        expectedContractDate: '2024-02-28T00:00:00Z',
        contractedDate: null,
        description: '成約予定日が期間外',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-03-10T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-08T11:00:00Z',
        updatedAt: '2024-01-12T13:30:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-004',
        dealId: 'deal-004',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-003',
        dealName: 'D社失注案件',
        dealAmount: 500000,
        stageId: '失注',
        expectedContractDate: '2024-01-25T00:00:00Z',
        contractedDate: null,
        description: '競争に敗北',
        lossReason: '競合他社選定',
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-03T09:45:00Z',
        updatedAt: '2024-01-25T10:00:00Z',
        createdBy: 'user-003',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(savedDealOutputRecords as any);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(4);

    expect(result.deals[0].dealId).toBe('deal-002');
    expect(result.deals[0].updatedAt).toBe('2024-01-18T16:45:00Z');
    expect(result.deals[0].dealAmount).toBe(2500000);
    expect(result.deals[0].stageId).toBe('成約');
    expect(result.deals[0].contractedDate).toBe('2024-01-18T09:00:00Z');

    expect(result.deals[1].dealId).toBe('deal-001');
    expect(result.deals[1].updatedAt).toBe('2024-01-10T14:20:00Z');
    expect(result.deals[1].dealAmount).toBe(1000000);
    expect(result.deals[1].stageId).toBe('提案');
    expect(result.deals[1].contractedDate).toBeNull();

    expect(result.deals[2].dealId).toBe('deal-003');
    expect(result.deals[2].updatedAt).toBe('2024-01-12T13:30:00Z');
    expect(result.deals[2].dealAmount).toBe(800000);
    expect(result.deals[2].stageId).toBe('ヒアリング');
    expect(result.deals[2].contractedDate).toBeNull();

    expect(result.deals[3].dealId).toBe('deal-004');
    expect(result.deals[3].updatedAt).toBe('2024-01-25T10:00:00Z');
    expect(result.deals[3].dealAmount).toBe(500000);
    expect(result.deals[3].stageId).toBe('失注');
    expect(result.deals[3].lossReason).toBe('競合他社選定');

    expect(result.totalCount).toBe(4);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  it('4 件すべてのレコードが期間内のため含まれることを確認', async () => {
    const savedDealOutputRecords = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社新規案件',
        dealAmount: 1000000,
        stageId: '提案',
        expectedContractDate: '2024-01-15T00:00:00Z',
        contractedDate: null,
        description: '新規顧客対応',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-01-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-05T10:30:00Z',
        updatedAt: '2024-01-10T14:20:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社拡大案件',
        dealAmount: 2500000,
        stageId: '成約',
        expectedContractDate: '2024-01-20T00:00:00Z',
        contractedDate: '2024-01-18T09:00:00Z',
        description: '既存顧客の追加受注',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-01-25T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-02T08:15:00Z',
        updatedAt: '2024-01-18T16:45:00Z',
        createdBy: 'user-002',
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'cust-003',
        salesRepresentativeId: 'rep-001',
        dealName: 'C社保留案件',
        dealAmount: 800000,
        stageId: 'ヒアリング',
        expectedContractDate: '2024-02-28T00:00:00Z',
        contractedDate: null,
        description: '成約予定日が期間外',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-03-10T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-08T11:00:00Z',
        updatedAt: '2024-01-12T13:30:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-004',
        dealId: 'deal-004',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-003',
        dealName: 'D社失注案件',
        dealAmount: 500000,
        stageId: '失注',
        expectedContractDate: '2024-01-25T00:00:00Z',
        contractedDate: null,
        description: '競争に敗北',
        lossReason: '競合他社選定',
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-03T09:45:00Z',
        updatedAt: '2024-01-25T10:00:00Z',
        createdBy: 'user-003',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(savedDealOutputRecords as any);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals.map(d => d.dealId)).toEqual(['deal-002', 'deal-001', 'deal-003', 'deal-004']);
    expect(result.totalCount).toBe(4);
  });
});
