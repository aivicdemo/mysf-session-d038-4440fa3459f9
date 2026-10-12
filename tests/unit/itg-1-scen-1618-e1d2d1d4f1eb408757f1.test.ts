import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1618: 月次締め対象期間内の全商談レコードが正常に取得され、請求対象の商談が特定される', () => {
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
        dealName: 'A社システム導入案件',
        dealAmount: 5000000,
        stageId: 'stage-negotiation',
        expectedContractDate: '2024-02-15T00:00:00Z',
        contractedDate: null,
        description: 'A社向けシステム導入',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-02-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社保守契約更新',
        dealAmount: 1200000,
        stageId: 'stage-proposal',
        expectedContractDate: '2024-01-31T00:00:00Z',
        contractedDate: '2024-01-28T00:00:00Z',
        description: 'B社の保守契約更新',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-02-05T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-08T09:15:00Z',
        updatedAt: '2024-01-28T16:45:00Z',
        createdBy: 'user-002',
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'C社コンサル案件',
        dealAmount: 3500000,
        stageId: 'stage-closed-won',
        expectedContractDate: '2024-02-10T00:00:00Z',
        contractedDate: '2024-02-08T00:00:00Z',
        description: 'C社経営コンサル',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-02-13T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-05T10:00:00Z',
        updatedAt: '2024-02-08T11:20:00Z',
        createdBy: 'user-001',
      },
      {
        dealId: 'deal-004',
        customerId: 'cust-003',
        salesRepresentativeId: 'rep-003',
        dealName: 'D社案件（期間外作成）',
        dealAmount: 800000,
        stageId: 'stage-proposal',
        expectedContractDate: '2024-03-15T00:00:00Z',
        contractedDate: null,
        description: 'D社提案',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-03-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2023-12-20T08:00:00Z',
        updatedAt: '2023-12-28T15:00:00Z',
        createdBy: 'user-003',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(savedDealOutputRecords as any);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-02-29T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(3);
    expect(result.deals[0].dealId).toBe('deal-003');
    expect(result.deals[0].updatedAt).toBe('2024-02-08T11:20:00Z');
    expect(result.deals[0].dealAmount).toBe(3500000);
    expect(result.deals[0].stageId).toBe('stage-closed-won');

    expect(result.deals[1].dealId).toBe('deal-002');
    expect(result.deals[1].updatedAt).toBe('2024-01-28T16:45:00Z');
    expect(result.deals[1].dealAmount).toBe(1200000);
    expect(result.deals[1].stageId).toBe('stage-proposal');

    expect(result.deals[2].dealId).toBe('deal-001');
    expect(result.deals[2].updatedAt).toBe('2024-01-15T14:30:00Z');
    expect(result.deals[2].dealAmount).toBe(5000000);
    expect(result.deals[2].stageId).toBe('stage-negotiation');

    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  it('期間外のレコード（deal-004: 2023-12-28）は除外される', async () => {
    const savedDealOutputRecords = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社システム導入案件',
        dealAmount: 5000000,
        stageId: 'stage-negotiation',
        expectedContractDate: '2024-02-15T00:00:00Z',
        contractedDate: null,
        description: 'A社向けシステム導入',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-02-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-004',
        dealId: 'deal-004',
        customerId: 'cust-003',
        salesRepresentativeId: 'rep-003',
        dealName: 'D社案件（期間外作成）',
        dealAmount: 800000,
        stageId: 'stage-proposal',
        expectedContractDate: '2024-03-15T00:00:00Z',
        contractedDate: null,
        description: 'D社提案',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-03-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2023-12-20T08:00:00Z',
        updatedAt: '2023-12-28T15:00:00Z',
        createdBy: 'user-003',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(savedDealOutputRecords as any);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-02-29T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(1);
    expect(result.deals[0].dealId).toBe('deal-001');
  });
});
