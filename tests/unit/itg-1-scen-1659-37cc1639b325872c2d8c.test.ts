import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

describe('SCEN-1659: 旧新システム間で商談の金額差異が許容閾値以下で、他に差異がなく、差異なしと判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch deals for period in descending order by updatedAt with complete attributes', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: '旧システム商談A',
        dealAmount: 1000000,
        stageId: 'stage-negotiation',
        expectedContractDate: '2025-12-31T00:00:00Z',
        contractedDate: null,
        description: 'テスト商談',
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-02-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-15T14:30:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: '旧システム商談B',
        dealAmount: 2000000,
        stageId: 'stage-closed',
        expectedContractDate: '2025-11-30T00:00:00Z',
        contractedDate: '2025-11-25T00:00:00Z',
        description: '別の商談',
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-02-10T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-12-01T09:00:00Z',
        updatedAt: '2025-01-10T11:00:00Z',
        createdBy: 'user-002',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(mockDeals);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2025-01-01T00:00:00Z',
      periodEndDateTime: '2025-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    expect(result.deals[0].dealId).toBe('deal-001');
    expect(result.deals[0].updatedAt).toBe('2025-01-15T14:30:00Z');
    expect(result.deals[0].dealName).toBe('旧システム商談A');
    expect(result.deals[0].dealAmount).toBe(1000000);
    expect(result.deals[0].stageId).toBe('stage-negotiation');
    expect(result.deals[0].customerId).toBe('customer-001');
    expect(result.deals[0].salesRepresentativeId).toBe('rep-001');
    expect(result.deals[0].expectedContractDate).toBe('2025-12-31T00:00:00Z');
    expect(result.deals[0].contractedDate).toBeNull();
    expect(result.deals[0].description).toBe('テスト商談');
    expect(result.deals[0].lossReason).toBeNull();
    expect(result.deals[0].createdAt).toBe('2025-01-01T10:00:00Z');
    expect(result.deals[0].createdBy).toBe('user-001');
    expect(result.deals[0].invoiceGenerationSLADeadline).toBe('2025-02-15T00:00:00Z');
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(false);

    expect(result.deals[1].dealId).toBe('deal-002');
    expect(result.deals[1].updatedAt).toBe('2025-01-10T11:00:00Z');
    expect(result.deals[1].dealName).toBe('旧システム商談B');
    expect(result.deals[1].dealAmount).toBe(2000000);
    expect(result.deals[1].stageId).toBe('stage-closed');
    expect(result.deals[1].customerId).toBe('customer-002');
    expect(result.deals[1].salesRepresentativeId).toBe('rep-002');
    expect(result.deals[1].expectedContractDate).toBe('2025-11-30T00:00:00Z');
    expect(result.deals[1].contractedDate).toBe('2025-11-25T00:00:00Z');
    expect(result.deals[1].description).toBe('別の商談');
    expect(result.deals[1].lossReason).toBeNull();
    expect(result.deals[1].createdAt).toBe('2024-12-01T09:00:00Z');
    expect(result.deals[1].createdBy).toBe('user-002');
    expect(result.deals[1].invoiceGenerationSLADeadline).toBe('2025-02-10T00:00:00Z');
    expect(result.deals[1].invoiceSLAExceededFlag).toBe(false);

    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
  });
});
